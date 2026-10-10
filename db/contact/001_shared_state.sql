-- Review-only, additive migration for the dedicated Grady contact database.
-- No runtime migration, legacy user table, or existing project database changes.
BEGIN;

CREATE SCHEMA IF NOT EXISTS grady_contact;

CREATE TABLE IF NOT EXISTS grady_contact.rate_windows (
  namespace text NOT NULL CHECK (namespace ~ '^[a-z0-9_-]{1,64}$'),
  kind text NOT NULL CHECK (kind IN ('session', 'submit')),
  scope text NOT NULL CHECK (scope IN ('global', 'client')),
  identifier text NOT NULL CHECK (identifier = 'global' OR identifier ~ '^[A-Za-z0-9_-]{43}$'),
  request_count integer NOT NULL CHECK (request_count > 0),
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (namespace, kind, scope, identifier)
);
CREATE INDEX IF NOT EXISTS rate_windows_expiry ON grady_contact.rate_windows (namespace, expires_at);

CREATE TABLE IF NOT EXISTS grady_contact.submission_receipts (
  namespace text NOT NULL CHECK (namespace ~ '^[a-z0-9_-]{1,64}$'),
  challenge_key text NOT NULL CHECK (challenge_key ~ '^[A-Za-z0-9_-]{43}$'),
  payload_hash text NOT NULL CHECK (payload_hash ~ '^[A-Za-z0-9_-]{43}$'),
  provider_key text NOT NULL CHECK (provider_key ~ '^grady-contact/[A-Za-z0-9_-]{43}$'),
  state text NOT NULL CHECK (state IN ('pending', 'accepted', 'unconfirmed')),
  lease_owner uuid,
  lease_until timestamptz,
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (namespace, challenge_key),
  CHECK ((state = 'pending' AND lease_owner IS NOT NULL AND lease_until IS NOT NULL)
    OR (state <> 'pending' AND lease_owner IS NULL AND lease_until IS NULL))
);
CREATE INDEX IF NOT EXISTS submission_receipts_expiry ON grady_contact.submission_receipts (namespace, expires_at);

CREATE OR REPLACE FUNCTION grady_contact.consume_rate(p_namespace text, p_kind text, p_client_key text)
RETURNS TABLE (allowed boolean, retry_after_seconds integer, now_ms bigint)
LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, grady_contact, pg_temp AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_global_limit integer;
  v_client_limit integer;
  v_global_window interval;
  v_count integer;
  v_expiry timestamptz;
BEGIN
  IF p_namespace IS NULL OR p_namespace !~ '^[a-z0-9_-]{1,64}$'
    OR p_kind IS NULL OR p_kind NOT IN ('session', 'submit')
    OR p_client_key IS NULL OR p_client_key !~ '^[A-Za-z0-9_-]{43}$' THEN
    RAISE EXCEPTION 'invalid contact state input';
  END IF;
  v_global_limit := CASE p_kind WHEN 'session' THEN 100 ELSE 20 END;
  v_client_limit := CASE p_kind WHEN 'session' THEN 20 ELSE 5 END;
  v_global_window := CASE p_kind WHEN 'session' THEN interval '15 minutes' ELSE interval '1 hour' END;

  -- All workers lock global before client; do not allocate client rows if capped.
  INSERT INTO grady_contact.rate_windows AS r VALUES (p_namespace, p_kind, 'global', 'global', 1, v_now + v_global_window)
  ON CONFLICT (namespace, kind, scope, identifier) DO UPDATE SET
    request_count = CASE WHEN r.expires_at <= v_now THEN 1 ELSE least(r.request_count + 1, v_global_limit + 1) END,
    expires_at = CASE WHEN r.expires_at <= v_now THEN v_now + v_global_window ELSE r.expires_at END
  RETURNING r.request_count, r.expires_at INTO v_count, v_expiry;
  -- The global row serializes this namespace/kind BEFORE cleanup. Otherwise
  -- cleaners could each lock an expired row that the other subsequently needs.
  DELETE FROM grady_contact.rate_windows r WHERE (r.namespace, r.kind, r.scope, r.identifier) IN (
    SELECT old.namespace, old.kind, old.scope, old.identifier FROM grady_contact.rate_windows old
    WHERE old.namespace = p_namespace AND old.kind = p_kind AND old.scope = 'client' AND old.expires_at <= v_now
    ORDER BY old.expires_at LIMIT 100 FOR UPDATE SKIP LOCKED
  );
  now_ms := floor(extract(epoch FROM v_now) * 1000)::bigint;
  IF v_count > v_global_limit THEN
    allowed := false; retry_after_seconds := greatest(1, ceil(extract(epoch FROM v_expiry - v_now))::integer);
    RETURN NEXT; RETURN;
  END IF;

  INSERT INTO grady_contact.rate_windows AS r VALUES (p_namespace, p_kind, 'client', p_client_key, 1, v_now + interval '15 minutes')
  ON CONFLICT (namespace, kind, scope, identifier) DO UPDATE SET
    request_count = CASE WHEN r.expires_at <= v_now THEN 1 ELSE least(r.request_count + 1, v_client_limit + 1) END,
    expires_at = CASE WHEN r.expires_at <= v_now THEN v_now + interval '15 minutes' ELSE r.expires_at END
  RETURNING r.request_count, r.expires_at INTO v_count, v_expiry;
  allowed := v_count <= v_client_limit;
  retry_after_seconds := CASE WHEN allowed THEN 0 ELSE greatest(1, ceil(extract(epoch FROM v_expiry - v_now))::integer) END;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION grady_contact.claim_submission(
  p_namespace text, p_challenge_key text, p_payload_hash text, p_provider_key text, p_lease_owner uuid
)
RETURNS TABLE (decision text, lease_owner uuid, retry_after_seconds integer)
LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, grady_contact, pg_temp AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_inserted integer;
  v_row grady_contact.submission_receipts%ROWTYPE;
BEGIN
  IF p_namespace IS NULL OR p_namespace !~ '^[a-z0-9_-]{1,64}$'
    OR p_challenge_key IS NULL OR p_challenge_key !~ '^[A-Za-z0-9_-]{43}$'
    OR p_payload_hash IS NULL OR p_payload_hash !~ '^[A-Za-z0-9_-]{43}$'
    OR p_provider_key IS NULL OR p_provider_key !~ '^grady-contact/[A-Za-z0-9_-]{43}$'
    OR p_lease_owner IS NULL THEN RAISE EXCEPTION 'invalid contact state input'; END IF;

  -- Short transaction-scoped namespace lock prevents cleanup/claim lock cycles.
  -- It is released before the external provider call. Finish locks only one row.
  PERFORM pg_advisory_xact_lock(hashtextextended('grady-contact-receipts/' || p_namespace, 0));
  DELETE FROM grady_contact.submission_receipts r WHERE (r.namespace, r.challenge_key) IN (
    SELECT old.namespace, old.challenge_key FROM grady_contact.submission_receipts old
    WHERE old.namespace = p_namespace AND old.expires_at <= v_now
    ORDER BY old.expires_at LIMIT 100 FOR UPDATE SKIP LOCKED
  );
  INSERT INTO grady_contact.submission_receipts VALUES (
    p_namespace, p_challenge_key, p_payload_hash, p_provider_key, 'pending', p_lease_owner,
    v_now + interval '60 seconds', v_now + interval '2 hours'
  ) ON CONFLICT (namespace, challenge_key) DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  SELECT r.* INTO STRICT v_row FROM grady_contact.submission_receipts r
    WHERE r.namespace = p_namespace AND r.challenge_key = p_challenge_key FOR UPDATE;
  v_now := clock_timestamp();
  IF v_row.payload_hash <> p_payload_hash OR v_row.provider_key <> p_provider_key THEN
    decision := 'payload-mismatch';
  ELSIF v_row.state = 'accepted' THEN
    decision := 'accepted';
  ELSIF v_inserted = 1 THEN
    decision := 'owned'; lease_owner := p_lease_owner;
  ELSIF v_row.state = 'pending' AND v_row.lease_until > v_now THEN
    decision := 'busy'; retry_after_seconds := least(60, greatest(1, ceil(extract(epoch FROM v_row.lease_until - v_now))::integer));
  ELSE
    UPDATE grady_contact.submission_receipts r SET state = 'pending', lease_owner = p_lease_owner, lease_until = v_now + interval '60 seconds'
      WHERE r.namespace = p_namespace AND r.challenge_key = p_challenge_key;
    decision := 'owned'; lease_owner := p_lease_owner;
  END IF;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION grady_contact.finish_submission(p_namespace text, p_challenge_key text, p_lease_owner uuid, p_outcome text)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, grady_contact, pg_temp AS $$
DECLARE v_count integer;
BEGIN
  IF p_outcome IS NULL OR p_outcome NOT IN ('accepted', 'unconfirmed') THEN RAISE EXCEPTION 'invalid contact outcome'; END IF;
  UPDATE grady_contact.submission_receipts r SET state = p_outcome, lease_owner = NULL, lease_until = NULL
    WHERE r.namespace = p_namespace AND r.challenge_key = p_challenge_key AND r.state = 'pending'
      AND r.lease_owner = p_lease_owner AND r.lease_until > clock_timestamp();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count = 1;
END;
$$;

REVOKE ALL ON SCHEMA grady_contact FROM PUBLIC;
REVOKE ALL ON FUNCTION grady_contact.consume_rate(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION grady_contact.claim_submission(text, text, text, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION grady_contact.finish_submission(text, text, uuid, text) FROM PUBLIC;
COMMIT;

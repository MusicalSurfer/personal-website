# Dedicated contact state: review and setup handoff

This directory contains an additive migration for a **new dedicated Neon contact
database**. No remote database has been provisioned, connected, or modified by
the implementation. Do not apply the legacy `db/migration.sql`: it contains
unrelated user-table operations. Existing website/client/Pets databases remain
outside this change.

Review `001_shared_state.sql` before authorizing application by the dedicated
database's schema owner. It creates only schema `grady_contact`, two tables,
their expiry indexes, and three invoker functions. It does not create a login,
alter an existing application table, or grant access to PUBLIC. The runtime
never executes migrations. Reapplying is supported for this initial schema;
`IF NOT EXISTS` does not validate an unexpected pre-existing table definition.

Use an approved separate runtime login named `grady_contact_runtime`. Review
`002_runtime_grants.sql` before applying as the schema owner after that login
exists. These grants permit only schema usage, the two tables' required DML,
and the three functions. No schema creation or owner privileges are needed by
the contact API. Confirm effective inherited privileges separately: grants
cannot remove privileges inherited from another role. Do not use an owner
connection string as the runtime credential.

## State contract

- `consume_rate(namespace, kind, client_key)` atomically updates a shared global
  bucket, then a client bucket. Session issuance allows 20/client and 100/global
  per 15 minutes. Submission attempts allow 5/client per 15 minutes and 20/global
  per hour. Invalid requests and cached retries consume capacity too. A client
  rejection still consumes global capacity. Windows begin with their first
  request, not a rolling time window. Blocked global requests allocate no new
  client rows. Database time controls both limits and form timestamps.
- `claim_submission(namespace, challenge_key, payload_hash, provider_key,
  lease_owner)` persists one message identity and gives one worker a 60-second
  lease. Matching accepted retries reuse confirmation. Active leases and changed
  payloads are rejected; unconfirmed or expired leases allow same-payload retry.
- `finish_submission(namespace, challenge_key, lease_owner, outcome)` accepts
  `accepted` or `unconfirmed`, and updates only the current unexpired lease.
  Stale workers cannot overwrite a later worker's receipt. Public success
  requires provider acceptance **and** persisted acceptance, or a cached
  accepted receipt.

Each adapter call is one parameterized database statement/transaction. Rate
calls serialize on the namespace/kind global row before cleanup/client rows.
Receipt claims take a short transaction-scoped namespace advisory lock before
cleanup and the requested row; they release it before the email provider call.
Finish locks only its one receipt. This ordering avoids cleaners each holding
a row that the other caller subsequently needs.

Receipts expire after two hours; replay challenges expire after one hour.
Cleanup is indexed and limited to 100 expired rows per call. Expired receipts
are not extended by retries. Only HMAC identifiers, opaque provider keys,
counters, timestamps, leases, and outcomes are stored. No raw IP, signed token,
name, email, message, or provider secret is persisted here. Resend's separate
email retention is outside this database contract.

There is no distributed transaction with Resend. An ambiguous claim causes no
send until its lease can be recovered. An uncertain acceptance write stays
unconfirmed publicly; same-payload retry recovers a cached receipt or reuses the
same provider idempotency key. Exactly-once inbox delivery is not promised.

## Server configuration

The operator enters secrets directly in approved server secret storage:

- `CONTACT_RATE_LIMIT_MODE=vercel-postgres` and the real platform `VERCEL=1`.
- `CONTACT_DATABASE_URL`: the dedicated least-privilege login's PostgreSQL URL
  on a `*.neon.tech` host, with database path and `sslmode=require`. The parser
  rejects other URL options, endpoints, ports, or missing credentials. Format
  the approved URL with only `sslmode=require`; never paste it into chat/logs.
- `CONTACT_STATE_NAMESPACE`: a stable lowercase identifier, 1–64 letters,
  digits, underscores or hyphens, such as `production`. Preserve it across
  releases; changing it resets shared policy state. Preview/test credentials
  and namespace must be isolated from production, preferably a separate branch.
- The origin, Resend sender/recipient/key and signing secret described in the
  root README. HTTPS is mandatory in this mode.

The client-IP header is fixed to `x-vercel-forwarded-for`; a conflicting
`CONTACT_CLIENT_IP_HEADER` fails configuration. Verify the real Vercel deployment
overwrites spoofed headers and review any upstream proxy aggregation before
enabling delivery. Local unit tests do not prove this provenance. A forwarded
list or malformed IP is rejected; equivalent IPv6 forms share one HMAC bucket.

Neon uses its primary for shared state. No local fallback or replica read is
used. HTTP queries have a three-second timeout; Resend has fifteen seconds;
the route exports a 30-second duration and the receipt lease is sixty seconds.
Missing config, inaccessible database, quota, missing schema, invalid response,
or storage uncertainty fails closed with generic visitor responses. Credentials
and provider diagnostics are not logged or returned.

## Validation and remaining release gates

`npm test` executes the migration in **local PGlite PostgreSQL/WASM** using only
synthetic records. It exercises SQL semantics, limits, receipt recovery,
overlapping handlers, reopened local persisted data, role grants, parameter
binding, and fail-closed fixtures. PGlite serializes queries: this is **not**
multi-session Neon lock stress testing, live Neon connectivity, production
durability verification, or Vercel proxy verification. No test sends email.

Before release: independently review the exact SQL/build; obtain action-time
approval for remote provisioning and schema/grant application; have the owner
enter dedicated secrets; verify runtime privileges, deployed primary/timeout
behavior and parallel workers; verify proxy provenance; complete exact-build
UI/accessibility QA and an explicitly approved real-email fixture. Public
deployment remains a separately approved action.

Official references: [Neon HTTP driver](https://neon.com/docs/serverless/serverless-driver),
[PostgreSQL locking](https://www.postgresql.org/docs/current/explicit-locking.html),
[Vercel request headers](https://vercel.com/docs/headers/request-headers),
[Vercel function duration](https://vercel.com/docs/functions/configuring-functions/duration),
[PGlite](https://pglite.dev/docs/), and
[Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys).

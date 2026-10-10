-- Review-only grants. This does NOT create a login or a database.
-- The approved dedicated login must be named grady_contact_runtime.
-- Run separately, as the schema owner, ONLY in the dedicated contact database.
BEGIN;
GRANT USAGE ON SCHEMA grady_contact TO grady_contact_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  grady_contact.rate_windows, grady_contact.submission_receipts TO grady_contact_runtime;
GRANT EXECUTE ON FUNCTION grady_contact.consume_rate(text, text, text) TO grady_contact_runtime;
GRANT EXECUTE ON FUNCTION grady_contact.claim_submission(text, text, text, text, uuid) TO grady_contact_runtime;
GRANT EXECUTE ON FUNCTION grady_contact.finish_submission(text, text, uuid, text) TO grady_contact_runtime;
COMMIT;

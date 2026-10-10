import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";

const queries = {
  rate: "SELECT * FROM grady_contact.consume_rate($1, $2, $3)",
  claim: "SELECT * FROM grady_contact.claim_submission($1, $2, $3, $4, $5::uuid)",
  finish: "SELECT grady_contact.finish_submission($1, $2, $3::uuid, $4) AS persisted",
};

function integer(value) {
  if (typeof value !== "number" && !(typeof value === "string" && /^\d+$/.test(value))) return NaN;
  return Number(value);
}

// Only server route imports this. An injectable query function supports offline tests.
export function createPostgresState({ databaseUrl, query } = {}) {
  const sql = query ? null : neon(databaseUrl);
  const run = query || ((text, params) => sql.query(text, params, { fetchOptions: { signal: AbortSignal.timeout(3000), cache: "no-store", redirect: "error" } }));
  async function one(text, params) {
    const rows = await run(text, params);
    if (!Array.isArray(rows) || rows.length !== 1 || !rows[0] || typeof rows[0] !== "object" || Array.isArray(rows[0])) throw new Error("invalid_state_response");
    return rows[0];
  }
  return {
    async consumeRate({ namespace, kind, clientKey }) {
      const row = await one(queries.rate, [namespace, kind, clientKey]);
      const nowMs = integer(row.now_ms), retryAfterSeconds = integer(row.retry_after_seconds);
      if (typeof row.allowed !== "boolean" || !Number.isSafeInteger(nowMs) || nowMs <= 0 || !Number.isSafeInteger(retryAfterSeconds) || retryAfterSeconds < 0 || (row.allowed ? retryAfterSeconds !== 0 : retryAfterSeconds < 1)) throw new Error("invalid_rate_response");
      return { allowed: row.allowed, nowMs, retryAfterSeconds };
    },
    async claimSubmission({ namespace, challengeKey, payloadHash, providerKey }) {
      const leaseOwner = randomUUID();
      const row = await one(queries.claim, [namespace, challengeKey, payloadHash, providerKey, leaseOwner]);
      if (row.decision === "owned" && row.lease_owner === leaseOwner) return { kind: "owned", leaseOwner };
      if (["accepted", "payload-mismatch"].includes(row.decision)) return { kind: row.decision };
      const retryAfterSeconds = integer(row.retry_after_seconds);
      if (row.decision === "busy" && Number.isSafeInteger(retryAfterSeconds) && retryAfterSeconds >= 1 && retryAfterSeconds <= 60) return { kind: "busy", retryAfterSeconds };
      throw new Error("invalid_claim_response");
    },
    async finishSubmission({ namespace, challengeKey, leaseOwner, outcome }) {
      if (!["accepted", "unconfirmed"].includes(outcome)) throw new Error("invalid_outcome");
      const row = await one(queries.finish, [namespace, challengeKey, leaseOwner, outcome]);
      if (typeof row.persisted !== "boolean") throw new Error("invalid_finish_response");
      return { persisted: row.persisted };
    },
  };
}

import { randomUUID } from "node:crypto";

// Explicit local/test adapter only. Vercel configuration never selects this store.
export function createRateLimiter() {
  const entries = new Map();
  return { take(key, limit, duration, now) {
    for (const [id, entry] of entries) if (entry.expires <= now) entries.delete(id);
    let entry = entries.get(key);
    if (!entry) {
      if (entries.size >= 1024) return 60;
      entry = { count: 0, expires: now + duration }; entries.set(key, entry);
    }
    if (entry.count >= limit) return Math.max(1, Math.ceil((entry.expires - now) / 1000));
    entry.count++; return 0;
  } };
}

export function createLocalState({ clock = Date.now, limiter = createRateLimiter() } = {}) {
  const receipts = new Map();
  return {
    async consumeRate({ namespace, kind, clientKey }) {
      const nowMs = clock();
      const retryAfterSeconds = limiter.take(namespace + ":" + kind + ":global", kind === "session" ? 100 : 20, kind === "session" ? 900_000 : 3_600_000, nowMs)
        || limiter.take(namespace + ":" + kind + ":" + clientKey, kind === "session" ? 20 : 5, 900_000, nowMs);
      return { allowed: retryAfterSeconds === 0, retryAfterSeconds, nowMs };
    },
    async claimSubmission({ namespace, challengeKey, payloadHash, providerKey }) {
      const now = clock();
      for (const [key, row] of receipts) if (row.expires <= now) receipts.delete(key);
      const key = namespace + ":" + challengeKey;
      let row = receipts.get(key);
      if (row && (row.payloadHash !== payloadHash || row.providerKey !== providerKey)) return { kind: "payload-mismatch" };
      if (row?.state === "accepted") return { kind: "accepted" };
      if (row?.state === "pending" && row.leaseUntil > now) return { kind: "busy", retryAfterSeconds: Math.ceil((row.leaseUntil - now) / 1000) };
      if (!row) {
        if (receipts.size >= 1024) throw new Error("local_capacity");
        row = { payloadHash, providerKey, expires: now + 7_200_000 }; receipts.set(key, row);
      }
      row.state = "pending"; row.leaseOwner = randomUUID(); row.leaseUntil = now + 60_000;
      return { kind: "owned", leaseOwner: row.leaseOwner };
    },
    async finishSubmission({ namespace, challengeKey, leaseOwner, outcome }) {
      const row = receipts.get(namespace + ":" + challengeKey);
      if (!row || row.state !== "pending" || row.leaseOwner !== leaseOwner || row.leaseUntil <= clock()) return { persisted: false };
      row.state = outcome; row.leaseUntil = 0; return { persisted: true };
    },
  };
}

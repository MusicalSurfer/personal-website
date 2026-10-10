import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHmac, randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { createPostgresState } from "../app/api/contact/postgres-state.mjs";
import { createContactHandlers, canonicalClientIp } from "../app/api/contact/contact-core.mjs";
import { readContactConfig } from "../app/api/contact/resend-delivery.mjs";

// Actual SQL in local PostgreSQL/WASM, not a remote Neon connection. PGlite
// serializes database queries: overlapping handler tests are NOT multi-session
// Postgres lock stress tests or proof of Vercel header provenance.
const migration = await readFile(new URL("../db/contact/001_shared_state.sql", import.meta.url), "utf8");
let db;
before(async () => { db = new PGlite(); await db.exec(migration); });
after(async () => { await db.close(); });
const hash = value => createHmac("sha256", "synthetic-fixture-only").update(value).digest("base64url");
function store(query = async (text, params) => (await db.query(text, params)).rows) { return createPostgresState({ query }); }
function receipt(namespace, suffix = "one") {
  return { namespace, challengeKey: hash(suffix), payloadHash: hash("payload"), providerKey: "grady-contact/" + hash("provider/" + suffix) };
}
const config = { origin: "https://studio.example.test", secret: "fixture-not-production-123456789012345678901234567890", from: "sender@example.test", recipient: "owner@example.test", ipHeader: "x-vercel-forwarded-for", namespace: "handler_fixture" };
const fields = { name: "Synthetic Tester", email: "visitor@example.test", service: "website-management", message: "A synthetic local fixture, never sent to an email provider.", website: "" };
function request(method, body, ip = "192.0.2.20", overrides = {}) {
  return new Request(config.origin + "/api/contact", { method, headers: { origin: config.origin, "x-vercel-forwarded-for": ip, ...(method === "POST" ? { "content-type": "application/json" } : {}), ...overrides }, ...(method === "POST" ? { body: JSON.stringify(body) } : {}) });
}
function token() {
  const payload = (Date.now() - 4000) + "." + randomUUID();
  return payload + "." + createHmac("sha256", config.secret).update(payload).digest("base64url");
}
function worker(state, deliver, namespace) {
  return createContactHandlers({ getConfig: () => ({ ...config, namespace }), getStore: () => state, deliver, clock: () => 1 });
}

test("Vercel mode requires complete Neon settings and the fixed platform header; no local fallback", () => {
  const env = { VERCEL: "1", CONTACT_RATE_LIMIT_MODE: "vercel-postgres", CONTACT_ORIGIN: config.origin, CONTACT_FORM_SECRET: config.secret, CONTACT_FROM: config.from, CONTACT_TO: config.recipient, RESEND_API_KEY: "fixture-not-a-provider-key", CONTACT_DATABASE_URL: "postgresql://fixture:fixture@fixture.neon.tech/contact?sslmode=require", CONTACT_STATE_NAMESPACE: "production" };
  assert.equal(readContactConfig(env).ipHeader, "x-vercel-forwarded-for");
  assert.equal(readContactConfig(env).namespace, "production");
  for (const key of Object.keys(env)) assert.equal(readContactConfig({ ...env, [key]: "" }), null, key);
  for (const override of [{ VERCEL: "true" }, { CONTACT_RATE_LIMIT_MODE: "single-instance" }, { AWS_LAMBDA_FUNCTION_NAME: "fixture" }, { CONTACT_CLIENT_IP_HEADER: "x-forwarded-for" }, { CONTACT_ORIGIN: "http://127.0.0.1:3326" }, { CONTACT_STATE_NAMESPACE: "Production/visitor" }, { CONTACT_STATE_NAMESPACE: "x".repeat(65) }, ...[
    "postgresql://fixture:fixture@localhost/contact?sslmode=require", "postgresql://fixture:fixture@fixture.neon.tech.attacker.test/contact?sslmode=require", "https://fixture.neon.tech/contact?sslmode=require", "postgresql://fixture@fixture.neon.tech/contact?sslmode=require", "postgresql://fixture:fixture@fixture.neon.tech/contact", "postgresql://fixture:fixture@fixture.neon.tech/contact?sslmode=disable", "postgresql://fixture:fixture@fixture.neon.tech/contact?sslmode=require&sslmode=disable", "postgresql://fixture:fixture@fixture.neon.tech/contact?sslmode=require&host=attacker.test",
  ].map(CONTACT_DATABASE_URL => ({ CONTACT_DATABASE_URL }))]) assert.equal(readContactConfig({ ...env, ...override }), null);
});

test("actual additive migration is repeatable and leaves unrelated tables intact", async () => {
  await db.exec("CREATE TABLE public.unrelated_fixture (value text); INSERT INTO public.unrelated_fixture VALUES ('preserve');");
  await db.exec(migration);
  assert.deepEqual((await db.query("SELECT * FROM public.unrelated_fixture")).rows, [{ value: "preserve" }]);
  const functions = (await db.query("SELECT p.proname, p.prosecdef FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='grady_contact'")).rows;
  assert.equal(functions.length, 3);
  assert.ok(functions.every(row => row.prosecdef === false));
  const columns = (await db.query("SELECT column_name FROM information_schema.columns WHERE table_schema='grady_contact'")).rows.map(row => row.column_name);
  for (const forbidden of ["email", "name", "message", "ip", "token", "api_key"]) assert.ok(!columns.includes(forbidden));
});

test("runtime grants allow contact operations but no schema creation or unrelated-table reads", async () => {
  await db.exec("CREATE ROLE grady_contact_runtime; CREATE ROLE unprivileged_fixture;");
  await db.exec(await readFile(new URL("../db/contact/002_runtime_grants.sql", import.meta.url), "utf8"));
  await db.exec("SET ROLE unprivileged_fixture;");
  await assert.rejects(store().consumeRate({ namespace: "permissions", kind: "session", clientKey: hash("client") }));
  await db.exec("RESET ROLE; SET ROLE grady_contact_runtime;");
  try {
    assert.equal((await store().consumeRate({ namespace: "permissions", kind: "session", clientKey: hash("client") })).allowed, true);
    const args = receipt("permissions");
    const claim = await store().claimSubmission(args);
    assert.equal((await store().finishSubmission({ ...args, leaseOwner: claim.leaseOwner, outcome: "accepted" })).persisted, true);
    await assert.rejects(db.query("SELECT * FROM public.unrelated_fixture"));
    await assert.rejects(db.query("CREATE TABLE grady_contact.forbidden_fixture (value text)"));
  } finally { await db.exec("RESET ROLE;"); }
});

test("shared rate caps and namespace isolation survive replacing worker adapters", async () => {
  const adapters = [store(), store()];
  const args = { namespace: "rate_client", kind: "submit", clientKey: hash("client") };
  const results = await Promise.all(Array.from({ length: 10 }, (_, i) => adapters[i % 2].consumeRate(args)));
  assert.equal(results.filter(row => row.allowed).length, 5);
  assert.ok(results.filter(row => !row.allowed).every(row => row.retryAfterSeconds >= 1));
  assert.equal((await store().consumeRate(args)).allowed, false);
  assert.equal((await store().consumeRate({ ...args, namespace: "rate_other" })).allowed, true);
  const global = await Promise.all(Array.from({ length: 40 }, (_, i) => adapters[i % 2].consumeRate({ ...args, namespace: "rate_global", clientKey: hash(String(i)) })));
  assert.equal(global.filter(row => row.allowed).length, 20);
  const rows = (await db.query("SELECT count(*)::integer AS total FROM grady_contact.rate_windows WHERE namespace='rate_global' AND scope='client'")).rows;
  assert.equal(rows[0].total, 20, "global cap prevents unbounded per-IP allocation");
  await db.query("UPDATE grady_contact.rate_windows SET expires_at=clock_timestamp()-interval '1 second' WHERE namespace=$1", [args.namespace]);
  assert.equal((await store().consumeRate(args)).allowed, true);
});

test("session limits differ from submit limits and use PostgreSQL time", async () => {
  const result = await Promise.all(Array.from({ length: 21 }, () => store().consumeRate({ namespace: "rate_session", kind: "session", clientKey: hash("one") })));
  assert.equal(result.filter(row => row.allowed).length, 20);
  assert.ok(Math.abs(result[0].nowMs - Date.now()) < 10_000);
  const global = await Promise.all(Array.from({ length: 105 }, (_, i) => store().consumeRate({ namespace: "rate_session_global", kind: "session", clientKey: hash(String(i)) })));
  assert.equal(global.filter(row => row.allowed).length, 100);
  const h = worker(store(), () => { throw new Error("GET must not deliver"); }, "clock_fixture");
  const response = await h.GET(request("GET"));
  assert.equal(response.status, 200);
  const issued = Number((await response.json()).token.split(".")[0]);
  assert.ok(Math.abs(issued - Date.now()) < 10_000, "application clock=1 is ignored in favor of store time");
});

test("one shared receipt lease, changed-payload rejection, stale owner rejection and expiry recovery", async () => {
  const args = receipt("lease_fixture");
  const claims = await Promise.all(Array.from({ length: 8 }, () => store().claimSubmission(args)));
  assert.equal(claims.filter(row => row.kind === "owned").length, 1);
  assert.equal(claims.filter(row => row.kind === "busy").length, 7);
  assert.equal((await store().claimSubmission({ ...args, payloadHash: hash("changed") })).kind, "payload-mismatch");
  const old = claims.find(row => row.kind === "owned");
  await db.query("UPDATE grady_contact.submission_receipts SET lease_until=clock_timestamp()-interval '1 second' WHERE namespace=$1", [args.namespace]);
  assert.equal((await store().finishSubmission({ ...args, leaseOwner: old.leaseOwner, outcome: "accepted" })).persisted, false);
  const current = await store().claimSubmission(args);
  assert.equal(current.kind, "owned");
  assert.notEqual(current.leaseOwner, old.leaseOwner);
  assert.equal((await store().finishSubmission({ ...args, leaseOwner: old.leaseOwner, outcome: "accepted" })).persisted, false);
  assert.equal((await store().finishSubmission({ ...args, leaseOwner: current.leaseOwner, outcome: "unconfirmed" })).persisted, true);
  const retry = await store().claimSubmission(args);
  assert.equal(retry.kind, "owned");
  assert.equal((await store().finishSubmission({ ...args, leaseOwner: retry.leaseOwner, outcome: "accepted" })).persisted, true);
  assert.equal((await store().claimSubmission(args)).kind, "accepted");
  assert.equal((await store().claimSubmission({ ...args, namespace: "lease_other" })).kind, "owned");
  await db.query("UPDATE grady_contact.submission_receipts SET expires_at=clock_timestamp()-interval '1 second' WHERE namespace=$1", [args.namespace]);
  assert.equal((await store().claimSubmission(args)).kind, "owned");
});

test("overlapping workers and restarted handlers make one mocked send and reuse accepted receipt", async () => {
  let release, calls = 0;
  const deliver = async () => { calls++; return new Promise(resolve => { release = resolve; }); };
  const a = worker(store(), deliver, "workers_fixture"), b = worker(store(), deliver, "workers_fixture");
  const body = { ...fields, token: token() };
  const pending = a.POST(request("POST", body));
  while (!release) await new Promise(resolve => setImmediate(resolve));
  const blocked = await b.POST(request("POST", body));
  assert.equal(blocked.status, 409); assert.ok(Number(blocked.headers.get("retry-after")) > 0);
  release(true); assert.equal((await pending).status, 200);
  assert.equal((await worker(store(), deliver, "workers_fixture").POST(request("POST", body))).status, 200);
  assert.equal(calls, 1);
});

test("accepted receipts survive closing and reopening local PostgreSQL data", async () => {
  const directory = await mkdtemp(join(tmpdir(), "grady-contact-pg-test-"));
  let persistent;
  try {
    persistent = new PGlite(directory); await persistent.exec(migration);
    let state = store(async (text, params) => (await persistent.query(text, params)).rows);
    const args = receipt("persisted_fixture");
    const first = await state.claimSubmission(args);
    assert.equal((await state.finishSubmission({ ...args, leaseOwner: first.leaseOwner, outcome: "accepted" })).persisted, true);
    await persistent.close();
    persistent = new PGlite(directory);
    state = store(async (text, params) => (await persistent.query(text, params)).rows);
    assert.equal((await state.claimSubmission(args)).kind, "accepted");
  } finally { await persistent?.close(); await rm(directory, { recursive: true, force: true }); }
});

test("ambiguous claim response does not send until lease recovery", async () => {
  let lost = true, calls = 0;
  const state = store(async (text, params) => {
    const rows = (await db.query(text, params)).rows;
    if (lost && text.includes("claim_submission")) { lost = false; throw new Error("synthetic lost response"); }
    return rows;
  });
  const h = worker(state, async () => { calls++; return true; }, "lost_claim");
  const body = { ...fields, token: token() };
  assert.equal((await h.POST(request("POST", body))).status, 503);
  assert.equal((await h.POST(request("POST", body))).status, 409);
  assert.equal(calls, 0);
  await db.query("UPDATE grady_contact.submission_receipts SET lease_until=clock_timestamp()-interval '1 second' WHERE namespace='lost_claim'");
  assert.equal((await h.POST(request("POST", body))).status, 200); assert.equal(calls, 1);
});

test("provider acceptance plus receipt write failure stays unconfirmed and retries with the same provider key", async () => {
  for (const committed of [false, true]) {
    let lost = true;
    const attempts = [];
    const namespace = committed ? "lost_finish_after" : "lost_finish_before";
    const state = store(async (text, params) => {
      if (lost && text.includes("finish_submission")) {
        lost = false;
        if (committed) await db.query(text, params);
        throw new Error("synthetic uncertain write");
      }
      return (await db.query(text, params)).rows;
    });
    const deliver = async (_, __, context) => { attempts.push(context.idempotencyKey); return true; };
    const body = { ...fields, token: token() };
    assert.equal((await worker(state, deliver, namespace).POST(request("POST", body))).status, 503);
    if (!committed) {
      assert.equal((await worker(store(), deliver, namespace).POST(request("POST", body))).status, 409);
      await db.query("UPDATE grady_contact.submission_receipts SET lease_until=clock_timestamp()-interval '1 second' WHERE namespace=$1", [namespace]);
    }
    assert.equal((await worker(store(), deliver, namespace).POST(request("POST", body))).status, 200);
    assert.equal(attempts.length, committed ? 1 : 2);
    assert.ok(attempts.every(key => key === attempts[0]));
  }
});

test("storage timeout/auth/quota/schema failures fail closed without transport or diagnostics", async () => {
  for (const phase of ["consume_rate", "claim_submission"]) {
    for (const reason of ["timeout", "password fixture", "quota fixture", "missing schema fixture"]) {
      let calls = 0;
      const state = store(async (text, params) => {
        if (text.includes(phase)) throw new Error(reason);
        return (await db.query(text, params)).rows;
      });
      const h = worker(state, async () => { calls++; return true; }, "fail_closed");
      const response = await h.POST(request("POST", { ...fields, token: token() }));
      assert.equal(response.status, 503);
      assert.ok(!(await response.text()).includes(reason)); assert.equal(calls, 0);
    }
  }
});

test("database responses are validated and all adapter input is bound as parameters", async () => {
  for (const rows of [null, [], [{}, {}], [null], [[]], [{ allowed: true, now_ms: null, retry_after_seconds: 0 }], [{ allowed: "true", now_ms: Date.now(), retry_after_seconds: 0 }], [{ allowed: true, now_ms: Date.now(), retry_after_seconds: 1 }], [{ allowed: false, now_ms: Date.now(), retry_after_seconds: 0 }]]) {
    await assert.rejects(store(async () => rows).consumeRate({ namespace: "fixture", kind: "submit", clientKey: hash("ip") }));
  }
  const malicious = "'; DROP TABLE public.unrelated_fixture; --";
  const state = store(async (text, params) => {
    assert.ok(!text.includes(malicious)); assert.equal(params[0], malicious);
    return (await db.query(text, params)).rows;
  });
  await assert.rejects(state.consumeRate({ namespace: malicious, kind: "submit", clientKey: hash("ip") }));
  assert.deepEqual((await db.query("SELECT * FROM public.unrelated_fixture")).rows, [{ value: "preserve" }]);
  await assert.rejects(store(async () => [{ decision: "owned", lease_owner: randomUUID() }]).claimSubmission(receipt("fixture")));
  await assert.rejects(store(async () => [{ decision: "busy", retry_after_seconds: 61 }]).claimSubmission(receipt("fixture")));
  await assert.rejects(store(async () => [{ persisted: "true" }]).finishSubmission({ ...receipt("fixture"), leaseOwner: randomUUID(), outcome: "accepted" }));
});

test("client IP canonicalization rejects lists and makes equivalent IPv6 addresses share the same bucket", async () => {
  assert.equal(canonicalClientIp("2001:0db8:0000:0000:0000:0000:0000:0001"), canonicalClientIp("2001:db8::1"));
  for (const value of [null, "unknown", "192.0.2.1,192.0.2.2", "[2001:db8::1]", "192.0.2.1:443", "fe80::1%en0"]) assert.equal(canonicalClientIp(value), null);
  const h = worker(store(), async () => { throw new Error("no delivery"); }, "ipv6_fixture");
  for (let i = 0; i < 20; i++) assert.equal((await h.GET(request("GET", undefined, i % 2 ? "2001:db8::1" : "2001:0db8:0000:0000:0000:0000:0000:0001"))).status, 200);
  assert.equal((await h.GET(request("GET", undefined, "2001:db8::1"))).status, 429);
  assert.equal((await h.GET(request("GET", undefined, "invalid", { "x-forwarded-for": "192.0.2.1" }))).status, 503);
  const rows = (await db.query("SELECT identifier FROM grady_contact.rate_windows WHERE namespace='ipv6_fixture' AND scope='client'")).rows;
  assert.equal(rows.length, 1); assert.match(rows[0].identifier, /^[A-Za-z0-9_-]{43}$/);
});

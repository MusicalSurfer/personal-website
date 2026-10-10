import test from "node:test";
import assert from "node:assert/strict";
import { createContactHandlers, buildMessage } from "../app/api/contact/contact-core.mjs";

// Local fixtures only: no provider connection, real credentials, or real recipient.
const fixtureConfig = {
  origin: "https://studio.example.test",
  secret: "local-test-fixture-not-a-production-secret-1234567890",
  recipient: "owner@example.test",
  from: "studio@example.test",
  ipHeader: "x-test-client-ip",
};
const fields = { name: "Test Visitor", email: "visitor@example.test", service: "website-creation", message: "I would like a website for a small example business.", website: "" };

function harness(options = {}) {
  let now = Date.now();
  const messages = [];
  const attempts = [];
  const handlers = createContactHandlers({
    getConfig: () => options.unconfigured ? null : fixtureConfig,
    clock: () => now,
    deliver: async (message, config, context) => { messages.push(message); attempts.push(context); return options.deliver ? options.deliver(message, context) : true; },
  });
  function request(method, body, overrides = {}) {
    const headers = { origin: fixtureConfig.origin, "x-test-client-ip": "192.0.2.10", ...overrides };
    if (method === "POST" && !Object.hasOwn(overrides, "content-type")) headers["content-type"] = "application/json";
    for (const key of Object.keys(headers)) if (headers[key] === null) delete headers[key];
    return new Request(fixtureConfig.origin + "/api/contact", { method, headers, ...(method === "POST" ? { body: typeof body === "string" ? body : JSON.stringify(body) } : {}) });
  }
  return {
    handlers, messages, attempts, request,
    advance: milliseconds => { now += milliseconds; },
    async token(overrides) { const response = await handlers.GET(request("GET", null, overrides)); assert.equal(response.status, 200); return (await response.json()).token; },
    async submit(overrides = {}, headers = {}) { const token = await this.token(headers); now += 4000; return handlers.POST(request("POST", { ...fields, token, ...overrides }, headers)); },
  };
}

test("valid enquiry uses fixed Resend addresses, visitor reply_to, and plain text", async () => {
  const h = harness();
  const response = await h.submit({ message: "Please include <script>alert('example')</script> as literal text." });
  assert.equal(response.status, 200);
  assert.match((await response.json()).message, /submitted/);
  assert.equal(h.messages.length, 1);
  const mail = h.messages[0];
  assert.deepEqual(mail.to, [fixtureConfig.recipient]);
  assert.equal(mail.reply_to, fields.email);
  assert.equal(mail.from, "Grady Software Solutions <" + fixtureConfig.from + ">");
  assert.equal(mail.html, undefined);
  assert.equal(mail.headers, undefined);
  assert.match(mail.text, /<script>/);
  assert.deepEqual(Object.keys(mail).sort(), ["from", "reply_to", "subject", "text", "to"]);
  assert.match(h.attempts[0].idempotencyKey, /^grady-contact\/[A-Za-z0-9_-]{43}$/);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("missing delivery configuration fails truthfully without calling transport", async () => {
  const h = harness({ unconfigured: true });
  for (const method of ["GET", "POST"]) {
    const response = await h.handlers[method](h.request(method, fields));
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, "unavailable");
  }
  assert.equal(h.messages.length, 0);
});

test("foreign or missing POST origin is rejected", async () => {
  for (const origin of ["https://attacker.example.test", null]) {
    const h = harness();
    assert.equal((await h.handlers.POST(h.request("POST", fields, { origin }))).status, 403);
    assert.equal(h.messages.length, 0);
  }
});

test("browser session GET supports same-origin fetch metadata with matching referrer", async () => {
  const h = harness();
  const response = await h.handlers.GET(h.request("GET", null, { origin: null, "sec-fetch-site": "same-origin", referer: fixtureConfig.origin + "/" }));
  assert.equal(response.status, 200);
  const rejected = await h.handlers.GET(h.request("GET", null, { origin: null, "sec-fetch-site": "same-origin", referer: "https://attacker.example.test/" }));
  assert.equal(rejected.status, 403);
});

test("missing or malformed trusted client IP fails closed", async () => {
  for (const ip of [null, "not-an-ip", "192.0.2.10, 192.0.2.11"]) {
    const h = harness();
    assert.equal((await h.handlers.POST(h.request("POST", fields, { "x-test-client-ip": ip }))).status, 503);
    assert.equal(h.messages.length, 0);
  }
});

test("non-JSON content is rejected", async () => {
  const h = harness();
  assert.equal((await h.handlers.POST(h.request("POST", fields, { "content-type": "text/plain" }))).status, 415);
  assert.equal(h.messages.length, 0);
});

test("oversized declared body is rejected", async () => {
  const h = harness();
  assert.equal((await h.handlers.POST(h.request("POST", fields, { "content-length": "20000" }))).status, 413);
  assert.equal(h.messages.length, 0);
});

test("streamed oversized body without Content-Length is also rejected", async () => {
  const h = harness();
  const body = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(10000)); controller.enqueue(new Uint8Array(10000)); controller.close(); } });
  const request = new Request(fixtureConfig.origin + "/api/contact", { method: "POST", duplex: "half", headers: { origin: fixtureConfig.origin, "x-test-client-ip": "192.0.2.10", "content-type": "application/json" }, body });
  assert.equal((await h.handlers.POST(request)).status, 413);
  assert.equal(h.messages.length, 0);
});

test("invalid JSON and array payloads are rejected", async () => {
  for (const body of ["{bad", []]) {
    const h = harness();
    assert.equal((await h.handlers.POST(h.request("POST", body))).status, 400);
    assert.equal(h.messages.length, 0);
  }
});

test("client cannot set recipient, sender, subject, or Reply-To headers", async () => {
  for (const property of ["to", "from", "subject", "replyTo", "reply_to", "apiKey", "idempotencyKey"]) {
    const h = harness();
    assert.equal((await h.submit({ [property]: "other@example.test" })).status, 400);
    assert.equal(h.messages.length, 0);
  }
});

test("honeypot submissions never claim success or send", async () => {
  const h = harness();
  assert.equal((await h.submit({ website: "bot-filled" })).status, 400);
  assert.equal(h.messages.length, 0);
});

test("field validation and lengths are enforced server-side", async () => {
  for (const override of [{ name: "A" }, { name: "x".repeat(101) }, { email: "invalid" }, { email: "a".repeat(65) + "@example.test" }, { message: "Too short" }, { message: "x".repeat(5001) }, { service: "invented-service" }]) {
    const h = harness();
    const response = await h.submit(override);
    assert.equal(response.status, 422);
    assert.ok((await response.json()).errors);
    assert.equal(h.messages.length, 0);
  }
});

test("CRLF header injection through name or email is rejected", async () => {
  for (const override of [{ name: "Visitor\r\nBcc: other@example.test" }, { email: "visitor@example.test\r\nBcc: other@example.test" }]) {
    const h = harness();
    assert.equal((await h.submit(override)).status, 422);
    assert.equal(h.messages.length, 0);
  }
});

test("signed challenge rejects tampering and missing tokens", async () => {
  for (const token of [undefined, "bad", "1800000000000.00000000-0000-0000-0000-000000000000." + "a".repeat(43)]) {
    const h = harness();
    assert.equal((await h.submit({ token })).status, 400);
    assert.equal(h.messages.length, 0);
  }
});

test("minimum form age and expiry are enforced", async () => {
  const h = harness();
  const token = await h.token();
  assert.equal((await h.handlers.POST(h.request("POST", { ...fields, token }))).status, 400);
  h.advance(3_600_001);
  const expired = await h.handlers.POST(h.request("POST", { ...fields, token }));
  assert.equal(expired.status, 400);
  assert.equal((await expired.json()).code, "challenge_expired");
  assert.equal(h.messages.length, 0);
});

test("a processed challenge cannot send the same message twice", async () => {
  const h = harness();
  const token = await h.token();
  h.advance(4000);
  assert.equal((await h.handlers.POST(h.request("POST", { ...fields, token }))).status, 200);
  assert.equal((await h.handlers.POST(h.request("POST", { ...fields, token }))).status, 200);
  assert.equal(h.messages.length, 1);
});

test("retry after an unconfirmed delivery keeps the same provider idempotency key", async () => {
  let calls = 0;
  const h = harness({ deliver: () => ++calls > 1 });
  const token = await h.token(); h.advance(4000);
  assert.equal((await h.handlers.POST(h.request("POST", { ...fields, token }))).status, 503);
  assert.equal((await h.handlers.POST(h.request("POST", { ...fields, token }))).status, 200);
  assert.equal(h.attempts[0].idempotencyKey, h.attempts[1].idempotencyKey);
  assert.deepEqual(h.messages[0], h.messages[1]);
});

test("a failed token cannot retry with a different payload", async () => {
  const h = harness({ deliver: () => false });
  const token = await h.token(); h.advance(4000);
  assert.equal((await h.handlers.POST(h.request("POST", { ...fields, token }))).status, 503);
  const response = await h.handlers.POST(h.request("POST", { ...fields, token, message: "A different project enquiry that must not reuse the key." }));
  assert.equal(response.status, 409);
  assert.equal((await response.json()).code, "challenge_reused");
  assert.equal(h.messages.length, 1);
});

test("concurrent submissions with one token do not call delivery twice", async () => {
  let release;
  const h = harness({ deliver: () => new Promise(resolve => { release = resolve; }) });
  const token = await h.token(); h.advance(4000);
  const first = h.handlers.POST(h.request("POST", { ...fields, token }));
  // Let the streamed request body complete before sending the concurrent request.
  while (!release) await new Promise(resolve => setImmediate(resolve));
  const second = await h.handlers.POST(h.request("POST", { ...fields, token }));
  assert.equal(second.status, 409);
  assert.equal((await second.json()).code, "challenge_processing");
  assert.equal(h.messages.length, 1);
  release(true);
  assert.equal((await first).status, 200);
});

test("per-client limits produce Retry-After instead of another send", async () => {
  const h = harness();
  for (let index = 0; index < 5; index++) assert.equal((await h.submit()).status, 200);
  const limited = await h.submit();
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get("retry-after")) > 0);
  assert.equal(h.messages.length, 5);
});

test("global send cap applies across different client addresses", async () => {
  const h = harness();
  for (let index = 1; index <= 20; index++) assert.equal((await h.submit({}, { "x-test-client-ip": "192.0.2." + index })).status, 200);
  assert.equal((await h.submit({}, { "x-test-client-ip": "192.0.2.21" })).status, 429);
  assert.equal(h.messages.length, 20);
});

test("rejected or failing mocked transport never produces success", async () => {
  for (const deliver of [() => false, () => { throw new Error("test transport failure"); }]) {
    const h = harness({ deliver });
    const response = await h.submit();
    assert.equal(response.status, 503);
    const data = await response.json();
    assert.equal(data.code, "delivery_failed");
    assert.doesNotMatch(JSON.stringify(data), /test transport failure|owner@example/);
  }
});

test("message subject depends only on the enumerated service", () => {
  const message = buildMessage({ ...fields, name: "Visitor with a subject idea" }, fixtureConfig);
  assert.equal(message.subject, "Website project enquiry — Website creation");
  assert.equal(message.attachments, undefined);
});

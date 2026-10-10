import test from "node:test";
import assert from "node:assert/strict";
import { createResendDelivery, readContactConfig } from "../app/api/contact/resend-delivery.mjs";
import { buildMessage } from "../app/api/contact/contact-core.mjs";

const env = {
  CONTACT_RATE_LIMIT_MODE: "single-instance", CONTACT_ORIGIN: "https://studio.example.test",
  CONTACT_FORM_SECRET: "fixture-only-not-production-1234567890123456789",
  CONTACT_TO: "owner@example.test", CONTACT_FROM: "studio@example.test",
  RESEND_API_KEY: "local-fixture-only-never-used-with-provider", CONTACT_CLIENT_IP_HEADER: "X-Test-IP",
};
const fields = { name: "Local Tester", email: "visitor@example.test", service: "custom-application", message: "A local fixture describing an example software project." };
const context = { idempotencyKey: "grady-contact/local-fixture-only" };

test("Resend config requires every server setting and rejects unsafe hosting/origins", () => {
  const config = readContactConfig(env);
  assert.equal(config.recipient, env.CONTACT_TO);
  assert.equal(config.ipHeader, "x-test-ip");
  for (const key of Object.keys(env)) assert.equal(readContactConfig({ ...env, [key]: "" }), null, key);
  for (const override of [{ VERCEL: "1" }, { AWS_LAMBDA_FUNCTION_NAME: "fixture" }, { CONTACT_RATE_LIMIT_MODE: "serverless" }, { CONTACT_ORIGIN: "http://studio.example.test" }, { CONTACT_ORIGIN: "https://studio.example.test/path" }, { CONTACT_FROM: "studio@example.test\r\nBcc: other@example.test" }, { CONTACT_TO: "owner@example.test,other@example.test" }, { RESEND_API_KEY: "fixture\nheader" }, { CONTACT_FORM_SECRET: "short" }, { CONTACT_CLIENT_IP_HEADER: "bad header" }]) assert.equal(readContactConfig({ ...env, ...override }), null);
  assert.ok(readContactConfig({ ...env, CONTACT_ORIGIN: "http://127.0.0.1:3326" }));
});

test("Resend adapter uses documented fixed HTTPS endpoint, auth, REST reply_to and idempotency", async () => {
  const config = readContactConfig(env);
  const message = buildMessage(fields, config);
  let calls = 0;
  const deliver = createResendDelivery({ fetchImpl: async (url, options) => {
    calls++;
    assert.equal(url, "https://api.resend.com/emails");
    assert.equal(options.method, "POST");
    assert.equal(options.redirect, "error");
    assert.equal(options.cache, "no-store");
    assert.equal(options.headers.Authorization, "Bearer " + env.RESEND_API_KEY);
    assert.equal(options.headers["Idempotency-Key"], context.idempotencyKey);
    assert.equal(options.headers["Content-Type"], "application/json");
    assert.ok(options.signal instanceof AbortSignal);
    assert.deepEqual(JSON.parse(options.body), { from: "Grady Software Solutions <studio@example.test>", to: ["owner@example.test"], reply_to: "visitor@example.test", subject: "Website project enquiry — Custom application", text: message.text });
    return Response.json({ id: "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794" });
  } });
  assert.equal(await deliver(message, config, context), true);
  assert.equal(calls, 1);
});

test("provider errors, quotas, invalid success bodies, timeout and network errors never claim acceptance", async () => {
  const config = readContactConfig(env);
  const message = buildMessage(fields, config);
  const fixtures = [
    ...[400, 401, 403, 409, 422, 429, 500, 503].map(status => () => Response.json({ name: "provider_fixture", message: "Private provider diagnostic", id: "not-success" }, { status })),
    () => Response.json({}), () => Response.json({ id: "" }), () => Response.json({ id: 42 }),
    () => Response.json({ id: "fixture", error: "failure" }), () => new Response("not JSON"),
    () => { throw new DOMException("Fixture timeout", "TimeoutError"); },
    () => { throw new Error("Fixture network failure"); },
  ];
  for (const fixture of fixtures) {
    let calls = 0;
    const deliver = createResendDelivery({ fetchImpl: async () => { calls++; return fixture(); } });
    assert.equal(await deliver(message, config, context), false);
    assert.equal(calls, 1, "no automatic retries or fallback sends");
  }
});

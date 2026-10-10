import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import { fieldErrors, services } from "../../lib/contact-fields.mjs";
import { createLocalState } from "./local-state.mjs";
export { createRateLimiter } from "./local-state.mjs";

const BODY_LIMIT = 16_384;
const TOKEN_TTL = 60 * 60 * 1000;
const MIN_FORM_AGE = 3000;
const unavailable = "The contact form is temporarily unavailable. Please try again later.";

function json(status, body, headers = {}) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...headers } });
}

function signature(secret, payload) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function isSameOrigin(request, origin) {
  const sentOrigin = request.headers.get("origin");
  if (sentOrigin) return sentOrigin === origin;
  if (request.method !== "GET") return false;
  try {
    return request.headers.get("sec-fetch-site") === "same-origin" && new URL(request.headers.get("referer")).origin === origin;
  } catch { return false; }
}

async function readBody(request) {
  const length = request.headers.get("content-length");
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > BODY_LIMIT)) throw new Error("body_too_large");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("invalid_json");
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > BODY_LIMIT) { await reader.cancel(); throw new Error("body_too_large"); }
      chunks.push(value);
    }
    const bytes = Buffer.concat(chunks.map(chunk => Buffer.from(chunk)));
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } finally { reader.releaseLock(); }
}

export function buildMessage(fields, config) {
  const service = services.find(item => item.value === fields.service).label;
  return {
    from: "Grady Software Solutions <" + config.from + ">",
    to: [config.recipient],
    reply_to: fields.email.trim(),
    subject: "Website project enquiry — " + service,
    text: "Name: " + fields.name.trim() + "\nReply email: " + fields.email.trim() + "\nService: " + service + "\n\n" + fields.message.trim(),
  };
}

export function canonicalClientIp(value) {
  if (typeof value !== "string" || !isIP(value.trim())) return null;
  const ip = value.trim();
  try { return isIP(ip) === 6 ? new URL("http://[" + ip + "]").hostname.slice(1, -1) : ip; }
  catch { return null; } // Reject interface-scoped IPv6 values; never crash the guard.
}

export function createContactHandlers({ getConfig, deliver, clock = Date.now, limiter, getStore }) {
  const local = getStore ? null : createLocalState({ clock, limiter });
  const selectStore = getStore || (() => local); // Local tests; production route supplies explicit selection.

  async function guard(request, config, kind) {
    if (!config) return json(503, { code: "unavailable", message: unavailable });
    if (!isSameOrigin(request, config.origin)) return json(403, { code: "origin_rejected", message: "Please use the contact form on this website." });
    const ip = canonicalClientIp(request.headers.get(config.ipHeader));
    if (!ip) return json(503, { code: "unavailable", message: unavailable });
    const key = signature(config.secret, ip);
    try {
      const store = selectStore(config);
      if (!store) throw new Error("missing_store");
      const namespace = config.namespace || "local";
      const result = await store.consumeRate({ namespace, kind, clientKey: key });
      if (!result.allowed) return json(429, { code: "rate_limited", message: "Too many requests. Please wait a while before trying again." }, { "Retry-After": String(result.retryAfterSeconds) });
      return { store, namespace, now: result.nowMs };
    } catch { return json(503, { code: "unavailable", message: unavailable }); }
  }

  async function GET(request) {
    const config = getConfig();
    const guarded = await guard(request, config, "session");
    if (guarded instanceof Response) return guarded;
    const payload = guarded.now + "." + randomUUID();
    return json(200, { token: payload + "." + signature(config.secret, payload) });
  }

  async function POST(request) {
    const config = getConfig();
    const guarded = await guard(request, config, "submit");
    if (guarded instanceof Response) return guarded;
    if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") return json(415, { code: "invalid_content_type", message: "Please submit using the website contact form." });
    let fields;
    try { fields = await readBody(request); }
    catch (error) { return json(error.message === "body_too_large" ? 413 : 400, { code: error.message === "body_too_large" ? "body_too_large" : "invalid_json", message: "The request could not be read. Please check your message and try again." }); }
    const allowed = new Set(["name", "email", "service", "message", "website", "token"]);
    if (!fields || typeof fields !== "object" || Array.isArray(fields) || Object.keys(fields).some(key => !allowed.has(key))) return json(400, { code: "invalid_fields", message: "Please submit using the website contact form." });
    if (typeof fields.website !== "string" || fields.website !== "") return json(400, { code: "request_rejected", message: "Your request could not be submitted. Please try again." });
    const errors = fieldErrors(fields);
    if (Object.keys(errors).length) return json(422, { code: "validation_failed", message: "Please check the highlighted fields.", errors });
    if (typeof fields.token !== "string" || fields.token.length > 200) return json(400, { code: "challenge_invalid", message: "Please refresh the form and try again." });
    const [timestamp, nonce, signed, ...extra] = fields.token.split(".");
    if (extra.length || !/^\d{13}$/.test(timestamp || "") || !/^[a-f0-9-]{36}$/.test(nonce || "") || !/^[A-Za-z0-9_-]{43}$/.test(signed || "")) return json(400, { code: "challenge_invalid", message: "Please refresh the form and try again." });
    const expected = Buffer.from(signature(config.secret, timestamp + "." + nonce));
    const actual = Buffer.from(signed);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return json(400, { code: "challenge_invalid", message: "Please refresh the form and try again." });
    const now = guarded.now;
    const age = now - Number(timestamp);
    if (age < MIN_FORM_AGE) return json(400, { code: "too_fast", message: "Please take a moment to check your message, then try again." });
    if (age > TOKEN_TTL) return json(400, { code: "challenge_expired", message: "This form has expired. Please try again with the refreshed form." });
    const message = buildMessage(fields, config);
    const payloadHash = signature(config.secret, JSON.stringify(message));
    const challengeKey = signature(config.secret, "receipt/" + fields.token);
    const providerKey = "grady-contact/" + signature(config.secret, fields.token);
    const { store, namespace } = guarded;
    let claim;
    try { claim = await store.claimSubmission({ namespace, challengeKey, payloadHash, providerKey }); }
    catch { return json(503, { code: "unavailable", message: unavailable }); }
    if (claim.kind === "payload-mismatch") return json(409, { code: "challenge_reused", message: "This form was used for a different message. Please try again with a refreshed form." });
    const success = () => json(200, { message: "Your message was submitted. Thanks — I’ll be in touch." });
    if (claim.kind === "accepted") return success();
    if (claim.kind === "busy") return json(409, { code: "challenge_processing", message: "This submission is being processed. Please wait before trying again." }, { "Retry-After": String(claim.retryAfterSeconds) });
    if (claim.kind !== "owned" || !claim.leaseOwner) return json(503, { code: "unavailable", message: unavailable });
    const finish = outcome => store.finishSubmission({ namespace, challengeKey, leaseOwner: claim.leaseOwner, outcome });
    try {
      let accepted;
      try { accepted = await deliver(message, config, { idempotencyKey: providerKey }); }
      catch { accepted = false; }
      if (accepted !== true) { await finish("unconfirmed"); throw new Error("unconfirmed"); }
      if (!(await finish("accepted")).persisted) throw new Error("not_persisted");
      return success();
    } catch {
      return json(503, { code: "delivery_failed", message: "Your submission wasn’t confirmed. Your text is still here; please wait before trying again." });
    }
  }

  return { GET, POST };
}

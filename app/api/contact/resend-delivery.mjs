import { isEmail } from "../../lib/contact-fields.mjs";

// Imported only by the server-only route and local tests; never a client component.
export function readContactConfig(env) {
  const mode = env.CONTACT_RATE_LIMIT_MODE;
  let databaseUrl, namespace, ipHeader;
  if (mode === "vercel-postgres") {
    if (env.VERCEL !== "1" || env.AWS_LAMBDA_FUNCTION_NAME) return null;
    if (env.CONTACT_CLIENT_IP_HEADER && env.CONTACT_CLIENT_IP_HEADER.toLowerCase() !== "x-vercel-forwarded-for") return null;
    ipHeader = "x-vercel-forwarded-for";
    databaseUrl = env.CONTACT_DATABASE_URL;
    namespace = env.CONTACT_STATE_NAMESPACE;
    if (!namespace || !/^[a-z0-9_-]{1,64}$/.test(namespace)) return null;
    try {
      const db = new URL(databaseUrl);
      if (!["postgres:", "postgresql:"].includes(db.protocol) || !db.username || !db.password || !db.hostname.endsWith(".neon.tech") || !/^\/[a-zA-Z0-9_-]+$/.test(db.pathname) || db.hash || db.searchParams.get("sslmode") !== "require") return null;
      // Reject alternate hosts/endpoints or unexpected transport options.
      if ([...db.searchParams].some(([key]) => key !== "sslmode") || db.searchParams.getAll("sslmode").length !== 1 || (db.port && db.port !== "5432")) return null;
    } catch { return null; }
  } else if (mode === "single-instance") {
    // A local adapter is never a fallback for serverless deployment.
    if (env.VERCEL || env.AWS_LAMBDA_FUNCTION_NAME) return null;
    ipHeader = env.CONTACT_CLIENT_IP_HEADER;
    namespace = "local";
  } else return null;
  const { CONTACT_ORIGIN: origin, CONTACT_FORM_SECRET: secret, CONTACT_TO: recipient, CONTACT_FROM: from, RESEND_API_KEY: apiKey } = env;
  if (!origin || !secret || secret.length < 32 || secret.length > 256 || !isEmail(recipient) || !isEmail(from) || !apiKey || apiKey.length > 512 || /\s/.test(apiKey) || !ipHeader || !/^[a-zA-Z0-9-]+$/.test(ipHeader)) return null;
  try {
    const url = new URL(origin);
    if (url.origin !== origin || (url.protocol !== "https:" && !(mode === "single-instance" && url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))) return null;
  } catch { return null; }
  return { origin, secret, recipient, from, apiKey, ipHeader: ipHeader.toLowerCase(), mode, databaseUrl, namespace };
}

export function createResendDelivery({ fetchImpl = fetch } = {}) {
  return async function deliver(message, config, { idempotencyKey }) {
    try {
      const response = await fetchImpl("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: "Bearer " + config.apiKey, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify(message),
        signal: AbortSignal.timeout(15_000),
        redirect: "error",
        cache: "no-store",
      });
      if (response.status !== 200) return false;
      const data = await response.json();
      return Boolean(data && !data.error && typeof data.id === "string" && data.id.trim() && data.id.length <= 128);
    } catch { return false; }
  };
}

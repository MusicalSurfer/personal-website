
## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## Company homepage

Install the locked dependencies with `npm ci`. Run `npm run lint`, `npm test`, and
`npm run build` before QA. For a local production preview, choose a free port and
run `npm run start -- --hostname 127.0.0.1 --port <port>`.

The scenic service cards expand with mouse or keyboard. Choosing a service sets
the enquiry form's service selection. The form requires JavaScript. There are no
public recipient addresses or mailto links.

## Contact delivery configuration

The contact API fails with HTTP 503 while configuration is absent. It does not
simulate successful delivery. Tests inject a local transport fixture and never
connect to Resend or send actual email.

The blank `.env.example` lists the required settings. Store real values in ignored
`.env.local` or server hosting secrets, never in `NEXT_PUBLIC_*` variables or Git.

- `CONTACT_ORIGIN`: the exact website origin, without a trailing slash. HTTPS is
  required except for localhost previews.
- `CONTACT_TO`: the single recipient approved by the owner. Visitors cannot
  choose or override this destination.
- `CONTACT_FROM`: a sender address on a domain verified in the approved Resend account.
  The visitor's validated email is used only as Reply-To.
- `RESEND_API_KEY`: a dedicated Resend key with sending permission, restricted to
  the verified company sending domain where possible. No SMTP settings are needed.
- `CONTACT_FORM_SECRET`: an operator-supplied secret of 32–256 characters used to
  sign short-lived form challenges. No production secret is included or generated.
- `CONTACT_CLIENT_IP_HEADER`: for local single-instance use, a header whose value is overwritten by the trusted
  hosting proxy with one validated client IP. Do not trust a user-supplied header
  or a forwarded-IP list. Missing/invalid values fail closed.
- `CONTACT_RATE_LIMIT_MODE`: `single-instance` is supported only on one persistent
  Node process behind that trusted proxy. Per-client and global limits are in
  memory and reset on restart. Vercel/AWS Lambda are explicitly blocked from
  enabling this mode.
- Vercel mode is `vercel-postgres`, with a dedicated Neon PostgreSQL primary,
  `CONTACT_DATABASE_URL`, and a stable `CONTACT_STATE_NAMESPACE`. It uses the
  fixed `x-vercel-forwarded-for` platform header, shared atomic rate windows,
  and durable leased submission receipts. See [database setup and schema review](db/contact/README.md).

**Release gates:** the adapter and additive migration are prepared locally.
Remote dedicated database/login creation, schema/grant application, secrets,
sender/domain verification and live proxy/concurrency checks remain separate
approved setup steps. Unconfigured deployments keep returning HTTP 503. No
contact form can guarantee zero spam.

The handler checks origin, content type, streamed body size, field limits, a
honeypot, a signed minimum-age/expiry challenge, replay attempts, and request
limits. It POSTs plain text to `https://api.resend.com/emails` with server-only
Bearer authorization and the documented REST `reply_to` field. A successful HTTP
200 response must contain a nonempty email ID. Resend acceptance is not proof of
inbox delivery. Provider details and credentials are never returned to visitors.

Each signed challenge maps to one provider `Idempotency-Key`. Retrying an
unconfirmed submission with the same challenge and payload reuses that key;
accepted retries return the existing confirmation without sending again.
Concurrent or changed-payload retries are rejected. Resend retains idempotency
keys for 24 hours; the website challenge expires after one hour. The handler does
not automatically retry provider errors or timeouts, redirect credentials, or
send through a fallback provider. A refresh/expired challenge creates a new
submission identity; it cannot establish exactly-once inbox delivery.

## Resend setup handoff

Resend is the approved provider, but no account settings, credentials, or DNS
records have been changed. First confirm an already verified company sending
domain and the desired From address (non-secret information). If the domain is
not verified, stop for approval before changing DNS. Preserve existing mail MX
records; sending-domain setup does not require replacing the owner's inbox.

The smallest secure credential step is for the owner to create a dedicated
sending-only, domain-restricted key in Resend and enter it directly into approved
server secret storage as `RESEND_API_KEY` (or ignored `.env.local` for an explicitly
approved local test). Do not paste the key into chat, Pages, Library, source, or
logs, and do not reuse another client/project's key. The signing secret likewise
belongs only in approved server secret storage. Sender and proxy safeguards must
be configured before delivery can be enabled. A controlled real-email test needs
separate approval of its destination and fixture content.

Official references: [Send email](https://resend.com/docs/api-reference/emails/send-email),
[idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys),
[errors](https://resend.com/docs/api-reference/errors),
[verified domains](https://resend.com/docs/dashboard/domains/introduction), and
[API keys](https://resend.com/docs/dashboard/api-keys/introduction).

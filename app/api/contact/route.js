import "server-only";
import { createContactHandlers } from "./contact-core.mjs";
import { createResendDelivery, readContactConfig } from "./resend-delivery.mjs";
import { createLocalState } from "./local-state.mjs";
import { createPostgresState } from "./postgres-state.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const localState = createLocalState();
const handlers = createContactHandlers({
  getConfig: () => readContactConfig(process.env),
  deliver: createResendDelivery(),
  getStore: config => config.mode === "vercel-postgres"
    ? createPostgresState({ databaseUrl: config.databaseUrl })
    : config.mode === "single-instance" ? localState : null,
});
export const GET = handlers.GET;
export const POST = handlers.POST;

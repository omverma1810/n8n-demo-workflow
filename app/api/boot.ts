import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
// Public webhook receiver for the n8n "AI Growth Ops Engine" workflow.
// n8n POSTs JSON with a `type` field: "daily_brief" | "lead" | "health".
app.post("/api/webhook/n8n", async (c) => {
  // Optional shared-secret check: set WEBHOOK_SECRET in .env and send it
  // as the `x-webhook-secret` header from the n8n HTTP Request nodes.
  const secret = process.env.WEBHOOK_SECRET;
  if (secret && c.req.header("x-webhook-secret") !== secret) {
    return c.json({ ok: false, error: "invalid webhook secret" }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false, error: "invalid JSON body" }, 400);
  }

  try {
    const { handleWebhook } = await import("./webhook");
    const result = await handleWebhook(body);
    const status = (result as { status?: number }).status ?? 200;
    return c.json(result, status as 200 | 400);
  } catch (err) {
    console.error("webhook ingest failed:", err);
    return c.json({ ok: false, error: "ingest failed" }, 500);
  }
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

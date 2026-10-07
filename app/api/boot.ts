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

  const { getDb } = await import("./queries/connection");
  const schema = await import("@db/schema");
  const db = getDb();

  try {
    switch (body.type) {
      case "daily_brief":
        await db.insert(schema.briefs).values({
          date: String(body.date ?? new Date().toISOString().slice(0, 10)),
          marketSummary: String(body.market_summary ?? ""),
          sentiment: String(body.sentiment ?? "mixed"),
          sentimentReason: String(body.sentiment_reason ?? ""),
          contentAngles: Array.isArray(body.content_angles)
            ? (body.content_angles as string[])
            : [],
          postX: String(body.post_x ?? ""),
          postLinkedin: String(body.post_linkedin ?? ""),
          postDiscord: String(body.post_discord ?? ""),
          blogIdea: String(body.blog_idea ?? ""),
          seoKeywords: Array.isArray(body.seo_keywords)
            ? (body.seo_keywords as string[])
            : [],
        });
        return c.json({ ok: true, stored: "daily_brief" });

      case "lead":
        await db.insert(schema.leads).values({
          name: String(body.name ?? ""),
          email: String(body.email ?? ""),
          country: String(body.country ?? ""),
          experience: String(body.experience ?? ""),
          capital: String(body.capital ?? ""),
          score: Number(body.score) || 0,
          persona: String(body.persona ?? ""),
          recommendedChallenge: String(body.recommended_challenge ?? ""),
          reasoning: String(body.reasoning ?? ""),
        });
        return c.json({ ok: true, stored: "lead" });

      case "health":
        await db.insert(schema.healthChecks).values({
          siteUp: Boolean(body.site_up),
          statusCode: Number(body.status_code) || 0,
          trustpilotRating:
            body.trustpilot_rating != null ? String(body.trustpilot_rating) : null,
          checkedAt: body.checked_at ? new Date(String(body.checked_at)) : new Date(),
        });
        return c.json({ ok: true, stored: "health" });

      default:
        return c.json(
          { ok: false, error: "unknown type — use daily_brief | lead | health" },
          400,
        );
    }
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

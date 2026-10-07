import { desc, eq } from "drizzle-orm";
import { getDb } from "./queries/connection";
import { briefs, leads, healthChecks, posts, competitors } from "@db/schema";

type Body = Record<string, unknown>;

const words = (t: string) =>
  new Set(
    t
      .toLowerCase()
      .split(/[^a-z0-9%$]+/)
      .filter((w) => w.length >= 4),
  );

// Jaccard similarity of word sets (1 = identical wording)
function similarity(a: string, b: string) {
  const A = words(a);
  const B = words(b);
  if (!A.size && !B.size) return 1;
  let inter = 0;
  A.forEach((w) => B.has(w) && inter++);
  return inter / (A.size + B.size - inter);
}

const str = (v: unknown, d = "") => (v == null ? d : String(v));

export async function handleWebhook(body: Body) {
  const db = getDb();

  switch (body.type) {
    case "daily_brief": {
      const [{ id: briefId }] = await db
        .insert(briefs)
        .values({
          date: str(body.date, new Date().toISOString().slice(0, 10)),
          marketSummary: str(body.market_summary),
          sentiment: str(body.sentiment, "mixed"),
          sentimentReason: str(body.sentiment_reason),
          contentAngles: Array.isArray(body.content_angles) ? (body.content_angles as string[]) : [],
          postX: str(body.post_x),
          postLinkedin: str(body.post_linkedin),
          postDiscord: str(body.post_discord),
          blogIdea: str(body.blog_idea),
          seoKeywords: Array.isArray(body.seo_keywords) ? (body.seo_keywords as string[]) : [],
        })
        .$returningId();

      // Queue each social post for human approval
      const drafts = [
        { platform: "x", content: str(body.post_x) },
        { platform: "linkedin", content: str(body.post_linkedin) },
        { platform: "discord", content: str(body.post_discord) },
      ].filter((d) => d.content.trim());
      const queued: { id: number; platform: string; content: string }[] = [];
      for (const d of drafts) {
        const [{ id }] = await db
          .insert(posts)
          .values({ briefId, platform: d.platform, content: d.content })
          .$returningId();
        queued.push({ id, platform: d.platform, content: d.content });
      }
      return { ok: true, stored: "daily_brief", briefId, posts: queued };
    }

    case "lead": {
      const score = Number(body.score) || 0;
      const [{ id }] = await db
        .insert(leads)
        .values({
          name: str(body.name),
          email: str(body.email),
          country: str(body.country),
          experience: str(body.experience),
          capital: str(body.capital),
          score,
          persona: str(body.persona),
          recommendedChallenge: str(body.recommended_challenge),
          reasoning: str(body.reasoning),
          status: score >= 7 ? "qualified" : "new",
        })
        .$returningId();
      return { ok: true, stored: "lead", leadId: id };
    }

    case "crm_synced": {
      await db
        .update(leads)
        .set({ crmId: str(body.crm_id), crmSyncedAt: new Date() })
        .where(eq(leads.id, Number(body.lead_id)));
      return { ok: true, stored: "crm_synced" };
    }

    case "post_decision": {
      const decision = str(body.decision);
      if (decision !== "approved" && decision !== "rejected") {
        return { ok: false, error: "decision must be approved | rejected" };
      }
      const id = Number(body.id);
      const [row] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
      if (!row) return { ok: false, error: "post not found" };
      if (row.status !== "pending") {
        return { ok: true, stored: "post_decision", alreadyDecided: true, post: row };
      }
      await db
        .update(posts)
        .set({ status: decision, decidedBy: str(body.by, "telegram"), decidedAt: new Date() })
        .where(eq(posts.id, id));
      const [updated] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
      return { ok: true, stored: "post_decision", alreadyDecided: false, post: updated };
    }

    case "competitor_batch": {
      const items = Array.isArray(body.items) ? (body.items as Body[]) : [];
      const changes: Record<string, unknown>[] = [];
      for (const it of items) {
        const domain = str(it.domain);
        if (!domain) continue;
        const rating = it.trustpilot_rating != null ? str(it.trustpilot_rating) : null;
        const offer = str(it.offer_summary);
        const [prev] = await db
          .select()
          .from(competitors)
          .where(eq(competitors.domain, domain))
          .orderBy(desc(competitors.id))
          .limit(1);
        const delta =
          prev?.trustpilotRating && rating
            ? Math.round((parseFloat(rating) - parseFloat(prev.trustpilotRating)) * 10) / 10
            : 0;
        const offerChanged = prev ? similarity(prev.offerSummary ?? "", offer) < 0.5 : false;
        const changed = delta !== 0 || offerChanged;
        await db.insert(competitors).values({
          domain,
          siteUp: Boolean(it.site_up ?? true),
          trustpilotRating: rating,
          prevRating: prev?.trustpilotRating ?? null,
          offerSummary: offer,
          promoDetected: Boolean(it.promo_detected),
          notes: str(it.notes),
          changed,
        });
        changes.push({
          domain,
          rating,
          prevRating: prev?.trustpilotRating ?? null,
          delta,
          offerChanged,
          changed,
          firstSeen: !prev,
          offer_summary: offer,
          promo_detected: Boolean(it.promo_detected),
        });
      }
      return {
        ok: true,
        stored: "competitor_batch",
        count: changes.length,
        anyChanged: changes.some((c) => c.changed && !c.firstSeen),
        changes,
      };
    }

    case "health": {
      await db.insert(healthChecks).values({
        siteUp: Boolean(body.site_up),
        statusCode: Number(body.status_code) || 0,
        trustpilotRating: body.trustpilot_rating != null ? str(body.trustpilot_rating) : null,
        checkedAt: body.checked_at ? new Date(str(body.checked_at)) : new Date(),
      });
      return { ok: true, stored: "health" };
    }

    default:
      return {
        ok: false,
        error:
          "unknown type — use daily_brief | lead | crm_synced | post_decision | competitor_batch | health",
        status: 400,
      };
  }
}

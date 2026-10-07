import { desc, eq } from "drizzle-orm";
import { getDb } from "./connection";
import { briefs, leads, healthChecks, posts, competitors } from "@db/schema";

export async function listBriefs(limit = 10) {
  return getDb().select().from(briefs).orderBy(desc(briefs.id)).limit(limit);
}

export async function listLeads(limit = 25) {
  return getDb().select().from(leads).orderBy(desc(leads.id)).limit(limit);
}

export async function setLeadStatus(id: number, status: string) {
  await getDb().update(leads).set({ status }).where(eq(leads.id, id));
  return { ok: true };
}

export async function listPosts(limit = 12) {
  return getDb().select().from(posts).orderBy(desc(posts.id)).limit(limit);
}

// Latest snapshot per competitor domain + rating history
export async function listCompetitors() {
  const rows = await getDb().select().from(competitors).orderBy(desc(competitors.id)).limit(120);
  const byDomain = new Map<string, typeof rows>();
  for (const r of rows) {
    const list = byDomain.get(r.domain) ?? [];
    list.push(r);
    byDomain.set(r.domain, list);
  }
  return Array.from(byDomain.values()).map((list) => ({
    ...list[0],
    history: list
      .slice(0, 10)
      .reverse()
      .map((r) => ({ rating: r.trustpilotRating, at: r.checkedAt })),
  }));
}

export async function listHealthChecks(limit = 48) {
  return getDb().select().from(healthChecks).orderBy(desc(healthChecks.id)).limit(limit);
}

export async function getStats() {
  const db = getDb();
  const allBriefs = await db.select().from(briefs);
  const allLeads = await db.select().from(leads);
  const allPosts = await db.select().from(posts);
  const comps = await listCompetitors();
  const checks = await db.select().from(healthChecks).orderBy(desc(healthChecks.id)).limit(200);

  const upCount = checks.filter((c) => c.siteUp).length;
  const uptimePct = checks.length ? Math.round((upCount / checks.length) * 1000) / 10 : 100;
  const hotLeads = allLeads.filter((l) => l.score >= 7).length;
  const avgScore = allLeads.length
    ? Math.round((allLeads.reduce((s, l) => s + l.score, 0) / allLeads.length) * 10) / 10
    : 0;

  const latestCheck = checks[0] ?? null;
  const ratingRow = checks.find((c) => c.trustpilotRating);

  return {
    totalBriefs: allBriefs.length,
    totalLeads: allLeads.length,
    hotLeads,
    avgScore,
    uptimePct,
    checksCount: checks.length,
    siteUp: latestCheck ? latestCheck.siteUp : true,
    lastCheckedAt: latestCheck ? latestCheck.checkedAt : null,
    trustpilotRating: ratingRow ? ratingRow.trustpilotRating : null,
    pendingPosts: allPosts.filter((p) => p.status === "pending").length,
    approvedPosts: allPosts.filter((p) => p.status === "approved").length,
    competitorsTracked: comps.length,
    crmSynced: allLeads.filter((l) => l.crmId).length,
  };
}

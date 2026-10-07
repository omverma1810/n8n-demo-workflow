import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import {
  getStats,
  listBriefs,
  listCompetitors,
  listHealthChecks,
  listLeads,
  listPosts,
  setLeadStatus,
} from "./queries/dashboard";

export const LEAD_STATUSES = ["new", "contacted", "qualified", "won", "lost"] as const;

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),

  dashboard: createRouter({
    stats: publicQuery.query(() => getStats()),
    briefs: publicQuery.query(() => listBriefs(10)),
    leads: publicQuery.query(() => listLeads(25)),
    health: publicQuery.query(() => listHealthChecks(48)),
    posts: publicQuery.query(() => listPosts(12)),
    competitors: publicQuery.query(() => listCompetitors()),
    setLeadStatus: publicQuery
      .input(z.object({ id: z.number().int(), status: z.enum(LEAD_STATUSES) }))
      .mutation(({ input }) => setLeadStatus(input.id, input.status)),
  }),
});

export type AppRouter = typeof appRouter;

import { createRouter, publicQuery } from "./middleware";
import { getStats, listBriefs, listHealthChecks, listLeads } from "./queries/dashboard";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),

  dashboard: createRouter({
    stats: publicQuery.query(() => getStats()),
    briefs: publicQuery.query(() => listBriefs(10)),
    leads: publicQuery.query(() => listLeads(25)),
    health: publicQuery.query(() => listHealthChecks(48)),
  }),
});

export type AppRouter = typeof appRouter;

import { useState } from "react";
import { trpc } from "@/providers/trpc";
import {
  Sun,
  Activity,
  Users,
  Flame,
  Gauge,
  FileText,
  Copy,
  Check,
  Star,
  Globe,
  Zap,
  Terminal,
  Newspaper,
  MessageSquare,
  Send,
} from "lucide-react";

const REFRESH = 10000;

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };
  return { copied, copy };
}

function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur ${className}`}>
      {children}
    </div>
  );
}

function CopyBtn({ id, text }: { id: string; text: string }) {
  const { copied, copy } = useCopy();
  return (
    <button
      onClick={() => copy(id, text)}
      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-lg border border-zinc-700 px-3 text-xs text-zinc-300 transition hover:border-yellow-400/60 hover:text-yellow-300"
    >
      {copied === id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
      {copied === id ? "Copied" : "Copy"}
    </button>
  );
}

const sentimentStyle: Record<string, string> = {
  "risk-on": "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  "risk-off": "bg-rose-500/15 text-rose-300 border-rose-500/40",
  mixed: "bg-amber-500/15 text-amber-300 border-amber-500/40",
};

export default function Home() {
  const stats = trpc.dashboard.stats.useQuery(undefined, { refetchInterval: REFRESH });
  const briefs = trpc.dashboard.briefs.useQuery(undefined, { refetchInterval: REFRESH });
  const leads = trpc.dashboard.leads.useQuery(undefined, { refetchInterval: REFRESH });
  const health = trpc.dashboard.health.useQuery(undefined, { refetchInterval: REFRESH });

  const s = stats.data;
  const brief = briefs.data?.[0];
  const webhookUrl =
    typeof window !== "undefined" ? `${window.location.origin}/api/webhook/n8n` : "/api/webhook/n8n";
  const [tab, setTab] = useState<"x" | "linkedin" | "discord">("x");

  const siteUp = s?.siteUp ?? true;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 [padding-bottom:env(safe-area-inset-bottom)]">
      {/* glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(250,204,21,0.12),transparent_60%)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 text-zinc-950 shadow-lg shadow-yellow-400/25">
              <Sun size={26} strokeWidth={2.4} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                SignalForge <span className="text-yellow-400">Mission Control</span>
              </h1>
              <p className="text-xs text-zinc-400 sm:text-sm">
                AI Growth Ops Engine — n8n + Gemini, running fully on free tiers
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium ${
                siteUp
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : "border-rose-500/40 bg-rose-500/10 text-rose-300"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${siteUp ? "animate-pulse bg-emerald-400" : "bg-rose-400"}`} />
              Monitored site {siteUp ? "UP" : "DOWN"}
            </span>
            {s?.trustpilotRating && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-300">
                <Star size={13} className="fill-yellow-400 text-yellow-400" />
                Trustpilot {s.trustpilotRating}
              </span>
            )}
          </div>
        </header>

        {/* Live demo banner */}
        <Card className="mt-6 border-yellow-400/30 bg-gradient-to-r from-yellow-400/10 via-zinc-900/60 to-zinc-900/60 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <Terminal className="mt-0.5 shrink-0 text-yellow-400" size={20} />
              <div>
                <p className="text-sm font-semibold text-yellow-300">Live demo endpoint</p>
                <p className="mt-0.5 text-xs leading-relaxed text-zinc-400 sm:text-sm">
                  Paste this URL into the workflow's <b className="text-zinc-200">⚙️ CONFIG → dashboardWebhookUrl</b>.
                  Every n8n run lands here within seconds — the page auto-refreshes.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <code className="max-w-full truncate rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-xs text-yellow-200 sm:text-sm">
                {webhookUrl}
              </code>
              <CopyBtn id="webhook" text={webhookUrl} />
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          {[
            { icon: FileText, label: "AI Briefs Generated", value: s?.totalBriefs ?? "—", tint: "text-yellow-300" },
            { icon: Users, label: "Leads Processed", value: s?.totalLeads ?? "—", tint: "text-sky-300" },
            { icon: Flame, label: "Hot Leads (≥7)", value: s?.hotLeads ?? "—", tint: "text-rose-300" },
            { icon: Gauge, label: "Avg Lead Score", value: s?.avgScore ?? "—", tint: "text-violet-300" },
            { icon: Activity, label: "Site Uptime", value: s ? `${s.uptimePct}%` : "—", tint: "text-emerald-300" },
          ].map((c) => (
            <Card key={c.label} className="p-4">
              <div className="flex items-center justify-between">
                <c.icon size={18} className={c.tint} />
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{c.value}</p>
              <p className="mt-1 text-[11px] text-zinc-400 sm:text-xs">{c.label}</p>
            </Card>
          ))}
        </div>

        {/* Main grid */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Brief + social (2 cols) */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Newspaper size={18} className="text-yellow-400" />
                  <h2 className="font-semibold">Latest AI Market Brief</h2>
                </div>
                {brief && (
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-[11px] font-medium ${sentimentStyle[brief.sentiment] ?? sentimentStyle.mixed}`}
                    >
                      {brief.sentiment}
                    </span>
                    <span className="text-xs text-zinc-500">{brief.date}</span>
                  </div>
                )}
              </div>

              {brief ? (
                <div className="mt-4 space-y-5">
                  <p className="text-sm leading-relaxed text-zinc-300">{brief.marketSummary}</p>
                  {brief.sentimentReason && (
                    <p className="text-xs italic text-zinc-500">Why: {brief.sentimentReason}</p>
                  )}

                  {brief.contentAngles && brief.contentAngles.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Content angles</p>
                      <ul className="mt-2 space-y-1.5">
                        {brief.contentAngles.map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                            <Zap size={14} className="mt-0.5 shrink-0 text-yellow-400" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {brief.blogIdea && (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Today's blog idea</p>
                      <p className="mt-1 text-sm text-zinc-200">{brief.blogIdea}</p>
                    </div>
                  )}

                  {brief.seoKeywords && brief.seoKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {brief.seoKeywords.map((k) => (
                        <span key={k} className="rounded-full border border-zinc-700 px-2.5 py-1 text-[11px] text-zinc-400">
                          {k}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-4 text-sm text-zinc-500">Waiting for the first brief from n8n…</p>
              )}
            </Card>

            {/* Social posts */}
            {brief && (brief.postX || brief.postLinkedin || brief.postDiscord) && (
              <Card className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={18} className="text-yellow-400" />
                    <h2 className="font-semibold">AI-Generated Social Copy</h2>
                  </div>
                  <div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-950 p-1">
                    {(["x", "linkedin", "discord"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`min-h-[36px] rounded-lg px-3.5 text-xs font-medium capitalize transition ${
                          tab === t ? "bg-yellow-400 text-zinc-950" : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {t === "x" ? "X / Twitter" : t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
                    {tab === "x" ? brief.postX : tab === "linkedin" ? brief.postLinkedin : brief.postDiscord}
                  </p>
                </div>
                <div className="mt-3 flex justify-end">
                  <CopyBtn
                    id={`post-${tab}`}
                    text={(tab === "x" ? brief.postX : tab === "linkedin" ? brief.postLinkedin : brief.postDiscord) ?? ""}
                  />
                </div>
              </Card>
            )}

            {/* Leads */}
            <Card className="p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-yellow-400" />
                <h2 className="font-semibold">AI-Scored Leads</h2>
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400">
                  webhook intake → Gemini scoring
                </span>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
                      <th className="pb-2 pr-3 font-medium">Lead</th>
                      <th className="pb-2 pr-3 font-medium">Persona</th>
                      <th className="pb-2 pr-3 font-medium">Score</th>
                      <th className="pb-2 pr-3 font-medium">Recommended</th>
                      <th className="pb-2 font-medium">Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(leads.data ?? []).map((l) => (
                      <tr key={l.id} className="border-b border-zinc-800/60 last:border-0">
                        <td className="py-3 pr-3">
                          <p className="font-medium text-zinc-200">{l.name}</p>
                          <p className="text-xs text-zinc-500">
                            {l.country} · {l.experience}
                          </p>
                        </td>
                        <td className="py-3 pr-3 text-zinc-400">{l.persona}</td>
                        <td className="py-3 pr-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              l.score >= 7
                                ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
                                : l.score >= 5
                                  ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                                  : "border-zinc-700 bg-zinc-800/60 text-zinc-400"
                            }`}
                          >
                            {l.score >= 7 && <Flame size={12} />}
                            {l.score}/10
                          </span>
                        </td>
                        <td className="py-3 pr-3 text-zinc-300">{l.recommendedChallenge}</td>
                        <td className="py-3 text-xs text-zinc-500">
                          {l.createdAt ? new Date(l.createdAt).toLocaleString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {leads.data?.length === 0 && (
                  <p className="py-6 text-center text-sm text-zinc-500">No leads yet — fire the webhook.</p>
                )}
              </div>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Uptime */}
            <Card className="p-5">
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-yellow-400" />
                <h2 className="font-semibold">Uptime Monitor</h2>
              </div>
              <p className="mt-1 text-xs text-zinc-500">Hourly checks by Pipeline C · last 48 runs</p>
              <div className="mt-4 flex flex-wrap gap-1">
                {(health.data ?? [])
                  .slice()
                  .reverse()
                  .map((h) => (
                    <div
                      key={h.id}
                      title={`${h.checkedAt ? new Date(h.checkedAt).toLocaleString() : ""} — ${h.siteUp ? "UP" : "DOWN"} (${h.statusCode})`}
                      className={`h-8 w-2.5 rounded-sm ${h.siteUp ? "bg-emerald-400/80" : "bg-rose-500"}`}
                    />
                  ))}
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-zinc-400">
                  <span>Uptime (recent)</span>
                  <span className="font-semibold text-emerald-300">{s ? `${s.uptimePct}%` : "—"}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Last check</span>
                  <span className="text-zinc-300">
                    {s?.lastCheckedAt ? new Date(s.lastCheckedAt).toLocaleTimeString() : "—"}
                  </span>
                </div>
              </div>
            </Card>

            {/* Pipeline legend */}
            <Card className="p-5">
              <div className="flex items-center gap-2">
                <Send size={18} className="text-yellow-400" />
                <h2 className="font-semibold">Workflow Pipelines</h2>
              </div>
              <ul className="mt-4 space-y-3 text-sm">
                {[
                  ["A", "Market Intel & Content Engine", "Daily 08:00 · RSS → Gemini → Sheets/Email/Telegram"],
                  ["B", "Lead Intake & AI Scoring", "Webhook · validate → Gemini score → route"],
                  ["C", "Site & Reputation Monitor", "Hourly · uptime + Trustpilot → alerts"],
                  ["D", "Global Error Handler", "Any failure → Telegram + email"],
                ].map(([k, t, d]) => (
                  <li key={k} className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-yellow-400/15 text-xs font-bold text-yellow-300">
                      {k}
                    </span>
                    <div>
                      <p className="font-medium text-zinc-200">{t}</p>
                      <p className="text-xs text-zinc-500">{d}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            <p className="px-1 text-center text-xs text-zinc-600">
              SignalForge AI Growth Ops Engine — 4 autonomous pipelines, $0/month stack
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

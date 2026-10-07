# SignalForge — Complete Project Context (for the demo video script)

*Last updated: 7 Oct 2026. Everything below reflects what is actually built and tested. Secrets (API keys, tokens, DB password) are deliberately NOT in this file.*

---

## 1. The one-line pitch

**SignalForge is an always-on AI growth team for trading brands** (prop firms, forex/crypto brokers, fintechs). It writes the daily market content, scores and answers every lead in seconds, watches competitors and your own site, asks a human to approve anything before it is published, and shows everything on one live dashboard — on a near-$0 stack.

Short version if asked "what are we automating?":
> Market-news-to-content, lead scoring and reply, site/reputation/competitor monitoring, with alerts, human approval and a live dashboard.

---

## 2. Naming and demo persona

| Thing | Value |
|---|---|
| Product name | **SignalForge** (AI Growth Ops Engine) |
| Dashboard name | **SignalForge Mission Control** |
| Fictional client brand used in the demo | **Northbridge Capital** (a made-up prop firm) |
| Monitored site | `ftmo.com` (public site, used as an example) |
| Competitors watched | `ftmo.com`, `fundednext.com`, `the5ers.com` |
| Why not the real client's name | The demo is for BrightFunded, so the product is shown on a neutral brand. Brand, site and competitors are **config values** — switching to the client's own is a 3-value change. |

---

## 3. Where everything lives

| What | Where |
|---|---|
| n8n workflow 1 (core engine, **57 nodes**) | https://xurde.app.n8n.cloud/workflow/SmbBNc1Zi0bX6tky |
| n8n workflow 2 (competitor watch + approvals, **23 nodes**) | https://xurde.app.n8n.cloud/workflow/0jL8IQIsZXzV8UDV |
| Live lead webhook (POST) | `https://xurde.app.n8n.cloud/webhook/signalforge-lead` |
| Live dashboard | https://signalforge-mission-control-demo.onrender.com |
| Dashboard data webhook | `https://signalforge-mission-control-demo.onrender.com/api/webhook/n8n` |
| Code on GitHub | https://github.com/omverma1810/n8n-demo-workflow |
| Google Sheet (system of record) | `docs.google.com/spreadsheets/d/1srd8xysWxgDhDF-gbaK7DmJg9Q9z-J66rvlxrugmJmU` |
| Telegram bot | `@xurde_n8n_bot` (alerts + approval buttons go to Om's chat) |
| Purpose document (PDF) | `docs/SignalForge_Purpose.pdf` (source: `docs/SignalForge_Purpose.tex`) |
| Setup guide | `SignalForge_n8n_Setup_Guide.md` |
| Importable workflow files | `SignalForge_AI_Growth_Ops_Engine_n8n.json`, `SignalForge_Extensions_Competitor_Approvals_n8n.json` (placeholders instead of secrets) |

Emails (daily brief, error reports, competitor alerts, approved-post emails) go to: **omverma1810@gmail.com** and **hamed@espirittech.com**. Telegram goes to Om only.

---

## 4. Tech stack and why each piece

| Tool | Role | Why chosen |
|---|---|---|
| **n8n (Cloud)** | Runs all automations | Visual, inspectable, built-in retries and error routing; self-hostable for free |
| **Google Gemini API** | Scoring, summarising, writing | Free tier, structured JSON output, good short-form writing. Model now: `gemini-2.5-flash-lite` |
| **Google Sheets** | Human-readable record of briefs, content calendar, leads, uptime, incidents | Client's team already knows it |
| **Gmail** | Briefs, lead replies, error and competitor emails | Real business mailbox via OAuth |
| **Telegram bot** | Instant alerts + approve/reject buttons | Free push notifications to a phone |
| **Mission Control dashboard** (Hono + React) on **Render** | Live shared view | Free hosting; auto-deploys from GitHub |
| **Aiven MySQL** | Dashboard database | Managed, encrypted, free dev tier |
| **GitHub** (`omverma1810`) | Source control for everything | Reproducible client deployments |
| `r.jina.ai` reader | Reads Trustpilot pages | Trustpilot blocks normal bots (403); this gets the rating |

---

## 5. The pipelines (what to show on the n8n canvas)

### Workflow 1 — core engine
| # | Pipeline | Trigger | What it does |
|---|---|---|---|
| **A** | Market intel and content | Daily 08:00, or the **▶️ Manual: Run Demo Now** button | Reads 3 finance RSS feeds + 1 target page → Gemini writes a market brief, sentiment, content angles, X/LinkedIn/Discord copy and blog title/keywords → 12 s pause → second Gemini call drafts a blog outline → logs to Sheets (Daily Briefs + Content Calendar), emails the team, Telegram summary, pushes to dashboard → **queues the 3 social posts for approval and sends them to Telegram with Approve/Reject buttons** |
| **B** | Lead intake and scoring | Webhook POST | Validates (needs an email with @) → Gemini scores 1–10, gives persona, recommended challenge, drafts a personalised reply → instantly answers the caller with JSON → logs to Sheets and dashboard → **score ≥ 7: Telegram HOT LEAD alert + priority email to the lead**; otherwise a nurture email → dashboard sets CRM status (hot = "qualified", others "new") → **HubSpot upsert if a token is configured** |
| **C** | Site and reputation monitor | Hourly | Reads the target site's Trustpilot score (reader proxy), checks the site is up, computes health, logs uptime to Sheets and dashboard; if down → Telegram alert + incident row |
| **D** | Error handler | Any failure in any pipeline | Telegram + email naming the failed step, the reason and a link to the failed run |

### Workflow 2 — extensions
| # | Pipeline | Trigger | What it does |
|---|---|---|---|
| **E** | Competitor watch | Daily 09:00, or manual | For each competitor: rating + homepage text → one Gemini call returns each one's current offer / promo / note → dashboard stores a snapshot and **detects changes** (rating moved, or offer wording changed a lot) → Telegram daily digest; **email alert only if something changed** |
| **F** | Approval before publish | Telegram button press | Button press → instant "got it" → dashboard records approved/rejected (and refuses double-decisions) → confirmation message on Telegram → **approved posts are emailed to the team as "ready to publish"** |
| **G** | CRM sync | Part of lead flow | Dashboard mini-CRM status per lead (new / contacted / qualified / won / lost, editable by dropdown) + HubSpot sync step |

Posting to X/LinkedIn/Discord is **not** automated — approval hands the final copy to the team by email. (That is a deliberate safety choice, and the next integration.)

---

## 6. Dashboard sections (what the client sees)

Header with live **site UP/DOWN** and **Trustpilot** badge → 9 stat tiles (briefs, leads, hot leads, avg score, uptime, posts awaiting approval, posts approved, competitors watched, leads synced to CRM) → **Latest AI Market Brief** (sentiment, angles, blog idea, keywords) → **Social copy** tabs (X/LinkedIn/Discord) with copy buttons → **Approval Queue** (each post pending/approved/rejected and who decided) → **Competitor Watch** table (rating, arrows, offer text, "promo" / "changed" tags) → **AI-Scored Leads** with CRM status dropdown → **Uptime monitor** bars → pipeline legend. Auto-refreshes every 10 s.

---

## 7. What is proven vs. not yet proven (be honest on camera)

### ✅ Verified with real runs
| Claim | Evidence |
|---|---|
| Lead analysed in seconds | Webhook answered a full scored JSON in **4.2 s** (whole run 10.7 s) |
| Scoring and persona | Hot lead scored **9/10, "Funded Veteran"**, $100K challenge; low-intent lead scored **5/10, "Aspiring Beginner"**, $5K challenge — routed to the nurture branch |
| Hot-lead escalation | Telegram alert delivered (message ID 6) and priority email sent (Gmail ID labelled SENT) |
| Content generation | Brief, sentiment, 3 social posts and blog outline generated and logged to Sheets, email, Telegram and dashboard |
| Monitoring | Hourly check + Trustpilot **4.8** + uptime **100%** visible on dashboard |
| Error detection | A **deliberate failure** (wrong AI model name) triggered the error workflow **0.1 s later**; Telegram (ID 7) and email (labelled SENT) both delivered; then restored |
| Competitor watch | 3 real competitors with live ratings (4.8 / 4.5 / 4.7) and extracted offers; second run correctly showed no change |
| Approval requests | 3 posts queued and 3 Telegram messages with buttons delivered (IDs 13–15) |
| Dashboard | Briefs, leads, health, competitors, posts all received through the webhook; lead status dropdown works |

### ⚠️ Not yet fully proven
| Item | Status |
|---|---|
| **Approval button tap → dashboard update → approved-post email** | Backend logic tested (approve, reject, and double-tap guard). The live **button tap on a phone has not been done yet** — do it once before recording |
| **HubSpot sync** | Built; skipped when no token is set. Needs a free HubSpot Private App token (`crm.objects.contacts.write`) to test |
| **Competitor change alert in the wild** | Detection logic tested with a simulated rating drop and promo change; a real change hasn't happened yet |
| **Nurture email delivery** | Node ran successfully; I haven't looked inside the inbox |

---

## 8. Things that will bite you during recording

1. **Gemini free tier = about 20 requests per day, per model.** Pipeline A uses 2, each lead 1, competitor watch 1. We used up `gemini-2.5-flash` during testing and switched to `gemini-2.5-flash-lite`. **Plan the take: ≤ 1 brief run, a few leads, 1 competitor run.** Or switch the key to a billed one.
2. **Render free tier sleeps after ~15 min idle.** Open the dashboard **a minute or two before recording**; otherwise the first load takes 30–50 s. Dashboard pushes retry 5×5 s, but the page itself won't wake until visited.
3. **The lead-status dropdown has no login.** Don't suggest it's production-ready for real client data.
4. **Keys sit in the workflow's CONFIG nodes** (demo convenience). Do not screen-share a CONFIG node. Rotate the Gemini key, Telegram bot token and database password afterwards — they were shared in chat.
5. **Don't save the n8n workflow from an old open browser tab** — it once overwrote the rebrand with an older copy. Refresh the editor first.
6. **n8n Cloud trial limits** apply to the account; the workflows are published and active.

---

## 9. Demo pre-flight checklist (10 minutes before)

- [ ] Open the dashboard once to wake it; confirm tiles load.
- [ ] Delete duplicate / test rows in the Google Sheet tabs (Daily Briefs, Content Calendar, Leads) so the demo starts clean.
- [ ] Optional: clear stale dashboard rows (ask to run a clean-up).
- [ ] Phone ready with Telegram open to `@xurde_n8n_bot`; inbox open on omverma1810@gmail.com.
- [ ] n8n editor refreshed; workflow 1 and workflow 2 both show **Published**.
- [ ] Do one **dry-run approval tap** so you know the buttons work.
- [ ] Terminal ready with the sample `curl` commands below.

---

## 10. Suggested video flow (~8–10 min) — adapt freely

| Time | Scene | What you say / do |
|---|---|---|
| 0:00 | Hook | "Trading brands lose leads and time to manual work. This is an AI growth team that never sleeps." Show the dashboard briefly. |
| 0:40 | The problem | Slow lead replies, content treadmill, blind spots on site and competitors (use the 4 pain points from the PDF). |
| 1:20 | Architecture | Show the PDF diagram (page 2): triggers → n8n → Gemini → Sheets / dashboard / Gmail / Telegram. |
| 2:00 | Pipeline A live | In n8n click **Run Demo Now**; show feeds → Gemini → outputs lighting up. Flip to dashboard: new brief and sentiment. Show Sheet rows and the email. |
| 3:30 | Approval before publish | Phone: Telegram shows 3 posts with buttons. Tap **Approve** on one, **Reject** on another. Show dashboard Approval Queue update and the "ready to publish" email. |
| 5:00 | Lead scoring | Run the hot-lead `curl`; show the JSON (score, persona, challenge) arriving in ~4 s, then the Telegram HOT LEAD alert, the priority email, the lead on the dashboard with status "qualified". Run the low-intent lead → nurture branch. |
| 6:30 | Competitor watch | Dashboard Competitor Watch table; explain daily digest and change alerts. Optionally run it once (uses 1 Gemini call). |
| 7:30 | Reliability | Mention hourly monitor, uptime bars, Trustpilot; show the **error handler** message from the earlier deliberate-failure test (screenshot) — don't break production live. |
| 8:15 | Close | "Change three values — brand, site, competitors — and this runs on your brand. Runs on a near-$0 stack." Roadmap: HubSpot, auto-posting, weekly report, multi-brand. |

### Sample lead payloads

Hot lead (expect score ~9, Telegram alert + priority email):
```bash
curl -X POST https://xurde.app.n8n.cloud/webhook/signalforge-lead \
  -H "Content-Type: application/json" \
  -d '{"name":"Jordan Blake","email":"omverma1810@gmail.com","country":"United Kingdom","experience":"6 years FX and indices, passed two prop firm challenges","capital":"£2000","message":"Ready to start a 100K challenge this week, how fast are payouts?"}'
```

Low-intent lead (expect score ~5, nurture email, status "new"):
```bash
curl -X POST https://xurde.app.n8n.cloud/webhook/signalforge-lead \
  -H "Content-Type: application/json" \
  -d '{"name":"Priya Nair","email":"omverma1810@gmail.com","country":"India","experience":"1 year, mostly demo trading","capital":"$100","message":"Just exploring, what is the smallest challenge?"}'
```

Invalid payload (no email) returns an HTTP 400 JSON error — a quick way to show validation.

---

## 11. Talking points: benefits

- **Speed to lead** — scored, answered and routed in seconds, 24/7.
- **Consistent content** — a brief and publish-ready copy every morning, tied to what moved markets.
- **Safety** — nothing is published without a human tapping Approve.
- **Early warning** — downtime, rating changes and competitor offer changes reach a phone.
- **One source of truth** — Sheets for analysts, dashboard for managers, Telegram/email for action.
- **Near-zero cost, low lock-in** — free-tier stack; workflows are portable JSON files; services can be swapped.
- **White-label** — brand, monitored site, competitors, recipients are settings.

Commercial angle (illustrative): setup fee + monthly retainer per brand; higher tier for competitor watch, CRM sync and multi-brand.

---

## 12. Honest "what we fixed along the way" (good for a behind-the-scenes segment)

The original export had real bugs that were found by testing and fixed: Google Sheets nodes used an outdated setting; the lead pipeline dropped its own input data; the "priority reply" lost its recipient; the incident log recorded Telegram's reply instead of the incident; the Trustpilot rating was always empty because of step ordering; AI "thinking" tokens truncated Gemini's JSON (score 0); Telegram Markdown rejected AI text; and the dashboard missed a lead while Render was waking (now retried). Free-tier limits (Gemini daily cap, Render sleep) are documented above.

---

## 13. What's next (agreed roadmap)

1. Finish the live approval tap test.
2. Add a HubSpot token and test CRM sync end to end.
3. Auto-publish approved posts (needs X/LinkedIn/Discord credentials).
4. Weekly executive report, multi-brand dashboard, compliance checks for financial promotions.
5. Login for the dashboard; move keys into n8n credentials; paid Gemini key.

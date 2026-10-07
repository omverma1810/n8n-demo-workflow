# ☀️ BrightFunded — AI Growth Ops Engine
### n8n Demo Setup Guide (100% free stack)

You received two deliverables:

1. **`BrightFunded_AI_Growth_Ops_Engine_n8n.json`** — a 51-node n8n workflow with 4 autonomous pipelines
2. **BrightFunded Mission Control** — a live dashboard website that receives the workflow's output via webhook (the version card in this chat previews it)

Everything runs on **free tiers**: n8n self-hosted (free forever) or n8n Cloud trial, Gemini API free tier via your Google account, Google Sheets, Gmail, and Telegram.

---

## The 4 Pipelines (what the client sees)

| Pipeline | Trigger | What it does |
|---|---|---|
| 🅰️ **Market Intel & Content Engine** | Daily 08:00 (or manual) | Pulls 3 trading RSS feeds + scrapes brightfunded.com → Gemini writes a market brief, sentiment, content angles, X/LinkedIn/Discord posts + a full blog outline → logs to Google Sheets, emails the team, pings Telegram, updates the dashboard |
| 🅱️ **Lead Intake & AI Scoring** | Webhook `POST /webhook/brightfunded-lead` | Validates payload → Gemini scores the lead 1–10, classifies persona, recommends a challenge size, drafts a personalized reply → hot leads (≥7) trigger instant Telegram alert + AI-drafted email; others get a nurture email |
| 🅲 **Site & Reputation Monitor** | Hourly | Checks brightfunded.com availability + scrapes Trustpilot rating → logs uptime → instant Telegram alert if the site goes down |
| 🅳 **Global Error Handler** | On any failure | Telegram + email alert with the failed node, error message, and execution link |

---

## Step 1 — Get your free Gemini API key (2 min)

1. Go to **https://aistudio.google.com/apikey** and sign in with your Google account (your Google AI Pro account works — the API key itself is free)
2. Click **Create API key** → copy it
3. Free tier covers ~1,500 requests/day on `gemini-2.5-flash` — far more than this demo needs

## Step 2 — Run n8n (pick one)

**Option A — n8n Cloud (fastest, 14-day free trial):** sign up at https://n8n.io

**Option B — Self-hosted (free forever, recommended):**
```bash
docker run -it --rm -p 5678:5678 -v n8n_data:/home/node/.n8n docker.n8n.io/n8nio/n8n
```
Then open http://localhost:5678

## Step 3 — Import the workflow

1. In n8n: **⋯ (top right) → Import from File** → select `BrightFunded_AI_Growth_Ops_Engine_n8n.json`
2. Open the **⚙️ CONFIG** node (there are 4 copies — one per pipeline — fill in all four with the same values):
   - `geminiApiKey` → your key from Step 1
   - `googleSheetId` → from Step 4
   - `telegramChatId` → from Step 5
   - `teamEmail` → your email
   - `dashboardWebhookUrl` → from Step 6

## Step 4 — Google Sheet (3 min)

1. Create a new Google Sheet, copy its ID from the URL (`docs.google.com/spreadsheets/d/<THIS_ID>/edit`)
2. Create 5 tabs: **Daily Briefs**, **Content Calendar**, **Leads**, **Uptime Log**, **Incidents**
3. Header rows:
   - **Daily Briefs**: `date | market_summary | sentiment | sentiment_reason | post_x | post_linkedin | post_discord | blog_idea | headline_count`
   - **Content Calendar**: `date | blog_title | seo_keywords | blog_outline | status`
   - **Leads**: `received_at | name | email | country | experience | capital | message | score | persona | recommended_challenge | reasoning | draft_reply`
   - **Uptime Log** & **Incidents**: `checked_at | url | site_up | status_code | trustpilot_rating`
4. In n8n, open any Google Sheets node → **Credential → Create new** → sign in with Google (OAuth, free)

## Step 5 — Telegram (3 min)

1. Message **@BotFather** → `/newbot` → copy the bot token
2. In n8n, open a Telegram node → create credential with that token
3. Get your chat ID: message your bot, then open `https://api.telegram.org/bot<TOKEN>/getUpdates` → look for `"chat":{"id":123456789`

## Step 6 — Connect the Mission Control dashboard

The dashboard is previewed from the version card in this chat. For n8n to reach it, the site needs a **public URL**:

1. Click **Publish** on the website version → you get a public URL like `your-site.ok.kimi.link`
2. Set `dashboardWebhookUrl` in all 4 CONFIG nodes to: `https://your-site.ok.kimi.link/api/webhook/n8n`

*(If you self-host n8n on the same machine you could skip publishing and just demo locally, but the published URL is what works from anywhere.)*

## Step 7 — Enable the error handler

**Workflow Settings → Error Workflow → select "☀️ BrightFunded — AI Growth Ops Engine"** (it handles its own errors via the ⚠️ Error Trigger).

## Step 8 — Activate

Toggle the workflow **Active**. Done.

---

## 🎬 Client Demo Script (10 minutes)

1. **Open the Mission Control dashboard** side-by-side with n8n
2. Click **▶️ Manual: Run Demo Now** → watch Pipeline A light up: 3 RSS feeds merge, site scrape, two Gemini calls, then 5 outputs firing in parallel
3. **Show the dashboard update live** — new brief, sentiment badge, social copy, uptime stats (auto-refreshes every 10s)
4. Open the **Google Sheet** — new rows in Daily Briefs + Content Calendar
5. Show the **email + Telegram message** that just arrived
6. Fire a test lead into Pipeline B:
```bash
curl -X POST https://<your-n8n-host>/webhook/brightfunded-lead \
  -H "Content-Type: application/json" \
  -d '{"name":"Alex Meyer","email":"alex@example.com","country":"Germany","experience":"4 years forex, funded at FTMO","capital":"€1000","message":"Looking to scale to a bigger account"}'
```
7. Show the JSON response (score, persona, recommended challenge), then the **Telegram hot-lead alert** and the **AI-drafted reply email**
8. Walk the canvas: 51 nodes, 4 pipelines, sticky notes, error handling — then drop the line: *"Total monthly cost: $0."*

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Gemini node returns 400/404 | Check the API key; if `gemini-2.5-flash` is unavailable, set `geminiModel` to `gemini-flash-latest` in CONFIG |
| Gemini returns 429 | Free-tier rate limit hit — wait a minute, it resets quickly |
| Google Sheets node fails | Reconnect the Google credential; check tab names match exactly |
| Telegram silent | Verify chat ID via `getUpdates`; make sure you messaged the bot first |
| Dashboard not updating | Confirm the site is published and `dashboardWebhookUrl` ends with `/api/webhook/n8n` |
| RSS feed empty | One feed being down is fine — the merge still works with the other two |

## Cost recap (for the client's Q&A)

- n8n self-hosted: **$0** (fair-code license)
- Gemini API free tier: **$0** (1,500 req/day)
- Google Sheets + Gmail: **$0**
- Telegram Bot API: **$0**
- Total: **$0/month** — scales to paid tiers only when volume demands it

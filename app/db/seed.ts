import { getDb } from "../api/queries/connection";
import { briefs, leads, healthChecks } from "./schema";

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  await db.insert(briefs).values([
    {
      date: new Date().toISOString().slice(0, 10),
      marketSummary:
        "USD softened after a cooler-than-expected CPI print, lifting EUR/USD to a three-week high while gold consolidated near record territory. Crypto majors rallied as risk appetite returned, with BTC reclaiming a key level ahead of the weekend. For prop traders, volatility is elevated around US data releases — a favorable environment for disciplined breakout strategies.",
      sentiment: "risk-on",
      sentimentReason: "Soft inflation data boosted equities and crypto while pressuring the dollar.",
      contentAngles: [
        "How Northbridge Capital traders capitalized on post-CPI volatility",
        "Risk management during high-impact news: the 5-minute rule explained",
        "Why no-time-limit challenges win in choppy macro weeks",
      ],
      postX: "🚨 CPI came in soft and the dollar slipped — volatility is BACK. Northbridge Capital traders keep up to 100% of profits on moves like this. Pass the challenge, trade our capital. #NorthbridgeCapital #PropTrading #Forex",
      postLinkedin:
        "Yesterday's cooler CPI print sent a clear signal: volatility is returning to FX and crypto markets — and prepared traders are being rewarded for it.\n\nAt Northbridge Capital, our funded traders trade simulated capital up to $400K and keep up to 100% of the profits, paid in real cash within 24 hours — guaranteed.\n\nNo time limits. No consistency rules. Just skill.\n\nIf this week's price action showed you anything, it's that opportunity favors the funded.",
      postDiscord:
        "☀️ GM traders! Soft CPI → dollar dip → alt rally 📈\nPerfect week for breakout setups. Remember: funded accounts have a 5-min news restriction — plan around the calendar! 🗓️\nWho caught the EUR/USD move? 👀",
      blogIdea: "Trading the CPI Release: A Funded Trader's Playbook for News Volatility",
      seoKeywords: ["prop firm", "funded trader", "CPI trading", "forex challenge", "Northbridge Capital"],
    },
  ]);

  await db.insert(leads).values([
    {
      name: "Sara Lindqvist",
      email: "sara.l@example.com",
      country: "Sweden",
      experience: "3 years forex, swing trader",
      capital: "€500",
      score: 9,
      persona: "Retail Grinder",
      recommendedChallenge: "$50K 2-Step Challenge",
      reasoning: "Experienced swing trader with realistic capital — strong fit for a mid-size challenge and likely to pass both phases.",
    },
    {
      name: "Daniel Okafor",
      email: "d.okafor@example.com",
      country: "Nigeria",
      experience: "6 months, mostly demo",
      capital: "€100",
      score: 6,
      persona: "Aspiring Beginner",
      recommendedChallenge: "$5K 2-Step Challenge",
      reasoning: "Early-stage trader with limited budget; a small challenge keeps risk low while he builds consistency.",
    },
    {
      name: "Marco Rossi",
      email: "marco.r@example.com",
      country: "Italy",
      experience: "5 years, funded at 2 other firms",
      capital: "€1,000",
      score: 8,
      persona: "Funded Veteran",
      recommendedChallenge: "$100K 2-Step Challenge",
      reasoning: "Already funded elsewhere — high intent and budget; respond fast with scaling-plan details to convert.",
    },
  ]);

  const now = Date.now();
  const rows = Array.from({ length: 24 }, (_, i) => ({
    siteUp: i !== 9,
    statusCode: i === 9 ? 503 : 200,
    trustpilotRating: "4.6",
    checkedAt: new Date(now - (24 - i) * 3600_000),
  }));
  await db.insert(healthChecks).values(rows);

  console.log("Done.");
  process.exit(0);
}

seed();

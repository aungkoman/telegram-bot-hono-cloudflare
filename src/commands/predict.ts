import type { Bindings } from "../types";
import { findUpcomingMatchByTeams, upsertPrediction } from "../lib/db";
import { escapeHtml } from "../lib/telegram";

// Expected format: /predict Arsenal-Chelsea 2-1
//                  /predict Arsenal vs Chelsea 2-1
const PREDICT_RE = /^\/predict\s+(.+?)\s*[-–]\s*(.+?)\s+(\d+)\s*[-:]\s*(\d+)\s*$/i;
const PREDICT_RE_VS = /^\/predict\s+(.+?)\s+vs\.?\s+(.+?)\s+(\d+)\s*[-:]\s*(\d+)\s*$/i;

export async function handlePredict(db: D1Database, text: string, userId: number, groupId: number): Promise<string> {
  const match = text.match(PREDICT_RE) ?? text.match(PREDICT_RE_VS);

  if (!match) {
    return (
      "Couldn't parse that. Use:\n" +
      "<code>/predict Arsenal-Chelsea 2-1</code>\n" +
      "or\n" +
      "<code>/predict Arsenal vs Chelsea 2-1</code>"
    );
  }

  const [, homeTeam, awayTeam, homeGoalsStr, awayGoalsStr] = match;
  const homeGoals = Number(homeGoalsStr);
  const awayGoals = Number(awayGoalsStr);

  if (homeGoals > 20 || awayGoals > 20) {
    return "That's a bold prediction 😄 but let's keep scorelines realistic (0-20 max).";
  }

  const fixture = await findUpcomingMatchByTeams(db, homeTeam.trim(), awayTeam.trim());

  if (!fixture) {
    return `Couldn't find an upcoming match matching "${escapeHtml(homeTeam)} vs ${escapeHtml(
      awayTeam
    )}". Try /fixtures to see what's available, and check the spelling.`;
  }

  const m = fixture as any;
  const kickoff = new Date(m.kickoff_time);
  if (kickoff.getTime() <= Date.now()) {
    return `⏱ Predictions for <b>${escapeHtml(m.home_team)} vs ${escapeHtml(
      m.away_team
    )}</b> are closed — kickoff has already passed.`;
  }

  await upsertPrediction(db, userId, groupId, m.id, homeGoals, awayGoals);

  return `✅ Got it! You predicted <b>${escapeHtml(m.home_team)} ${homeGoals}-${awayGoals} ${escapeHtml(
    m.away_team
  )}</b>. Good luck!`;
}

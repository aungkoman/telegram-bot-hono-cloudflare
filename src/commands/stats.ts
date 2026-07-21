import { getLeaderboard, getTodayFixturesForGroup, getUserPredictions } from "../lib/db";
import { escapeHtml } from "../lib/telegram";

export async function handleFixtures(db: D1Database): Promise<string> {
  const { results } = await db
    .prepare(
      `SELECT * FROM matches
       WHERE status = 'SCHEDULED' AND kickoff_time >= datetime('now')
       ORDER BY kickoff_time ASC
       LIMIT 15`
    )
    .all<any>();

  if (!results.length) {
    return "No upcoming fixtures loaded yet — check back soon, or the season may be between rounds.";
  }

  const lines = results.map((m) => {
    const dt = new Date(m.kickoff_time);
    const when = dt.toLocaleString("en-GB", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
    return `• <b>${escapeHtml(m.home_team)}</b> vs <b>${escapeHtml(m.away_team)}</b> — ${when} UTC`;
  });

  return `📅 <b>Upcoming fixtures</b>\n\n${lines.join("\n")}\n\nPredict with <code>/predict Team-Team 2-1</code>`;
}

export async function handleLeaderboard(db: D1Database, groupId: number): Promise<string> {
  const results = (await getLeaderboard(db, groupId)) as any[];

  if (!results.length) {
    return "No points on the board yet — submit some predictions with /predict!";
  }

  const lines = results.map((row, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
    const name = row.username ? "@" + row.username : row.first_name;
    return `${medal} ${escapeHtml(name)} — ${row.total_points} pts`;
  });

  return `🏆 <b>Leaderboard</b>\n\n${lines.join("\n")}`;
}

export async function handleMyPredictions(db: D1Database, userId: number, groupId: number): Promise<string> {
  const results = (await getUserPredictions(db, userId, groupId)) as any[];

  if (!results.length) {
    return "You haven't made any predictions yet. Try /fixtures then /predict Team-Team 2-1";
  }

  const lines = results.map((p) => {
    const played = p.status === "FINISHED";
    const scoreStr = played ? `${p.home_score}-${p.away_score}` : "not played yet";
    const pointsStr = p.points_awarded === null || p.points_awarded === undefined ? "pending" : `${p.points_awarded} pts`;
    return `• ${escapeHtml(p.home_team)} ${p.predicted_home}-${p.predicted_away} ${escapeHtml(
      p.away_team
    )} (actual: ${scoreStr}) → ${pointsStr}`;
  });

  return `📋 <b>Your recent predictions</b>\n\n${lines.join("\n")}`;
}

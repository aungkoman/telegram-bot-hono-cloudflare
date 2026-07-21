import type { Bindings } from "./types";
import { fetchUpcomingFixtures, fetchFinishedFixtures, type FdMatch } from "./lib/footballData";
import { calculatePoints } from "./lib/scoring";
import { tgClient } from "./lib/telegram";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Pull fixtures for the next N days for every tracked competition and upsert into D1. */
export async function syncFixtures(env: Bindings) {
  console.log(`[Cron: syncFixtures] Starting fixture sync...`);
  const codes = env.TRACKED_COMPETITIONS.split(",").map((c) => c.trim()).filter(Boolean);
  const from = isoDate(new Date());
  const to = isoDate(new Date(Date.now() + 6 * 24 * 60 * 60 * 1000)); // next 6 days

  console.log(`[Cron: syncFixtures] Tracking competitions: ${codes.join(", ")} | Date range: ${from} to ${to}`);

  for (const code of codes) {
    console.log(`[Cron: syncFixtures] Fetching upcoming matches for ${code}...`);
    try {
      const matches = await fetchUpcomingFixtures(env.FOOTBALL_DATA_API_KEY, code, from, to);
      console.log(`[Cron: syncFixtures] Found ${matches.length} matches for ${code}. Upserting into DB...`);

      for (const m of matches) {
        await upsertMatch(env.DB, m);
      }
    } catch (err) {
      console.error(`[Cron: syncFixtures] ❌ Error fetching/upserting matches for ${code}:`, err);
    }

    // Free tier is 10 req/min; a short pause between competitions keeps us safe.
    await sleep(1500);
  }
  console.log(`[Cron: syncFixtures] ✅ Fixture sync complete.`);
}

/** Pull recently finished results, update scores, then award points for any unscored predictions. */
export async function syncResultsAndScore(env: Bindings) {
  console.log(`[Cron: syncResultsAndScore] Starting result sync and scoring...`);
  const codes = env.TRACKED_COMPETITIONS.split(",").map((c) => c.trim()).filter(Boolean);
  const from = isoDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)); // last 2 days
  const to = isoDate(new Date());

  console.log(`[Cron: syncResultsAndScore] Tracking competitions: ${codes.join(", ")} | Date range: ${from} to ${to}`);

  for (const code of codes) {
    console.log(`[Cron: syncResultsAndScore] Fetching finished matches for ${code}...`);
    try {
      const matches = await fetchFinishedFixtures(env.FOOTBALL_DATA_API_KEY, code, from, to);
      console.log(`[Cron: syncResultsAndScore] Found ${matches.length} finished matches for ${code}. Upserting into DB...`);

      for (const m of matches) {
        await upsertMatch(env.DB, m);
      }
    } catch (err) {
      console.error(`[Cron: syncResultsAndScore] ❌ Error fetching/upserting results for ${code}:`, err);
    }
    await sleep(1500);
  }

  console.log(`[Cron: syncResultsAndScore] Moving on to award points...`);
  await awardPointsForFinishedMatches(env);
  console.log(`[Cron: syncResultsAndScore] ✅ Result sync and scoring complete.`);
}

async function upsertMatch(db: D1Database, m: FdMatch) {
  const homeScore = m.score.fullTime.home;
  const awayScore = m.score.fullTime.away;
  await db
    .prepare(
      `INSERT INTO matches (external_id, competition_code, home_team, away_team, kickoff_time, status, home_score, away_score)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
       ON CONFLICT(external_id) DO UPDATE SET
         status = ?6, home_score = ?7, away_score = ?8`
    )
    .bind(
      m.id,
      m.competition.code,
      m.homeTeam.name,
      m.awayTeam.name,
      m.utcDate,
      m.status,
      homeScore,
      awayScore
    )
    .run();
}

async function awardPointsForFinishedMatches(env: Bindings) {
  const db = env.DB;
  const exactPoints = Number(env.POINTS_EXACT ?? 3);
  const outcomePoints = Number(env.POINTS_OUTCOME ?? 1);

  const { results: matches } = await db
    .prepare(
      `SELECT id, home_score, away_score FROM matches 
       WHERE status = 'FINISHED' AND scored = 0 
         AND home_score IS NOT NULL AND away_score IS NOT NULL`
    )
    .all<{ id: number; home_score: number; away_score: number }>();

  if (!matches.length) {
    console.log(`[Cron: awardPoints] No unscored, finished matches found. Nothing to do.`);
    return;
  }

  console.log(`[Cron: awardPoints] Found ${matches.length} finished matches waiting to be scored.`);
  const tg = tgClient(env.TELEGRAM_BOT_TOKEN);

  for (const match of matches) {
    console.log(`[Cron: awardPoints] Scoring match ID ${match.id} (${match.home_score} - ${match.away_score})...`);

    const { results: preds } = await db
      .prepare(
        `SELECT id, user_id, group_id, predicted_home, predicted_away 
         FROM predictions WHERE match_id = ?1 AND points_awarded IS NULL`
      )
      .bind(match.id)
      .all<{ id: number; user_id: number; group_id: number; predicted_home: number; predicted_away: number }>();

    console.log(`[Cron: awardPoints] Found ${preds.length} predictions for match ID ${match.id}.`);

    for (const p of preds) {
      const points = calculatePoints(
        p.predicted_home,
        p.predicted_away,
        match.home_score,
        match.away_score,
        exactPoints,
        outcomePoints
      );

      await db.prepare(`UPDATE predictions SET points_awarded = ?1 WHERE id = ?2`).bind(points, p.id).run();

      await db
        .prepare(
          `UPDATE memberships SET total_points = total_points + ?1 
           WHERE user_id = ?2 AND group_id = ?3`
        )
        .bind(points, p.user_id, p.group_id)
        .run();
    }

    await db.prepare(`UPDATE matches SET scored = 1 WHERE id = ?1`).bind(match.id).run();
    console.log(`[Cron: awardPoints] Match ID ${match.id} successfully scored and marked as complete.`);
  }

  // Post an updated leaderboard...
  const { results: activeGroups } = await db
    .prepare(
      `SELECT DISTINCT g.chat_id, g.id as group_id, g.title 
       FROM predictions p 
       JOIN groups g ON g.id = p.group_id 
       WHERE p.match_id IN (${matches.map((_, i) => `?${i + 1}`).join(",")})`
    )
    .bind(...matches.map((m) => m.id))
    .all<{ chat_id: number; group_id: number; title: string }>();

  console.log(`[Cron: awardPoints] Preparing to notify ${activeGroups.length} groups with updated leaderboards.`);

  for (const group of activeGroups) {
    const { results: leaderboard } = await db
      .prepare(
        `SELECT u.username, u.first_name, mem.total_points 
         FROM memberships mem JOIN users u ON u.id = mem.user_id 
         WHERE mem.group_id = ?1 ORDER BY mem.total_points DESC LIMIT 10`
      )
      .bind(group.group_id)
      .all<{ username: string | null; first_name: string; total_points: number }>();

    if (!leaderboard.length) continue;

    const lines = leaderboard.map(
      (row, i) => `${i + 1}. ${row.username ? "@" + row.username : row.first_name} — ${row.total_points} pts`
    );
    const text = `⚽️ <b>Results are in — leaderboard updated!</b>\n\n${lines.join("\n")}`;

    try {
      await tg.sendMessage(group.chat_id, text);
      console.log(`[Cron: awardPoints] Leaderboard sent to group ${group.group_id} (${group.title})`);
    } catch (err) {
      console.error(`[Cron: awardPoints] ❌ Failed to send leaderboard to group ${group.group_id}:`, err);
    }
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
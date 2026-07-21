import type { Bindings } from "../types";

export async function upsertUser(db: D1Database, telegramId: number, username: string | undefined, firstName: string) {
  await db
    .prepare(
      `INSERT INTO users (telegram_id, username, first_name)
       VALUES (?1, ?2, ?3)
       ON CONFLICT(telegram_id) DO UPDATE SET username = ?2, first_name = ?3`
    )
    .bind(telegramId, username ?? null, firstName)
    .run();

  const row = await db
    .prepare(`SELECT id FROM users WHERE telegram_id = ?1`)
    .bind(telegramId)
    .first<{ id: number }>();
  return row!.id;
}

export async function upsertGroup(db: D1Database, chatId: number, title: string | undefined) {
  await db
    .prepare(
      `INSERT INTO groups (chat_id, title)
       VALUES (?1, ?2)
       ON CONFLICT(chat_id) DO UPDATE SET title = ?2`
    )
    .bind(chatId, title ?? null)
    .run();

  const row = await db
    .prepare(`SELECT id FROM groups WHERE chat_id = ?1`)
    .bind(chatId)
    .first<{ id: number }>();
  return row!.id;
}

export async function ensureMembership(db: D1Database, userId: number, groupId: number) {
  await db
    .prepare(
      `INSERT INTO memberships (user_id, group_id, total_points)
       VALUES (?1, ?2, 0)
       ON CONFLICT(user_id, group_id) DO NOTHING`
    )
    .bind(userId, groupId)
    .run();
}

export async function findUpcomingMatchByTeams(db: D1Database, homeQuery: string, awayQuery: string) {
  return db
    .prepare(
      `SELECT * FROM matches
       WHERE status = 'SCHEDULED'
         AND lower(home_team) LIKE '%' || lower(?1) || '%'
         AND lower(away_team) LIKE '%' || lower(?2) || '%'
       ORDER BY kickoff_time ASC
       LIMIT 1`
    )
    .bind(homeQuery, awayQuery)
    .first();
}

export async function upsertPrediction(
  db: D1Database,
  userId: number,
  groupId: number,
  matchId: number,
  home: number,
  away: number
) {
  await db
    .prepare(
      `INSERT INTO predictions (user_id, group_id, match_id, predicted_home, predicted_away)
       VALUES (?1, ?2, ?3, ?4, ?5)
       ON CONFLICT(user_id, group_id, match_id)
       DO UPDATE SET predicted_home = ?4, predicted_away = ?5, points_awarded = NULL`
    )
    .bind(userId, groupId, matchId, home, away)
    .run();
}

export async function getUserPredictions(db: D1Database, userId: number, groupId: number, limit = 10) {
  const { results } = await db
    .prepare(
      `SELECT p.predicted_home, p.predicted_away, p.points_awarded,
              m.home_team, m.away_team, m.kickoff_time, m.status, m.home_score, m.away_score
       FROM predictions p
       JOIN matches m ON m.id = p.match_id
       WHERE p.user_id = ?1 AND p.group_id = ?2
       ORDER BY m.kickoff_time DESC
       LIMIT ?3`
    )
    .bind(userId, groupId, limit)
    .all();
  return results;
}

export async function getLeaderboard(db: D1Database, groupId: number, limit = 15) {
  const { results } = await db
    .prepare(
      `SELECT u.username, u.first_name, mem.total_points
       FROM memberships mem
       JOIN users u ON u.id = mem.user_id
       WHERE mem.group_id = ?1
       ORDER BY mem.total_points DESC
       LIMIT ?2`
    )
    .bind(groupId, limit)
    .all();
  return results;
}

export async function getTodayFixturesForGroup(db: D1Database) {
  const { results } = await db
    .prepare(
      `SELECT * FROM matches
       WHERE status = 'SCHEDULED'
         AND date(kickoff_time) = date('now')
       ORDER BY kickoff_time ASC`
    )
    .all();
  return results;
}

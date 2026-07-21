export const HELP_TEXT = `⚽️ <b>Prediction League Bot</b>

Predict scorelines, earn points, climb the leaderboard. No money, no stress — just bragging rights.

<b>Commands</b>
/predict TeamA-TeamB 2-1 — submit a prediction (e.g. <code>/predict Arsenal-Chelsea 2-1</code>)
/fixtures — see today's matches you can predict
/mypredictions — your recent predictions and points
/leaderboard — this group's current standings
/help — show this message

<b>Scoring</b>
🎯 Exact score correct — 3 points
✅ Correct winner/draw, wrong score — 1 point
❌ Wrong outcome — 0 points

Add me to a group chat to start a league with friends!`;

export function startMessage(): string {
  return HELP_TEXT;
}

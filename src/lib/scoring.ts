export type Outcome = "HOME" | "AWAY" | "DRAW";

export function outcomeOf(home: number, away: number): Outcome {
  if (home > away) return "HOME";
  if (home < away) return "AWAY";
  return "DRAW";
}

/**
 * Returns points awarded for a single prediction against a final score.
 * exactPoints:   predicted score matches exactly
 * outcomePoints: predicted correct winner/draw but not exact score
 * 0:             wrong outcome
 */
export function calculatePoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
  exactPoints: number,
  outcomePoints: number
): number {
  if (predictedHome === actualHome && predictedAway === actualAway) {
    return exactPoints;
  }
  if (outcomeOf(predictedHome, predictedAway) === outcomeOf(actualHome, actualAway)) {
    return outcomePoints;
  }
  return 0;
}

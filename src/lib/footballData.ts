const API_BASE = "https://api.football-data.org/v4";

export interface FdMatch {
  id: number;
  utcDate: string;
  status: string; // SCHEDULED, TIMED, IN_PLAY, PAUSED, FINISHED, POSTPONED, CANCELLED
  competition: { code: string; name: string };
  homeTeam: { name: string; shortName?: string };
  awayTeam: { name: string; shortName?: string };
  score: {
    fullTime: { home: number | null; away: number | null };
  };
}

interface FdMatchesResponse {
  matches: FdMatch[];
}

// Simple in-worker throttle: football-data.org free tier allows 10 req/min.
// We only ever call this from Cron jobs (not per-user-request), so a small
// delay between calls is enough to stay safely under the limit.
async function throttledFetch(url: string, apiKey: string): Promise<Response> {
  return fetch(url, {
    headers: { "X-Auth-Token": apiKey },
  });
}

export async function fetchUpcomingFixtures(
  apiKey: string,
  competitionCode: string,
  dateFrom: string,
  dateTo: string
): Promise<FdMatch[]> {
  const url = `${API_BASE}/competitions/${competitionCode}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`;
  const res = await throttledFetch(url, apiKey);
  if (!res.ok) {
    console.error(`football-data fixtures error [${competitionCode}]: ${res.status} ${await res.text()}`);
    return [];
  }
  const data = (await res.json()) as FdMatchesResponse;
  return data.matches ?? [];
}

export async function fetchFinishedFixtures(
  apiKey: string,
  competitionCode: string,
  dateFrom: string,
  dateTo: string
): Promise<FdMatch[]> {
  const url = `${API_BASE}/competitions/${competitionCode}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}&status=FINISHED`;
  const res = await throttledFetch(url, apiKey);
  if (!res.ok) {
    console.error(`football-data results error [${competitionCode}]: ${res.status} ${await res.text()}`);
    return [];
  }
  const data = (await res.json()) as FdMatchesResponse;
  return data.matches ?? [];
}

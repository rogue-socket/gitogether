// Balanced leaderboard score: weighted output volume + a showing-up bonus.
// Computed on read so weights can change without a data backfill.
export const CONSISTENCY_BONUS = 10; // points per active day

// Per-type weights. PRs and reviews are higher-effort and harder to game
// than raw commits.
export const WEIGHTS = {
  commits: 1,
  pullRequests: 3,
  reviews: 2,
  issues: 1,
} as const;

export type ScoredDay = {
  contributionCount: number;
  commits: number;
  pullRequests: number;
  reviews: number;
  issues: number;
};

export type Score = {
  commits: number;
  pullRequests: number;
  reviews: number;
  issues: number;
  activeDays: number;
  score: number;
};

// Reduces a window of daily contribution rows into a weighted balanced score.
export function computeScore(days: ReadonlyArray<ScoredDay>): Score {
  let commits = 0;
  let pullRequests = 0;
  let reviews = 0;
  let issues = 0;
  let activeDays = 0;

  for (const day of days) {
    commits += day.commits;
    pullRequests += day.pullRequests;
    reviews += day.reviews;
    issues += day.issues;
    if (day.contributionCount > 0) activeDays += 1;
  }

  const weighted =
    commits * WEIGHTS.commits +
    pullRequests * WEIGHTS.pullRequests +
    reviews * WEIGHTS.reviews +
    issues * WEIGHTS.issues;

  return {
    commits,
    pullRequests,
    reviews,
    issues,
    activeDays,
    score: weighted + activeDays * CONSISTENCY_BONUS,
  };
}

// Longest run of consecutive calendar days with at least one contribution.
export function longestStreak(
  days: ReadonlyArray<{ date: Date; contributionCount: number }>,
): number {
  const DAY_MS = 86_400_000;
  const activeTimes = days
    .filter((d) => d.contributionCount > 0)
    .map((d) => d.date.getTime())
    .sort((a, b) => a - b);

  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const time of activeTimes) {
    run = prev !== null && time - prev === DAY_MS ? run + 1 : 1;
    if (run > best) best = run;
    prev = time;
  }
  return best;
}

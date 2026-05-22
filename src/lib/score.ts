// Balanced leaderboard score: rewards both raw output (volume) and showing
// up regularly (consistency). Computed on read so the formula can change
// without a data backfill. CONSISTENCY_BONUS is the tuning knob.
export const CONSISTENCY_BONUS = 10; // points per active day

export type Score = {
  volume: number; // total contributions in the window
  activeDays: number; // days with at least one contribution
  score: number; // volume + activeDays * CONSISTENCY_BONUS
};

// Reduces a set of daily contribution rows (already filtered to a time
// window by the caller) into a single balanced score.
export function computeScore(
  days: ReadonlyArray<{ contributionCount: number }>,
): Score {
  let volume = 0;
  let activeDays = 0;

  for (const day of days) {
    volume += day.contributionCount;
    if (day.contributionCount > 0) activeDays += 1;
  }

  return {
    volume,
    activeDays,
    score: volume + activeDays * CONSISTENCY_BONUS,
  };
}

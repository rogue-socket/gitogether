import { prisma } from "@/lib/prisma";
import { computeScore, longestStreak, type Score } from "@/lib/score";

export type LeaderboardWindow = "week" | "month" | "all";

export type LeaderboardRow = {
  userId: string;
  name: string | null;
  image: string | null;
  isOwner: boolean;
  rank: number;
  score: Score;
};

export function normalizeWindow(value: string | undefined): LeaderboardWindow {
  return value === "month" || value === "all" ? value : "week";
}

// Lower bound for a rolling window, or null for all-time. Aligned to UTC
// midnight so the window contains a whole number of daily rows.
function windowStart(window: LeaderboardWindow): Date | null {
  if (window === "all") return null;
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (window === "month" ? 29 : 6));
  return start;
}

// Ranks a group's members by balanced score over [from, to). Either bound
// may be null to leave that side open.
export async function rankGroupMembers(
  groupId: string,
  from: Date | null,
  to: Date | null,
): Promise<LeaderboardRow[]> {
  const [group, memberships] = await Promise.all([
    prisma.group.findUnique({
      where: { id: groupId },
      select: { createdById: true },
    }),
    prisma.membership.findMany({
      where: { groupId },
      select: {
        userId: true,
        user: { select: { name: true, image: true } },
      },
    }),
  ]);

  const memberIds = memberships.map((m) => m.userId);

  const dateFilter: { gte?: Date; lt?: Date } = {};
  if (from) dateFilter.gte = from;
  if (to) dateFilter.lt = to;

  const contributions = await prisma.dailyContribution.findMany({
    where: {
      userId: { in: memberIds },
      ...(from || to ? { date: dateFilter } : {}),
    },
    select: { userId: true, contributionCount: true },
  });

  const byUser = new Map<string, { contributionCount: number }[]>();
  for (const id of memberIds) byUser.set(id, []);
  for (const c of contributions) byUser.get(c.userId)?.push(c);

  const rows = memberships.map((m) => ({
    userId: m.userId,
    name: m.user.name,
    image: m.user.image,
    isOwner: m.userId === group?.createdById,
    score: computeScore(byUser.get(m.userId) ?? []),
  }));

  rows.sort((a, b) => b.score.score - a.score.score);
  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
}

// Rolling leaderboard for the group page's window toggles.
export async function getLeaderboard(
  groupId: string,
  window: LeaderboardWindow,
): Promise<LeaderboardRow[]> {
  return rankGroupMembers(groupId, windowStart(window), null);
}

// All-time longest contribution streak for each member of a group.
export async function getLongestStreaks(
  groupId: string,
): Promise<Map<string, number>> {
  const memberships = await prisma.membership.findMany({
    where: { groupId },
    select: { userId: true },
  });
  const memberIds = memberships.map((m) => m.userId);

  const rows = await prisma.dailyContribution.findMany({
    where: { userId: { in: memberIds } },
    select: { userId: true, date: true, contributionCount: true },
  });

  const byUser = new Map<string, { date: Date; contributionCount: number }[]>();
  for (const id of memberIds) byUser.set(id, []);
  for (const row of rows) byUser.get(row.userId)?.push(row);

  const streaks = new Map<string, number>();
  for (const [id, days] of byUser) streaks.set(id, longestStreak(days));
  return streaks;
}

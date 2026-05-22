import { prisma } from "@/lib/prisma";
import { computeScore, type Score } from "@/lib/score";

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

// Lower bound for a window, or null for all-time. Aligned to UTC midnight so
// the window contains a whole number of daily rows.
function windowStart(window: LeaderboardWindow): Date | null {
  if (window === "all") return null;
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (window === "month" ? 29 : 6));
  return start;
}

// Ranks a group's members by their balanced score over the given window.
export async function getLeaderboard(
  groupId: string,
  window: LeaderboardWindow,
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
  const from = windowStart(window);

  const contributions = await prisma.dailyContribution.findMany({
    where: {
      userId: { in: memberIds },
      ...(from ? { date: { gte: from } } : {}),
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

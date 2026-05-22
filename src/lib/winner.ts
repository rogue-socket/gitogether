import { prisma } from "@/lib/prisma";
import { rankGroupMembers } from "@/lib/leaderboard";

// UTC-midnight Monday that starts the week containing `date`.
function mondayOf(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay(); // 0=Sun .. 6=Sat
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - daysSinceMonday);
  return d;
}

// Freezes last week's standings for every group as a WeeklySnapshot, crowning
// the top scorer as winner. Idempotent — re-running overwrites the same week.
export async function snapshotCompletedWeek(): Promise<{ snapshots: number }> {
  const thisMonday = mondayOf(new Date());
  const weekStart = new Date(thisMonday);
  weekStart.setUTCDate(weekStart.getUTCDate() - 7);
  const weekEnd = thisMonday; // exclusive

  const groups = await prisma.group.findMany({ select: { id: true } });

  let snapshots = 0;
  for (const group of groups) {
    const rows = await rankGroupMembers(group.id, weekStart, weekEnd);
    if (rows.length === 0) continue;

    // Only crown a winner if they actually contributed something.
    const top = rows[0];
    const winnerUserId = top.score.score > 0 ? top.userId : null;

    const standings = rows.map((r) => ({
      userId: r.userId,
      name: r.name,
      rank: r.rank,
      score: r.score.score,
      volume: r.score.volume,
      activeDays: r.score.activeDays,
    }));

    await prisma.weeklySnapshot.upsert({
      where: { groupId_weekStart: { groupId: group.id, weekStart } },
      create: {
        groupId: group.id,
        weekStart,
        winnerUserId,
        standings: JSON.stringify(standings),
      },
      update: { winnerUserId, standings: JSON.stringify(standings) },
    });
    snapshots += 1;
  }

  return { snapshots };
}

export type LastWeekWinner = {
  name: string | null;
  image: string | null;
  weekStart: Date;
};

// The winner of the most recently snapshotted week, or null if none yet.
export async function getLastWeekWinner(
  groupId: string,
): Promise<LastWeekWinner | null> {
  const snapshot = await prisma.weeklySnapshot.findFirst({
    where: { groupId, winnerUserId: { not: null } },
    orderBy: { weekStart: "desc" },
  });
  if (!snapshot?.winnerUserId) return null;

  const winner = await prisma.user.findUnique({
    where: { id: snapshot.winnerUserId },
    select: { name: true, image: true },
  });
  if (!winner) return null;

  return { name: winner.name, image: winner.image, weekStart: snapshot.weekStart };
}

// Map of userId -> number of weeks won, for a group.
export async function getWeeksWon(
  groupId: string,
): Promise<Map<string, number>> {
  const grouped = await prisma.weeklySnapshot.groupBy({
    by: ["winnerUserId"],
    where: { groupId, winnerUserId: { not: null } },
    _count: { _all: true },
  });

  const wins = new Map<string, number>();
  for (const row of grouped) {
    if (row.winnerUserId) wins.set(row.winnerUserId, row._count._all);
  }
  return wins;
}

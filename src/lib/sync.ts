import { prisma } from "@/lib/prisma";
import { fetchContributions } from "@/lib/github";

// Each sync re-fetches this many days and upserts them. 90 days covers the
// rolling-7 and month leaderboard windows and corrects any backdated commits.
const SYNC_WINDOW_DAYS = 90;

// Syncs one user's GitHub contributions into DailyContribution rows.
export async function syncUser(userId: string): Promise<{ days: number }> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "github" },
    select: { access_token: true },
  });
  if (!account?.access_token) {
    throw new Error(`No GitHub access token for user ${userId}`);
  }

  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - SYNC_WINDOW_DAYS);

  const { login, days } = await fetchContributions(
    account.access_token,
    from,
    to,
  );

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { githubLogin: login },
    }),
    ...days.map((day) => {
      const date = new Date(`${day.date}T00:00:00.000Z`);
      return prisma.dailyContribution.upsert({
        where: { userId_date: { userId, date } },
        create: { userId, date, contributionCount: day.count },
        update: { contributionCount: day.count, syncedAt: new Date() },
      });
    }),
  ]);

  return { days: days.length };
}

// Syncs every user that has a GitHub account. One user's failure does not
// abort the others.
export async function syncAllUsers(): Promise<{ ok: number; failed: number }> {
  const users = await prisma.user.findMany({
    where: { accounts: { some: { provider: "github" } } },
    select: { id: true },
  });

  let ok = 0;
  let failed = 0;
  for (const user of users) {
    try {
      await syncUser(user.id);
      ok += 1;
    } catch (err) {
      failed += 1;
      console.error(`[sync] failed for user ${user.id}:`, err);
    }
  }
  return { ok, failed };
}

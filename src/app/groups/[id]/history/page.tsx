import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

type Standing = {
  userId: string;
  name: string | null;
  rank: number;
  score: number;
  volume: number;
  activeDays: number;
};

function weekLabel(weekStart: Date): string {
  const end = new Date(weekStart);
  end.setUTCDate(end.getUTCDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  return `${fmt(weekStart)} – ${fmt(end)}`;
}

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await requireUserId();
  const { id } = await params;

  const group = await prisma.group.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!group) redirect("/");

  const membership = await prisma.membership.findUnique({
    where: { userId_groupId: { userId, groupId: id } },
  });
  if (!membership) redirect("/");

  const snapshots = await prisma.weeklySnapshot.findMany({
    where: { groupId: id },
    orderBy: { weekStart: "desc" },
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-1">
        <Link
          href={`/groups/${group.id}`}
          className="text-sm text-zinc-500 transition-colors hover:text-black dark:hover:text-white"
        >
          ← {group.name}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Past weeks</h1>
      </header>

      {snapshots.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No completed weeks yet. The first recap lands after a Sunday.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {snapshots.map((snap) => {
            const standings = JSON.parse(snap.standings) as Standing[];
            const winner = standings.find(
              (s) => s.userId === snap.winnerUserId,
            );
            return (
              <section key={snap.id} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
                    {weekLabel(snap.weekStart)}
                  </h2>
                  {winner && (
                    <span className="text-sm">
                      Winner:{" "}
                      <span className="font-medium">
                        {winner.name ?? "Someone"}
                      </span>
                    </span>
                  )}
                </div>
                <ol className="flex flex-col gap-1">
                  {standings.map((s) => (
                    <li
                      key={s.userId}
                      className="flex items-center gap-3 rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
                    >
                      <span className="w-5 text-center font-semibold text-zinc-400">
                        {s.rank}
                      </span>
                      <span className="flex-1">{s.name ?? "Unknown"}</span>
                      <span className="text-xs text-zinc-500">
                        {s.volume} contributions
                      </span>
                      <span className="font-semibold tabular-nums">
                        {s.score}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

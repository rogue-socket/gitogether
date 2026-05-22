import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import {
  getLeaderboard,
  normalizeWindow,
  type LeaderboardWindow,
} from "@/lib/leaderboard";

const WINDOWS: { key: LeaderboardWindow; label: string }[] = [
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "all", label: "All time" },
];

export default async function GroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ window?: string }>;
}) {
  const userId = await requireUserId();
  const { id } = await params;
  const window = normalizeWindow((await searchParams).window);

  const group = await prisma.group.findUnique({
    where: { id },
    select: { id: true, name: true, inviteCode: true },
  });
  if (!group) redirect("/");

  const membership = await prisma.membership.findUnique({
    where: { userId_groupId: { userId, groupId: id } },
  });
  if (!membership) redirect("/");

  const leaderboard = await getLeaderboard(id, window);

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const inviteUrl = `${proto}://${host}/join/${group.inviteCode}`;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-1">
        <Link
          href="/"
          className="text-sm text-zinc-500 transition-colors hover:text-black dark:hover:text-white"
        >
          ← All groups
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{group.name}</h1>
      </header>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Leaderboard
          </h2>
          <div className="flex gap-1">
            {WINDOWS.map((w) => (
              <Link
                key={w.key}
                href={`/groups/${group.id}?window=${w.key}`}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  w.key === window
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "text-zinc-500 hover:bg-black/[.05] dark:hover:bg-white/[.06]"
                }`}
              >
                {w.label}
              </Link>
            ))}
          </div>
        </div>

        <ol className="flex flex-col gap-2">
          {leaderboard.map((row) => (
            <li
              key={row.userId}
              className="flex items-center gap-3 rounded-lg border border-black/10 px-4 py-3 dark:border-white/15"
            >
              <span className="w-5 text-center text-sm font-semibold text-zinc-400">
                {row.rank}
              </span>
              {row.image && (
                <Image
                  src={row.image}
                  alt=""
                  width={36}
                  height={36}
                  className="rounded-full"
                />
              )}
              <div className="flex flex-1 flex-col">
                <span className="flex items-center gap-2 font-medium">
                  {row.name ?? "Unknown"}
                  {row.isOwner && (
                    <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-normal text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      owner
                    </span>
                  )}
                </span>
                <span className="text-xs text-zinc-500">
                  {row.score.volume} contributions · {row.score.activeDays}{" "}
                  active days
                </span>
              </div>
              <span className="text-lg font-semibold tabular-nums">
                {row.score.score}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Invite link
        </h2>
        <p className="text-sm text-zinc-500">
          Share this link with friends to add them to the group.
        </p>
        <input
          readOnly
          value={inviteUrl}
          className="w-full rounded-lg border border-black/10 bg-black/[.03] px-3 py-2 font-mono text-sm dark:border-white/15 dark:bg-white/[.04]"
        />
      </section>
    </div>
  );
}

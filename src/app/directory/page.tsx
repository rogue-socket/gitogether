import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { joinPublicGroup } from "@/lib/actions";

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const userId = await requireUserId();
  const q = ((await searchParams).q ?? "").trim();

  const groups = await prisma.group.findMany({
    where: {
      visibility: "public",
      ...(q ? { name: { contains: q } } : {}),
    },
    include: {
      _count: { select: { memberships: true } },
      memberships: { where: { userId }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-1">
        <Link
          href="/"
          className="text-sm text-zinc-500 transition-colors hover:text-black dark:hover:text-white"
        >
          ← All groups
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Browse public groups
        </h1>
      </header>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search groups by name"
          className="flex-1 rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/15 dark:focus:border-white/40"
        />
        <button
          type="submit"
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          Search
        </button>
      </form>

      {groups.length === 0 ? (
        <p className="text-sm text-zinc-500">
          {q
            ? `No public groups matching "${q}".`
            : "No public groups yet."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {groups.map((group) => {
            const isMember = group.memberships.length > 0;
            return (
              <li
                key={group.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-black/10 px-4 py-3 dark:border-white/15"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{group.name}</span>
                  <span className="text-sm text-zinc-500">
                    {group._count.memberships}{" "}
                    {group._count.memberships === 1 ? "member" : "members"}
                  </span>
                </div>
                {isMember ? (
                  <Link
                    href={`/groups/${group.id}`}
                    className="shrink-0 rounded-lg border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/[.03] dark:border-white/15 dark:hover:bg-white/[.04]"
                  >
                    View
                  </Link>
                ) : (
                  <form action={joinPublicGroup.bind(null, group.id)}>
                    <button
                      type="submit"
                      className="shrink-0 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                    >
                      Join
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

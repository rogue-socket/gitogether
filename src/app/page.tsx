import Image from "next/image";
import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createGroup, refreshMyData } from "@/lib/actions";
import { timeAgo } from "@/lib/format";

export default async function Home() {
  const session = await auth();
  const user = session?.user;

  if (!user?.id) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-zinc-50 px-6 dark:bg-black">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-black dark:text-zinc-50">
            gitogether
          </h1>
          <p className="max-w-sm text-zinc-600 dark:text-zinc-400">
            Form a group, race your friends on GitHub activity.
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signIn("github", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Sign in with GitHub
          </button>
        </form>
      </div>
    );
  }

  const groups = await prisma.group.findMany({
    where: { memberships: { some: { userId: user.id } } },
    include: { _count: { select: { memberships: true } } },
    orderBy: { createdAt: "desc" },
  });

  const latestSync = await prisma.dailyContribution.findFirst({
    where: { userId: user.id },
    orderBy: { syncedAt: "desc" },
    select: { syncedAt: true },
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 py-12">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">gitogether</h1>
        <div className="flex items-center gap-3">
          {user.image && (
            <Image
              src={user.image}
              alt=""
              width={32}
              height={32}
              className="rounded-full"
            />
          )}
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="text-sm text-zinc-500 transition-colors hover:text-black dark:hover:text-white"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <section className="flex flex-wrap items-center gap-3">
        <form action={refreshMyData}>
          <button
            type="submit"
            className="rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/[.03] dark:border-white/15 dark:hover:bg-white/[.04]"
          >
            Refresh my GitHub data
          </button>
        </form>
        <span className="text-sm text-zinc-500">
          {latestSync
            ? `Last synced ${timeAgo(latestSync.syncedAt)}`
            : "Not synced yet"}
        </span>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Your groups
        </h2>
        {groups.length === 0 ? (
          <p className="text-sm text-zinc-500">
            You&apos;re not in any groups yet. Create one below.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {groups.map((group) => (
              <li key={group.id}>
                <Link
                  href={`/groups/${group.id}`}
                  className="flex items-center justify-between rounded-lg border border-black/10 px-4 py-3 transition-colors hover:bg-black/[.03] dark:border-white/15 dark:hover:bg-white/[.04]"
                >
                  <span className="font-medium">{group.name}</span>
                  <span className="text-sm text-zinc-500">
                    {group._count.memberships}{" "}
                    {group._count.memberships === 1 ? "member" : "members"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Create a group
        </h2>
        <form action={createGroup} className="flex gap-2">
          <input
            name="name"
            required
            maxLength={60}
            placeholder="Group name"
            className="flex-1 rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/15 dark:focus:border-white/40"
          />
          <button
            type="submit"
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Create
          </button>
        </form>
      </section>
    </div>
  );
}

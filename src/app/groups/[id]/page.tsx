import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await requireUserId();
  const { id } = await params;

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      memberships: {
        include: { user: true },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!group || !group.memberships.some((m) => m.userId === userId)) {
    redirect("/");
  }

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

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Members ({group.memberships.length})
        </h2>
        <ul className="flex flex-col gap-2">
          {group.memberships.map((m) => (
            <li key={m.id} className="flex items-center gap-3">
              {m.user.image && (
                <Image
                  src={m.user.image}
                  alt=""
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}
              <span className="text-sm">{m.user.name ?? "Unknown"}</span>
              {m.userId === group.createdById && (
                <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  owner
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { joinGroup } from "@/lib/actions";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <Centered>
        <p className="text-zinc-600 dark:text-zinc-400">
          Sign in to join a gitogether group.
        </p>
        <form
          action={async () => {
            "use server";
            await signIn("github", { redirectTo: `/join/${code}` });
          }}
        >
          <button
            type="submit"
            className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Sign in with GitHub to join
          </button>
        </form>
      </Centered>
    );
  }

  const userId = session.user.id;
  const group = await prisma.group.findUnique({ where: { inviteCode: code } });

  if (!group) {
    return (
      <Centered>
        <p className="text-zinc-600 dark:text-zinc-400">
          This invite link is invalid or has expired.
        </p>
        <Link
          href="/"
          className="text-sm font-medium underline underline-offset-4"
        >
          Go to your groups
        </Link>
      </Centered>
    );
  }

  const existing = await prisma.membership.findUnique({
    where: { userId_groupId: { userId, groupId: group.id } },
  });
  if (existing) redirect(`/groups/${group.id}`);

  const joinThisGroup = joinGroup.bind(null, code);

  return (
    <Centered>
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-sm text-zinc-500">You&apos;ve been invited to join</p>
        <h1 className="text-3xl font-semibold tracking-tight">{group.name}</h1>
      </div>
      <form action={joinThisGroup}>
        <button
          type="submit"
          className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          Join group
        </button>
      </form>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
      {children}
    </div>
  );
}

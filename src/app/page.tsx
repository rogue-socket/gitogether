import Image from "next/image";
import { auth, signIn, signOut } from "@/auth";

export default async function Home() {
  const session = await auth();
  const user = session?.user;

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

      {user ? (
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            {user.image && (
              <Image
                src={user.image}
                alt=""
                width={40}
                height={40}
                className="rounded-full"
              />
            )}
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              Signed in as{" "}
              <span className="font-medium text-black dark:text-zinc-50">
                {user.name ?? "unknown"}
              </span>
            </span>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="rounded-full border border-black/10 px-5 py-2 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-white/[.06]"
            >
              Sign out
            </button>
          </form>
        </div>
      ) : (
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
      )}
    </div>
  );
}

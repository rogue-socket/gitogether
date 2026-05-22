import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Returns the current user's id, or redirects to the sign-in page.
export async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) redirect("/");
  return id;
}

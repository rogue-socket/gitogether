"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { syncUser } from "@/lib/sync";

export async function createGroup(formData: FormData) {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Group name is required");
  const visibility =
    formData.get("visibility") === "public" ? "public" : "private";

  const group = await prisma.group.create({
    data: {
      name,
      visibility,
      createdById: userId,
      memberships: { create: { userId } },
    },
  });

  redirect(`/groups/${group.id}`);
}

export async function joinGroup(code: string) {
  const userId = await requireUserId();
  const group = await prisma.group.findUnique({ where: { inviteCode: code } });
  if (!group) redirect("/");

  await prisma.membership.upsert({
    where: { userId_groupId: { userId, groupId: group.id } },
    create: { userId, groupId: group.id },
    update: {},
  });

  redirect(`/groups/${group.id}`);
}

// Joins a group straight from the public directory (no invite code).
export async function joinPublicGroup(groupId: string) {
  const userId = await requireUserId();
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group || group.visibility !== "public") redirect("/directory");

  await prisma.membership.upsert({
    where: { userId_groupId: { userId, groupId } },
    create: { userId, groupId },
    update: {},
  });

  redirect(`/groups/${groupId}`);
}

export async function refreshMyData() {
  const userId = await requireUserId();
  await syncUser(userId);
  revalidatePath("/", "layout");
}

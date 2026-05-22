"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export async function createGroup(formData: FormData) {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Group name is required");

  const group = await prisma.group.create({
    data: {
      name,
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

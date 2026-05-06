import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  GET /api/vault/:id
  View a single vault item.
  Accessible by the owner or an admin.
*/
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;

  const { id } = await params;

  const item = await prisma.vaultItem.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, fullName: true } },
      property: { select: { id: true, title: true } },
    },
  });

  if (!item) {
    return NextResponse.json(
      { error: "Vault item not found." },
      { status: 404 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });

  const isAdmin = user?.roles.includes("ADMIN");
  const isOwner = item.ownerId === userId;

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  return NextResponse.json({ item });
}

/*
  PATCH /api/vault/:id
  Admin verifies a vault document.
  Requires: active session + ADMIN role

  Body: { isVerified: boolean }
*/
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });

  if (!user?.roles.includes("ADMIN")) {
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 },
    );
  }

  const { id } = await params;

  const item = await prisma.vaultItem.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      isVerified: true,
      ownerId: true,
      category: true,
    },
  });

  if (!item) {
    return NextResponse.json(
      { error: "Vault item not found." },
      { status: 404 },
    );
  }

  const body = await req.json();
  const { isVerified } = body;

  if (typeof isVerified !== "boolean") {
    return NextResponse.json(
      { error: "isVerified must be a boolean." },
      { status: 400 },
    );
  }

  const before = { isVerified: item.isVerified };

  const updated = await prisma.vaultItem.update({
    where: { id },
    data: { isVerified },
    select: { id: true, title: true, isVerified: true },
  });

  await Promise.all([
    audit({
      actorId: userId,
      action: "VERIFY",
      entity: "VaultItem",
      entityId: id,
      before,
      after: { isVerified },
      req,
    }),
    isVerified
      ? notify(
          item.ownerId,
          "Document verified ✅",
          `Your ${item.category.toLowerCase()} document "${item.title}" has been verified by Shack.`,
          "DOC_VERIFIED",
          { vaultItemId: id },
        )
      : Promise.resolve(),
  ]);

  return NextResponse.json({ item: updated });
}

/*
  DELETE /api/vault/:id
  Owner deletes a vault document.
  Requires: active session + document owner
*/
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;

  const { id } = await params;

  const item = await prisma.vaultItem.findUnique({
    where: { id },
    select: { id: true, ownerId: true, title: true, category: true },
  });

  if (!item) {
    return NextResponse.json(
      { error: "Vault item not found." },
      { status: 404 },
    );
  }

  if (item.ownerId !== userId) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  await prisma.vaultItem.delete({ where: { id } });

  await audit({
    actorId: userId,
    action: "DELETE",
    entity: "VaultItem",
    entityId: id,
    before: { title: item.title, category: item.category },
    req,
  });

  return NextResponse.json({ message: "Vault item deleted." });
}

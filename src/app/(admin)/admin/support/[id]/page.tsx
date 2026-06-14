import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import SupportTicketDetailClient from "./SupportTicketDetailClient";

export default async function AdminSupportTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const { id } = await params;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    select: {
      id: true,
      subject: true,
      status: true,
      priority: true,
      relatedEntity: true,
      relatedEntityId: true,
      createdAt: true,
      updatedAt: true,
      user: { select: { id: true, fullName: true, email: true, roles: true } },
      assignee: { select: { id: true, fullName: true, email: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          content: true,
          createdAt: true,
          attachments: true,
          sender: { select: { id: true, fullName: true, roles: true } },
        },
      },
    },
  });

  if (!ticket) notFound();

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link href="/admin/dashboard" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600">Admin</Link>
          <span className="text-xs text-zinc-300">/</span>
          <Link href="/admin/support" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600">Support</Link>
          <span className="text-xs text-zinc-300">/</span>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 truncate max-w-[160px]">{ticket.subject}</p>
        </div>
      </div>
      <SupportTicketDetailClient ticket={ticket as any} currentAdminId={session.user.id} />
    </div>
  );
}

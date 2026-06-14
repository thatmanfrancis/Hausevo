import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import ResolveDisputeModal from "../../components/ResolveDisputeModal";

export default async function AdminDisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const { id } = await params;

  const dispute = await prisma.dispute.findUnique({
    where: { id },
    select: {
      id: true,
      type: true,
      status: true,
      description: true,
      evidence: true,
      resolution: true,
      createdAt: true,
      updatedAt: true,
      raisedBy: { select: { id: true, fullName: true, email: true, phoneNumber: true, roles: true, isVerified: true } },
      against: { select: { id: true, fullName: true, email: true, phoneNumber: true, roles: true, isVerified: true } },
      property: { select: { id: true, title: true, lga: true, address: true } },
      resolvedBy: { select: { fullName: true, email: true } },
    },
  });

  if (!dispute) notFound();

  const statusColors: Record<string, string> = {
    OPEN: "bg-red-100 text-red-700",
    UNDER_REVIEW: "bg-amber-100 text-amber-700",
    RESOLVED: "bg-emerald-100 text-emerald-700",
    ESCALATED: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link href="/admin/dashboard" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600">Admin</Link>
          <span className="text-xs text-zinc-300">/</span>
          <Link href="/admin/disputes" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600">Disputes</Link>
          <span className="text-xs text-zinc-300">/</span>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Detail</p>
        </div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold text-zinc-900">Dispute</h1>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${statusColors[dispute.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                {dispute.status}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-500">
                {dispute.type.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Opened {new Date(dispute.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          {dispute.status === "OPEN" && <ResolveDisputeModal disputeId={dispute.id} />}
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Complaint</p>
        <p className="text-sm text-zinc-700 leading-relaxed">{dispute.description}</p>
      </div>

      {/* Parties */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: "Raised By", user: dispute.raisedBy },
          { label: "Against", user: dispute.against },
        ].map(({ label, user }) => (
          <div key={label} className="bg-white rounded-2xl border border-zinc-200 p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">{label}</p>
            <div className="flex flex-col gap-2">
              <Link href={`/admin/users/${user.id}`} className="text-sm font-bold text-zinc-900 hover:underline">{user.fullName}</Link>
              <p className="text-xs text-zinc-500">{user.email}</p>
              {user.phoneNumber && <p className="text-xs text-zinc-400">{user.phoneNumber}</p>}
              <div className="flex gap-1 flex-wrap mt-1">
                {user.roles.map((r) => (
                  <span key={r} className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500">{r}</span>
                ))}
                {user.isVerified && (
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Verified</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Property */}
      {dispute.property && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Related Property</p>
          <Link href={`/admin/properties/${dispute.property.id}`} className="text-sm font-bold text-zinc-900 hover:underline">{dispute.property.title}</Link>
          <p className="text-xs text-zinc-400 mt-1">{dispute.property.address}, {dispute.property.lga}</p>
        </div>
      )}

      {/* Evidence */}
      {dispute.evidence.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Evidence ({dispute.evidence.length} file{dispute.evidence.length !== 1 ? "s" : ""})</p>
          <div className="flex flex-wrap gap-2">
            {dispute.evidence.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 transition-colors">
                File {i + 1} →
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Resolution */}
      {dispute.resolution && (
        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-2">Resolution</p>
          <p className="text-sm text-emerald-900 leading-relaxed">{dispute.resolution}</p>
          {dispute.resolvedBy && (
            <p className="text-xs text-emerald-600 mt-3">
              Resolved by {dispute.resolvedBy.fullName} on {new Date(dispute.updatedAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

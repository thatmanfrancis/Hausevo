import prisma from "@/lib/prisma";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Pagination from "../components/Pagination";
import ActionModal from "../components/ActionModal";
import { verifyVaultItem, rejectVaultItem } from "../actions";

export default async function AdminVerificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filter?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const params = await searchParams;
  const page = Number(params?.page) || 1;
  const filter = params?.filter || "PENDING";
  const limit = 20;
  const skip = (page - 1) * limit;

  const isVerifiedFilter = filter === "VERIFIED" ? true : false;
  const whereClause = filter === "ALL" ? {} : { isVerified: isVerifiedFilter };

  const [totalItems, items] = await Promise.all([
    prisma.vaultItem.count({ where: whereClause }),
    prisma.vaultItem.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        category: true,
        fileUrl: true,
        isVerified: true,
        createdAt: true,
        owner: { select: { id: true, fullName: true, email: true, roles: true } },
        property: { select: { title: true, lga: true } },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link href="/admin/dashboard" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600">Admin</Link>
          <span className="text-xs text-zinc-300">/</span>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Verifications</p>
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-900">Document Verifications</h1>
        <p className="text-sm text-zinc-500 mt-1">{totalItems.toLocaleString()} documents found.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["ALL", "PENDING", "VERIFIED"].map((s) => (
          <Link 
            key={s} 
            href={`/admin/verifications?filter=${s}`}
            className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-colors ${
              filter === s 
                ? "bg-zinc-900 text-white border-zinc-900" 
                : "border-zinc-200 text-zinc-500 hover:border-zinc-900 hover:text-zinc-900"
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Document</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Owner</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Property</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Status</th>
                <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-3">
                    <a href={item.fileUrl} target="_blank" rel="noreferrer" className="text-sm font-bold text-blue-600 hover:underline">
                      {item.title}
                    </a>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-0.5">{item.category}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {new Date(item.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm font-semibold text-zinc-700">{item.owner.fullName}</p>
                    <p className="text-xs text-zinc-400">{item.owner.roles[0]}</p>
                  </td>
                  <td className="px-5 py-3">
                    {item.property ? (
                      <>
                        <p className="text-sm font-semibold text-zinc-700 truncate max-w-[150px]">{item.property.title}</p>
                        <p className="text-xs text-zinc-400">{item.property.lga}</p>
                      </>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      item.isVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {item.isVerified ? "Verified" : "Pending"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!item.isVerified && (
                        <>
                          <ActionModal
                            title="Verify Document"
                            description={`Are you sure you want to approve this ${item.category}?`}
                            triggerLabel="Approve"
                            triggerClass="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors"
                            action={verifyVaultItem.bind(null, item.id, item.owner.id)}
                          />
                          <ActionModal
                            title="Reject Document"
                            description={`Are you sure you want to reject and delete this document? The user will have to re-upload.`}
                            triggerLabel="Reject"
                            triggerClass="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                            action={rejectVaultItem.bind(null, item.id)}
                            destructive
                          />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-zinc-400 font-bold">
                    No documents found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination totalPages={totalPages} />
    </div>
  );
}

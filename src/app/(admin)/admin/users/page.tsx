import prisma from "@/lib/prisma";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Pagination from "../components/Pagination";
import ActionModal from "../components/ActionModal";
import { verifyUser, flagUser } from "../actions";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const params = await searchParams;
  const page = Number(params?.page) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  const [totalUsers, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        roles: true,
        isVerified: true,
        verificationTier: true,
        onboardingCompleted: true,
        createdAt: true,
        _count: {
          select: { ownedProperties: true, applications: true, notifications: true },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalUsers / limit);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link href="/admin/dashboard" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600">Admin</Link>
          <span className="text-xs text-zinc-300">/</span>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Users</p>
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-900">User Management</h1>
        <p className="text-sm text-zinc-500 mt-1">{totalUsers.toLocaleString()} total users on the platform.</p>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">User</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Role</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Status</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Properties</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Joined</th>
                <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-sm font-bold text-zinc-900">{u.fullName}</p>
                    <p className="text-xs text-zinc-400">{u.email}</p>
                    <p className="text-xs text-zinc-300">{u.phoneNumber}</p>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r: string) => (
                        <span key={r} className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          r === "ADMIN" ? "bg-zinc-900 text-white" :
                          r === "LANDLORD" ? "bg-blue-100 text-blue-700" :
                          r === "ARTISAN" ? "bg-purple-100 text-purple-700" :
                          "bg-zinc-100 text-zinc-500"
                        }`}>
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full w-fit ${
                        u.isVerified ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-400"
                      }`}>
                        {u.isVerified ? "Verified" : "Unverified"}
                      </span>
                      {!u.onboardingCompleted && (
                        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full w-fit bg-amber-100 text-amber-600">
                          Onboarding
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-zinc-600 font-semibold">
                    {u._count.ownedProperties}
                  </td>
                  <td className="px-5 py-3 text-xs text-zinc-400">
                    {new Date(u.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!u.isVerified ? (
                        <ActionModal
                          title="Verify User"
                          description={`Are you sure you want to manually verify ${u.fullName}? They will receive a Trusted Badge.`}
                          triggerLabel="Verify"
                          action={verifyUser.bind(null, u.id)}
                        />
                      ) : (
                        <ActionModal
                          title="Revoke Verification"
                          description={`Are you sure you want to revoke ${u.fullName}'s verified status?`}
                          triggerLabel="Revoke"
                          triggerClass="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-red-200 text-red-500 hover:border-red-600 hover:text-red-600 transition-colors"
                          action={flagUser.bind(null, u.id)}
                          destructive
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-zinc-400 font-bold">
                    No users found.
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

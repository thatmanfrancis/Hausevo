import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export default async function ArtisanWalletPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const [transactions, profile] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.artisanProfile.findUnique({
      where: { userId: session.user.id },
    }),
  ]);

  const totalEarnings = transactions
    .filter(t => t.type === "REPAIR" && t.status === "SUCCESS")
    .reduce((acc, t) => acc + t.amount, 0);

  function formatNaira(n: number) {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(n);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">Earnings & Wallet</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 rounded-2xl p-6 text-white">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Total Earned</p>
          <p className="text-3xl font-extrabold">{formatNaira(totalEarnings)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Pending Payouts</p>
          <p className="text-3xl font-extrabold text-zinc-900">{formatNaira(0)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Bond Accumulated</p>
          <p className="text-3xl font-extrabold text-emerald-600">{formatNaira(profile?.bondAccumulated ?? 0)}</p>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Transaction History</h2>
        </div>
        
        {transactions.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <p className="text-sm font-bold text-zinc-900">No transactions yet</p>
            <p className="text-xs text-zinc-400 mt-1">Your payment history will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {transactions.map((t) => (
              <div key={t.id} className="px-6 py-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-zinc-900">{t.description || t.type}</p>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-tight">{new Date(t.createdAt).toLocaleDateString()} · {t.reference}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${t.status === 'SUCCESS' ? 'text-zinc-900' : 'text-zinc-400'}`}>
                    {formatNaira(t.amount)}
                  </p>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${
                    t.status === 'SUCCESS' ? 'text-emerald-600' : 
                    t.status === 'FAILED' ? 'text-red-600' : 
                    'text-amber-600'
                  }`}>
                    {t.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

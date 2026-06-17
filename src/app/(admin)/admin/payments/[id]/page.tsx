import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import BackButton from "@/app/components/BackButton";
import ActionModal from "../../components/ActionModal";
import { updateTransactionStatus } from "../../actions";

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function AdminPaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  // Verify Admin role
  const adminCheck = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roles: true },
  });

  if (!adminCheck?.roles.includes("ADMIN")) redirect("/dashboard");

  const { id } = await params;

  // Retrieve transaction with comprehensive player, tenancy, property, and landlord info
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      user: {
        include: {
          tenancy: {
            include: {
              property: {
                include: {
                  landlord: true,
                },
              },
            },
          },
        },
      },
      property: {
        include: {
          landlord: true,
        },
      },
      tenancy: {
        include: {
          property: {
            include: {
              landlord: true,
            },
          },
        },
      },
    },
  });

  if (!transaction) notFound();

  // Determine which tenancy or property relation to display.
  // 1. Check if the transaction directly points to a tenancy.
  // 2. Check if the user has a current active tenancy profile.
  const activeTenancy = transaction.tenancy || transaction.user.tenancy;
  const directProperty = transaction.property;

  // Avoid showing direct property details if they match the active tenancy property
  const shouldShowDirectProperty =
    directProperty && (!activeTenancy || activeTenancy.propertyId !== directProperty.id);

  const statusBadgeColor: Record<string, string> = {
    PENDING: "bg-zinc-100 text-zinc-600 border border-zinc-200",
    SUCCESS: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    FAILED: "bg-red-50 text-red-700 border border-red-100",
    ESCROW: "bg-amber-50 text-amber-700 border border-amber-100",
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb & Navigation */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Link href="/admin/dashboard" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600">Admin</Link>
          <span className="text-xs text-zinc-300">/</span>
          <Link href="/admin/payments" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600">Payments</Link>
          <span className="text-xs text-zinc-300">/</span>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 truncate max-w-[140px]">{transaction.reference}</p>
        </div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <BackButton />
            <h1 className="text-2xl font-extrabold text-zinc-900 mt-2">Payment Details</h1>
            <p className="text-xs text-zinc-400 mt-1">Audit log, statuses, and ledger relations.</p>
          </div>
          {transaction.status === "PENDING" && (
            <div className="flex items-center gap-2 flex-wrap">
              <ActionModal
                title="Approve Transaction"
                description={`Mark reference ${transaction.reference} as successful? This will update wallets and dependencies.`}
                triggerLabel="Approve"
                triggerClass="rounded-full bg-emerald-600 text-white px-4 py-2 text-xs font-bold hover:bg-emerald-700 transition-colors"
                action={updateTransactionStatus.bind(null, transaction.id, "SUCCESS")}
              />
              <ActionModal
                title="Fail Transaction"
                description={`Mark reference ${transaction.reference} as failed?`}
                triggerLabel="Fail Transaction"
                triggerClass="rounded-full border border-red-200 text-red-500 px-4 py-2 text-xs font-bold hover:bg-red-50 transition-colors"
                action={updateTransactionStatus.bind(null, transaction.id, "FAILED")}
                destructive
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Transaction Overview */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 md:col-span-2 flex flex-col gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Transaction Ledger Info</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Reference</p>
                <p className="text-sm font-mono font-semibold text-zinc-700">{transaction.reference}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Amount</p>
                <p className="text-base font-extrabold text-zinc-900">{formatNaira(transaction.amount)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Transaction Type</p>
                <p className="text-sm font-semibold text-zinc-700">{transaction.type}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Status</p>
                <span className={`inline-block text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full mt-1 ${statusBadgeColor[transaction.status] || "bg-zinc-100 text-zinc-500 border border-zinc-200"}`}>
                  {transaction.status}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Hausevo Fee</p>
                <p className="text-sm font-semibold text-zinc-700">{formatNaira(transaction.shackFee)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Net Payout Amount</p>
                <p className="text-sm font-semibold text-zinc-700">{formatNaira(transaction.netAmount)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Date Created</p>
                <p className="text-sm font-semibold text-zinc-700">
                  {new Date(transaction.createdAt).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Description</p>
                <p className="text-sm font-semibold text-zinc-700">{transaction.description || "—"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Payer (User) Info */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 flex flex-col justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Payer Profile</p>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Full Name</p>
                <p className="text-sm font-bold text-zinc-900">{transaction.user.fullName}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Email Address</p>
                <p className="text-sm font-semibold text-zinc-700 truncate">{transaction.user.email}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Phone Number</p>
                <p className="text-sm font-semibold text-zinc-700">{transaction.user.phoneNumber || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Verification Tier</p>
                <p className="text-sm font-semibold text-zinc-700">Tier {transaction.user.verificationTier}</p>
              </div>
            </div>

            {/* Payer Employment Info */}
            {(transaction.user.employmentStatus || transaction.user.profession || transaction.user.employerName || transaction.user.monthlyIncome) && (
              <div className="border-t border-zinc-100 mt-5 pt-5 flex flex-col gap-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Employment</p>
                {transaction.user.employmentStatus && (
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Status</p>
                    <p className="text-xs font-semibold text-zinc-700">{transaction.user.employmentStatus}</p>
                  </div>
                )}
                {transaction.user.profession && (
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Profession</p>
                    <p className="text-xs font-semibold text-zinc-700">{transaction.user.profession}</p>
                  </div>
                )}
                {transaction.user.employerName && (
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Employer</p>
                    <p className="text-xs font-semibold text-zinc-700">{transaction.user.employerName}</p>
                  </div>
                )}
                {transaction.user.monthlyIncome && (
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Monthly Income</p>
                    <p className="text-xs font-semibold text-zinc-700">{transaction.user.monthlyIncome}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <Link
              href={`/admin/users/${transaction.userId}`}
              className="w-full text-center inline-block rounded-full border border-zinc-200 text-zinc-700 px-4 py-2 text-xs font-bold hover:border-zinc-400 transition-colors"
            >
              View Full User Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Tenancy & Property Relations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tenancy / Payer's Current House Details */}
        {activeTenancy ? (
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 flex flex-col gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Tenancy & Current House Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">House Title</p>
                  <p className="text-sm font-bold text-zinc-900">{activeTenancy.property.title}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">LGA / State</p>
                  <p className="text-sm font-semibold text-zinc-700">{activeTenancy.property.lga}, {activeTenancy.property.state}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Tenancy Status</p>
                  <span className="inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {activeTenancy.status}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Duration</p>
                  <p className="text-xs font-semibold text-zinc-700">
                    {new Date(activeTenancy.startDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "2-digit" })}
                    {" → "}
                    {new Date(activeTenancy.endDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "2-digit" })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Rent Savings Goal</p>
                  <p className="text-sm font-semibold text-zinc-700">{formatNaira(activeTenancy.savingsGoal)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Caution Deposit</p>
                  <p className="text-sm font-semibold text-zinc-700">{formatNaira(activeTenancy.cautionDeposit)}</p>
                </div>
              </div>
            </div>

            {/* Landlord Contact */}
            <div className="border-t border-zinc-100 pt-5">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Landlord Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Landlord Name</p>
                  <p className="text-sm font-bold text-zinc-900">{activeTenancy.property.landlord.fullName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Email Address</p>
                  <p className="text-sm font-semibold text-zinc-700 truncate">{activeTenancy.property.landlord.email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Phone Number</p>
                  <p className="text-sm font-semibold text-zinc-700">{activeTenancy.property.landlord.phoneNumber || "—"}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 flex flex-col items-center justify-center text-center py-12">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-300 mb-2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <p className="text-sm font-bold text-zinc-500">No Active Tenancy</p>
            <p className="text-xs text-zinc-400 max-w-xs mt-1">This user is not currently recorded as living in an active Hausevo tenancy.</p>
          </div>
        )}

        {/* Direct Property Details (if different from tenancy property) */}
        {shouldShowDirectProperty ? (
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 flex flex-col gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Direct Property Association</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Property Title</p>
                  <p className="text-sm font-bold text-zinc-900">{directProperty.title}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Address</p>
                  <p className="text-sm font-semibold text-zinc-700">{directProperty.address}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">LGA / State</p>
                  <p className="text-sm font-semibold text-zinc-700">{directProperty.lga}, {directProperty.state}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Price Per Year</p>
                  <p className="text-sm font-semibold text-zinc-700">{formatNaira(directProperty.pricePerYear)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Listing / Status</p>
                  <p className="text-xs font-semibold text-zinc-700">
                    {directProperty.listingType} · <span className="text-emerald-600 font-bold">{directProperty.status}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-100 pt-5">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Owner / Landlord Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Name</p>
                  <p className="text-sm font-bold text-zinc-900">{directProperty.landlord.fullName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Email Address</p>
                  <p className="text-sm font-semibold text-zinc-700 truncate">{directProperty.landlord.email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Phone Number</p>
                  <p className="text-sm font-semibold text-zinc-700">{directProperty.landlord.phoneNumber || "—"}</p>
                </div>
              </div>
            </div>
          </div>
        ) : directProperty ? null : (
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 flex flex-col items-center justify-center text-center py-12">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-300 mb-2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <p className="text-sm font-bold text-zinc-500">No Direct Property Attached</p>
            <p className="text-xs text-zinc-400 max-w-xs mt-1">This transaction is a general wallet top-up or platform payment not directly tied to a specific listing.</p>
          </div>
        )}
      </div>
    </div>
  );
}

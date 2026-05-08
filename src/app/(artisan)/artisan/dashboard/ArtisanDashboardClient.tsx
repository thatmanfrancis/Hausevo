"use client";

import Link from "next/link";

type Props = {
  artisanName: string;
  profile: {
    category: string;
    rating: number;
    isVetted: boolean;
    yearsOfExperience?: number;
    startingPrice?: number;
    bondAccumulated: number;
    bondTarget: number;
  } | null;
  activeJobs: any[];
  completedCount: number;
  totalEarnings: number;
  notifications: any[];
};

function formatNaira(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

function timeAgo(d: Date) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ArtisanDashboardClient({
  artisanName,
  profile,
  activeJobs,
  completedCount,
  totalEarnings,
  notifications,
}: Props) {
  const firstName = artisanName.split(" ")[0];
  const bondProgress = profile ? (profile.bondAccumulated / profile.bondTarget) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <div className="bg-zinc-900 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className={`flex h-5 w-5 items-center justify-center rounded-full ${profile?.isVetted ? 'bg-emerald-500' : 'bg-amber-500'} text-white border border-white/20`}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </span>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              {profile?.isVetted ? 'Vetted Professional' : 'Verification Pending'}
            </p>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight leading-tight">Welcome, {firstName}</h1>
          <p className="text-sm text-zinc-400 mt-2 max-w-md">
            You have {activeJobs.length} active jobs requiring your attention. Keep up the good work!
          </p>
        </div>
        
        {/* Progress indicator for bond */}
        <div className="mt-8 bg-white/5 rounded-xl p-5 border border-white/10 max-w-sm">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Safety Bond Progress</p>
              <p className="text-xl font-extrabold text-white">{formatNaira(profile?.bondAccumulated ?? 0)}</p>
            </div>
            <p className="text-[10px] font-bold text-zinc-400">Target: {formatNaira(profile?.bondTarget ?? 30000)}</p>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500" 
              style={{ width: `${Math.min(bondProgress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Total Earnings</p>
          <p className="text-2xl font-extrabold text-zinc-900">{formatNaira(totalEarnings)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Jobs Completed</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-extrabold text-zinc-900">{completedCount}</p>
            <p className="text-xs text-zinc-400 font-medium">total</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Experience</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-extrabold text-zinc-900">{profile?.yearsOfExperience ?? 0}</p>
            <p className="text-xs text-zinc-400 font-medium">years</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Base Price</p>
          <p className="text-2xl font-extrabold text-zinc-900">{formatNaira(profile?.startingPrice ?? 0)}</p>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Jobs */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Active Jobs</h2>
            <Link href="/artisan/jobs" className="text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors">
              View All →
            </Link>
          </div>
          
          {activeJobs.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 rounded-full bg-zinc-50 flex items-center justify-center mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-300">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
              </div>
              <p className="text-sm font-bold text-zinc-900">No active jobs</p>
              <p className="text-xs text-zinc-400 mt-1">Check back later for new assignments.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {activeJobs.map((job) => (
                <Link 
                  key={job.id} 
                  href={`/artisan/jobs/${job.id}`}
                  className="p-4 rounded-xl border border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50 transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-bold text-zinc-900 group-hover:text-black">{job.title}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mb-1">{job.property.title}</p>
                  <p className="text-[10px] text-zinc-400">{job.property.lga}, {job.property.address}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Recent Notifications</h2>
            <Link href="/notifications" className="text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors">
              View All →
            </Link>
          </div>

          {notifications.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <p className="text-sm font-bold text-zinc-900">All caught up!</p>
              <p className="text-xs text-zinc-400 mt-1">No new notifications.</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-zinc-50">
              {notifications.map((n) => (
                <div key={n.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-bold text-zinc-900">{n.title}</p>
                    <span className="text-[10px] text-zinc-400 shrink-0">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-1">{n.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

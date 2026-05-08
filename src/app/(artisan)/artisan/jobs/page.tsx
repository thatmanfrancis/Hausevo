import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export default async function ArtisanJobsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const jobs = await prisma.maintenanceJob.findMany({
    where: { artisanId: session.user.id },
    include: {
      property: {
        select: { title: true, lga: true, address: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">Maintenance Jobs</h1>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        {jobs.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 rounded-full bg-zinc-50 flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-300">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
            <p className="text-sm font-bold text-zinc-900">No jobs found</p>
            <p className="text-xs text-zinc-400 mt-1">When maintenance requests are assigned to you, they'll appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {jobs.map((job) => (
              <div key={job.id} className="p-6 hover:bg-zinc-50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-lg font-bold text-zinc-900">{job.title}</h2>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        job.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 
                        job.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700' : 
                        'bg-amber-50 text-amber-700'
                      }`}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500 mb-2">{job.description}</p>
                    <div className="flex items-center gap-4 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        </svg>
                        {job.property.title}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                        {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-3">
                    <button className="text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors border border-zinc-200 rounded-full px-4 py-2">
                      View Details
                    </button>
                    {job.status !== 'COMPLETED' && (
                      <button className="text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 transition-colors rounded-full px-4 py-2">
                        Update Status
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

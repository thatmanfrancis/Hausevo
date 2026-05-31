"use client";

import { useState } from "react";
import Image from "next/image";

type Props = {
  tenancyId: string;
  tenantName: string;
  propertyName: string;
};

export default function ConditionReportFlow({ tenancyId, tenantName, propertyName }: Props) {
  const [step, setStep] = useState(1);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock upload for demonstration
  const handlePhotoUpload = () => {
    // In a real app, this would use a file input and upload to S3/Cloudinary
    setPhotos([...photos, "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800"]);
  };

  const submitReport = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1500));
    setStep(3);
    setIsSubmitting(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden max-w-2xl mx-auto">
      <div className="hausevo-gradient-luxury p-8 text-white">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-2">Security Step</p>
        <h2 className="text-3xl font-extrabold tracking-tight">Condition Report</h2>
        <p className="text-sm text-zinc-400 mt-2">Document the property status before {tenantName} moves into {propertyName}.</p>
      </div>

      <div className="p-8">
        {step === 1 && (
          <div className="flex flex-col items-center text-center py-6">
            <div className="h-16 w-16 rounded-full bg-zinc-50 flex items-center justify-center mb-6 border border-zinc-100">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-900">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-2">Protect your Caution Deposit</h3>
            <p className="text-sm text-zinc-500 max-w-sm mb-8 leading-relaxed">
              Upload at least 5 clear photos of the property. This protects both you and the tenant in case of future disputes.
            </p>
            <button
              onClick={() => setStep(2)}
              className="w-full rounded-full bg-zinc-900 text-white py-4 text-sm font-bold hover:bg-zinc-800 transition-all border border-zinc-900"
            >
              Start Documentation →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-3 gap-3">
              {photos.map((p, i) => (
                <div key={i} className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200">
                  <Image src={p} alt="Uploaded" fill className="object-cover" />
                </div>
              ))}
              <button
                onClick={handlePhotoUpload}
                className="aspect-square rounded-2xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center gap-2 hover:border-zinc-400 hover:bg-zinc-50 transition-all group"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400 group-hover:text-zinc-600">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Add Photo</span>
              </button>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
              <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                <span className="font-bold">Pro Tip:</span> Take photos of the ceiling, floor, and plumbing fixtures. These are the most common areas for disputes.
              </p>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-4 text-sm font-bold text-zinc-400 hover:text-zinc-900 transition-colors"
              >
                Back
              </button>
              <button
                onClick={submitReport}
                disabled={photos.length === 0 || isSubmitting}
                className={`flex-1 rounded-full bg-zinc-900 text-white py-4 text-sm font-bold transition-all border border-zinc-900 ${
                  isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-zinc-800"
                }`}
              >
                {isSubmitting ? "Generating Digital Record..." : "Confirm & Send to Tenant →"}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center text-center py-6">
            <div className="h-16 w-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-6 border-2 border-emerald-400">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-2">Report Secured</h3>
            <p className="text-sm text-zinc-500 max-w-sm mb-8 leading-relaxed">
              We've notified {tenantName}. Once they acknowledge these photos, the tenancy will be fully activated and the deposit secured in escrow.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-full bg-zinc-100 text-zinc-900 py-4 text-sm font-bold hover:bg-zinc-200 transition-all border border-zinc-200"
            >
              Done
            </button>
          </div>
        )}
      </div>

      <div className="px-8 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Encrypted Storage</span>
        </div>
        <p className="text-[10px] text-zinc-400 font-medium italic">Hausevo Security ID: #CR-{tenancyId.slice(0, 8)}</p>
      </div>
    </div>
  );
}

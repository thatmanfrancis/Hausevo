"use client";

import { useState } from "react";
import Link from "next/link";
import {
  vetArtisan,
  suspendArtisan,
  updateArtisanByAdmin,
} from "../../actions";
import Modal from "@/app/components/Modal";

type Props = {
  artisan: any;
  categories: string[];
};

export default function ArtisanDetailClient({ artisan, categories }: Props) {
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  const [editFormData, setEditFormData] = useState({
    category: artisan.category,
    yearsOfExperience: artisan.yearsOfExperience?.toString() || "0",
    startingPrice: artisan.startingPrice?.toString() || "0",
    rating: artisan.rating.toString(),
    bio: artisan.bio || "",
  });

  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  const closeEditModal = () => setIsEditModalOpen(false);

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await updateArtisanByAdmin(artisan.id, editFormData);
    setLoading(false);
    if (res.success) {
      setIsEditModalOpen(false);
      setModal({
        isOpen: true,
        title: "Success",
        message: "Artisan profile updated successfully.",
      });
    } else {
      setModal({
        isOpen: true,
        title: "Error",
        message: res.message as string,
      });
    }
  }

  async function handleVet() {
    setModal({
      isOpen: true,
      title: "Confirm Vetting",
      message:
        "Are you sure you want to vet this artisan as a verified professional?",
      onConfirm: async () => {
        closeModal();
        setLoading(true);
        const res = await vetArtisan(artisan.id);
        if (!res.success) {
          setModal({
            isOpen: true,
            title: "Error",
            message: res.message as string,
          });
        }
        setLoading(false);
      },
    });
  }

  async function handleSuspend() {
    setModal({
      isOpen: true,
      title: "Confirm Suspension",
      message:
        "Are you sure you want to suspend this artisan's professional status?",
      onConfirm: async () => {
        closeModal();
        setLoading(true);
        const res = await suspendArtisan(artisan.id);
        if (!res.success) {
          setModal({
            isOpen: true,
            title: "Error",
            message: res.message as string,
          });
        }
        setLoading(false);
      },
    });
  }

  function formatNaira(n: number) {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(n);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/artisans"
            className="h-8 w-8 flex items-center justify-center rounded-full bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-900 transition-colors"
          >
            ←
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            {artisan.user.fullName}
          </h1>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              artisan.isVetted
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {artisan.isVetted ? "VETTED" : "PENDING VERIFICATION"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="rounded-full bg-white border border-zinc-200 text-zinc-600 px-6 py-2.5 text-xs font-bold hover:bg-zinc-50 transition-all"
          >
            Edit Details
          </button>
          {artisan.isVetted ? (
            <button
              onClick={handleSuspend}
              disabled={loading}
              className="rounded-full bg-red-50 text-red-600 px-6 py-2.5 text-xs font-bold hover:bg-red-100 transition-all disabled:opacity-50"
            >
              Suspend Artisan
            </button>
          ) : (
            <button
              onClick={handleVet}
              disabled={loading}
              className="rounded-full bg-zinc-900 text-white px-6 py-2.5 text-xs font-bold hover:bg-zinc-800 transition-all disabled:opacity-50"
            >
              Approve & Vet Artisan
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">
              Professional Profile
            </h2>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
                  Category
                </p>
                <p className="text-sm font-bold text-zinc-900">
                  {artisan.category.replace("_", " ")}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
                  Safety Bond
                </p>
                <p className="text-sm font-bold text-zinc-900">
                  {formatNaira(artisan.bondAccumulated)} /{" "}
                  {formatNaira(artisan.bondTarget)}
                </p>
                <div className="mt-1 h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{
                      width: `${(artisan.bondAccumulated / artisan.bondTarget) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
                  Rating
                </p>
                <div className="flex items-center gap-1">
                  <p className="text-sm font-bold text-zinc-900">
                    {artisan.rating.toFixed(1)}
                  </p>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="text-amber-400"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">
              Contact Info
            </h2>
            <div className="flex flex-col gap-3">
              <p className="text-sm font-bold text-zinc-900">
                {artisan.user.email}
              </p>
              <p className="text-sm font-bold text-zinc-900">
                {artisan.user.phoneNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Stats & Jobs */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-zinc-200 p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                Total Jobs
              </p>
              <p className="text-2xl font-extrabold text-zinc-900">
                {artisan.user.maintenanceJobs.length}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-zinc-200 p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                Completed
              </p>
              <p className="text-2xl font-extrabold text-emerald-600">
                {artisan.jobsCompleted}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Maintenance History
              </h2>
            </div>
            <div className="divide-y divide-zinc-50">
              {artisan.user.maintenanceJobs.map((job: any) => (
                <div
                  key={job.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-zinc-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-bold text-zinc-900">
                      {job.title}
                    </p>
                    <p className="text-[10px] text-zinc-400 font-medium">
                      {job.property.title} ·{" "}
                      {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                      job.status === "COMPLETED"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
              ))}
              {artisan.user.maintenanceJobs.length === 0 && (
                <div className="py-12 text-center text-xs font-bold text-zinc-400">
                  No jobs recorded yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        footer={
          modal.onConfirm ? (
            <>
              <button
                onClick={closeModal}
                className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={modal.onConfirm}
                className="px-6 py-2 bg-zinc-900 text-white text-xs font-bold rounded-full hover:bg-zinc-800 transition-all"
              >
                Confirm
              </button>
            </>
          ) : (
            <button
              onClick={closeModal}
              className="px-6 py-2 bg-zinc-900 text-white text-xs font-bold rounded-full hover:bg-zinc-800 transition-all"
            >
              OK
            </button>
          )
        }
      >
        <p className="text-sm text-zinc-600 leading-relaxed">{modal.message}</p>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title="Edit Artisan Details"
      >
        <form onSubmit={handleEditSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Category
            </label>
            <select
              required
              className="w-full px-4 py-2 rounded-xl border border-zinc-200 text-sm focus:ring-2 focus:ring-zinc-900/5 transition-all outline-none bg-white"
              value={editFormData.category}
              onChange={(e) =>
                setEditFormData({ ...editFormData, category: e.target.value })
              }
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Experience (Years)
              </label>
              <input
                type="number"
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 text-sm focus:ring-2 focus:ring-zinc-900/5 transition-all outline-none"
                value={editFormData.yearsOfExperience}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    yearsOfExperience: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Rating
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 text-sm focus:ring-2 focus:ring-zinc-900/5 transition-all outline-none"
                value={editFormData.rating}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, rating: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Starting Price (₦)
            </label>
            <input
              type="number"
              className="w-full px-4 py-2 rounded-xl border border-zinc-200 text-sm focus:ring-2 focus:ring-zinc-900/5 transition-all outline-none"
              value={editFormData.startingPrice}
              onChange={(e) =>
                setEditFormData({
                  ...editFormData,
                  startingPrice: e.target.value,
                })
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Professional Bio
            </label>
            <textarea
              rows={4}
              className="w-full px-4 py-2 rounded-xl border border-zinc-200 text-sm focus:ring-2 focus:ring-zinc-900/5 transition-all outline-none resize-none"
              value={editFormData.bio}
              onChange={(e) =>
                setEditFormData({ ...editFormData, bio: e.target.value })
              }
            />
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={closeEditModal}
              className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-zinc-900 text-white text-xs font-bold rounded-full hover:bg-zinc-800 transition-all disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

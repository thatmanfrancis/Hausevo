"use client";

import { useState } from "react";
import { updateArtisanProfile } from "../actions";
import Modal from "@/app/components/Modal";

type Props = {
  profile: any;
  categories: string[];
  userId: string;
};

export default function ArtisanProfileClient({
  profile,
  categories,
  userId,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  const closeModal = () => setModal((prev) => ({ ...prev, isOpen: false }));

  const [formData, setFormData] = useState({
    category: profile?.category || "",
    yearsOfExperience: profile?.yearsOfExperience?.toString() || "0",
    startingPrice: profile?.startingPrice?.toString() || "0",
    bio: profile?.bio || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) {
      setModal({
        isOpen: true,
        title: "Validation Error",
        message: "Please select a professional category.",
      });
      return;
    }

    setLoading(true);
    const res = await updateArtisanProfile(formData);
    setLoading(false);

    if (res.success) {
      setModal({
        isOpen: true,
        title: "Success",
        message: "Professional profile updated successfully!",
      });
    } else {
      setModal({
        isOpen: true,
        title: "Error",
        message: res.message as string,
      });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">
          Professional Profile
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Manage your professional information and pricing.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Professional Category
              </label>
              <select
                required
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:ring-2 focus:ring-zinc-900/5 transition-all outline-none bg-white"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Years of Experience
              </label>
              <input
                type="number"
                min="0"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:ring-2 focus:ring-zinc-900/5 transition-all outline-none"
                value={formData.yearsOfExperience}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    yearsOfExperience: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Starting Price (₦)
            </label>
            <input
              type="number"
              min="0"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:ring-2 focus:ring-zinc-900/5 transition-all outline-none"
              value={formData.startingPrice}
              onChange={(e) =>
                setFormData({ ...formData, startingPrice: e.target.value })
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Professional Bio / Experience
            </label>
            <textarea
              rows={6}
              placeholder="Tell clients about your expertise, previous projects, and what makes you the right choice..."
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:ring-2 focus:ring-zinc-900/5 transition-all outline-none resize-none"
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all disabled:opacity-50"
          >
            {loading ? "Saving Changes..." : "Save Professional Profile"}
          </button>
        </form>
      </div>
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        footer={
          <button
            onClick={closeModal}
            className="px-6 py-2 bg-zinc-900 text-white text-xs font-bold rounded-full hover:bg-zinc-800 transition-all"
          >
            OK
          </button>
        }
      >
        <p className="text-sm text-zinc-600 leading-relaxed">{modal.message}</p>
      </Modal>
    </div>
  );
}

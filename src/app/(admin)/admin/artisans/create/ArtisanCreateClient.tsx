"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Modal from "@/app/components/Modal";
import { createArtisanProfile } from "../../actions";

type Props = {
  user: any;
  categories: string[];
};

export default function ArtisanCreateClient({ user, categories }: Props) {
  const router = useRouter();
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
    category: "",
    yearsOfExperience: "0",
    startingPrice: "0",
    bio: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) {
      setModal({
        isOpen: true,
        title: "Validation Error",
        message: "Please select a professional category for the artisan.",
      });
      return;
    }

    setLoading(true);
    const res = await createArtisanProfile(user.id, formData);
    setLoading(false);

    if (res.success) {
      router.push(`/admin/artisans/${res.profileId}`);
    } else {
      setModal({
        isOpen: true,
        title: "Error",
        message: res.message as string,
      });
    }
  };

  return (
    <div className="py-8 flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/artisans"
          className="h-8 w-8 flex items-center justify-center rounded-full bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-900 transition-colors"
        >
          ←
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">
          Create Artisan Profile
        </h1>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="p-6 bg-zinc-50 border-b border-zinc-100 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-zinc-900 flex items-center justify-center text-white font-bold">
            {user.fullName[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-900">{user.fullName}</p>
            <p className="text-xs text-zinc-400 font-medium">{user.email}</p>
          </div>
        </div>

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
            <p className="text-[10px] text-zinc-400 italic">
              This is the baseline fee for this artisan's service.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Professional Bio / Experience
            </label>
            <textarea
              rows={4}
              placeholder="Describe the artisan's skills, specialties, and professional background..."
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
            {loading ? "Creating Profile..." : "Initialize Artisan Profile"}
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

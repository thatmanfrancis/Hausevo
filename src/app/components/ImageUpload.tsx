"use client";

import { useState } from "react";
import Image from "next/image";

interface ImageUploadProps {
  onUpload: (urls: string[]) => void;
  maxFiles?: number;
  initialUrls?: string[];
  label?: string;
}

export default function ImageUpload({ onUpload, maxFiles = 5, initialUrls = [], label = "Property Photos" }: ImageUploadProps) {
  const [images, setImages] = useState<string[]>(initialUrls);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxFiles) {
      setError(`You can only upload up to ${maxFiles} images.`);
      return;
    }

    setUploading(true);
    setError("");

    const newUrls: string[] = [];

    try {
      // 1. Get signature from our API
      const sigRes = await fetch("/api/upload", {
        method: "POST",
        body: JSON.stringify({ folder: "shack/listings" }),
      });

      if (!sigRes.ok) throw new Error("Failed to get upload authorization");
      const { signature, timestamp, apiKey, cloudName, folder } = await sigRes.json();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 2. Prepare Form Data for Cloudinary
        const formData = new FormData();
        formData.append("file", file);
        formData.append("signature", signature);
        formData.append("timestamp", timestamp);
        formData.append("api_key", apiKey);
        formData.append("folder", folder);

        // 3. Upload directly to Cloudinary
        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const cloudError = await uploadRes.json();
          throw new Error(cloudError.error?.message || "Failed to upload to Cloudinary");
        }

        const data = await uploadRes.json();
        newUrls.push(data.secure_url);
      }

      const updatedUrls = [...images, ...newUrls];
      setImages(updatedUrls);
      onUpload(updatedUrls);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong during upload.");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(index: number) {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    onUpload(updated);
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">{label}</label>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50 group">
            <Image src={url} alt={`Upload ${i}`} fill className="object-cover" />
            <button
              onClick={() => removeImage(i)}
              className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-white/90 text-zinc-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-zinc-200"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        
        {images.length < maxFiles && (
          <label className={`relative aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
            uploading ? "border-zinc-200 bg-zinc-50" : "border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50"
          }`}>
            <input 
              type="file" 
              accept="image/*" 
              multiple={maxFiles > 1}
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden" 
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="h-5 w-5 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
                <p className="text-[10px] font-bold text-zinc-400">Uploading...</p>
              </div>
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400 mb-1">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <p className="text-[10px] font-bold text-zinc-400">Add Photo</p>
              </>
            )}
          </label>
        )}
      </div>

      {error && <p className="text-xs font-bold text-red-500">{error}</p>}
      <p className="text-[10px] text-zinc-400 italic">Max {maxFiles} photos. JPEGs and PNGs only.</p>
    </div>
  );
}

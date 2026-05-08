"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Property = {
  id: string;
  title: string;
  address: string;
  lga: string;
  listingType: string;
  pricePerYear: number;
  metadata: any;
  isBoosted: boolean;
  deedVerified: boolean;
  images: { url: string }[];
};

type Favorite = {
  id: string;
  property: Property;
};

type Props = {
  initialFavorites: Favorite[];
  session: any;
};

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function FavoritesClient({ initialFavorites, session }: Props) {
  const [favorites, setFavorites] = useState(initialFavorites);

  async function removeFavorite(propertyId: string) {
    setFavorites((prev) => prev.filter((f) => f.property.id !== propertyId));
    await fetch(`/api/properties/${propertyId}/save`, { method: "POST" });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">
          Saved Listings
        </p>
        <h1 className="text-2xl font-extrabold text-zinc-900">Your Favorites</h1>
      </div>

      {favorites.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 py-20 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-50 mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-300">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <p className="text-sm font-bold text-zinc-900 mb-1">No favorites yet</p>
          <p className="text-xs text-zinc-500 mb-6">
            Property listings you love will appear here for quick access.
          </p>
          <Link
            href="/properties"
            className="rounded-full bg-zinc-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-zinc-800 transition-all"
          >
            Browse Properties
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {favorites.map((fav) => (
            <FavoriteCard
              key={fav.id}
              property={fav.property}
              onRemove={() => removeFavorite(fav.property.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FavoriteCard({ property, onRemove }: { property: Property; onRemove: () => void }) {
  const imageUrl = property.images[0]?.url ?? null;

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-zinc-200 hover:border-zinc-400 transition-all flex flex-col h-full">
      <Link href={`/properties/${property.id}`} className="relative h-44 bg-zinc-100 overflow-hidden shrink-0">
        {imageUrl ? (
          <Image src={imageUrl} alt={property.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-300">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
          </div>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            onRemove();
          }}
          className="absolute top-3 right-3 h-8 w-8 flex items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </Link>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <p className="text-base font-extrabold text-zinc-900">{formatNaira(property.pricePerYear)}/yr</p>
        <h3 className="text-sm font-bold text-zinc-800 leading-snug line-clamp-2">{property.title}</h3>
        <p className="text-xs text-zinc-400 flex items-center gap-1 mt-auto">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
          </svg>
          {property.lga}
        </p>
      </div>
    </div>
  );
}

import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PHOTO_IDS = [
  "1396122",                          // modern house exterior
  "1512917774080-9991f1c4c750",       // luxury villa
  "1580587771525-78b9dba3b914",       // apartment building
  "1558618666-fcd25c85cd64",          // living room
  "1484154218962-a197022b5858",       // kitchen
  "1502672260266-1c1ef2d93688",       // bedroom
  "1560448204-e02f11c3d0e2",          // bathroom
  "1570129477492-45c003edd2be",       // house exterior
  "1600596542815-ffad4c1539a9",       // modern home
  "1600585154340-be6161a56a0c",       // luxury home
  "1600607687939-ce8a6c25118c",       // villa pool
  "1613490493576-4d884d0c9b8e",       // apartment interior
  "1545324418-cc1a3fa10c00",          // interior design
  "1523217582562-09d05ba1b866",       // house with garden
];

function photoUrl(idx: number): string {
  const id = PHOTO_IDS[idx % PHOTO_IDS.length];
  return `https://images.unsplash.com/photo-${id}?w=800&q=80`;
}

// ---------------------------------------------------------------------------
// Landlord & tenant data
// ---------------------------------------------------------------------------

const LANDLORDS = [
  {
    email: "emeka.okafor@landlord.ng",
    fullName: "Emeka Okafor",
    phoneNumber: "+2348031234567",
    password: "Landlord@123",
  },
  {
    email: "funmi.adeyemi@landlord.ng",
    fullName: "Funmilayo Adeyemi",
    phoneNumber: "+2348041234567",
    password: "Landlord@123",
  },
  {
    email: "chidi.nwosu@landlord.ng",
    fullName: "Chidi Nwosu",
    phoneNumber: "+2348051234567",
    password: "Landlord@123",
  },
  {
    email: "bola.akinwale@landlord.ng",
    fullName: "Bolaji Akinwale",
    phoneNumber: "+2348061234567",
    password: "Landlord@123",
  },
];

const DEMO_TENANT = {
  email: "demo.tenant@shack.ng",
  fullName: "Demo Tenant",
  phoneNumber: "+2348099999999",
  password: "Tenant@123",
};

// ---------------------------------------------------------------------------
// Property definitions
// ---------------------------------------------------------------------------

interface PropertySeed {
  title: string;
  address: string;
  lga: string;
  listingType: "RENT" | "SALE" | "SHORTLET" | "LEASE";
  pricePerYear: number;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  size?: number;
  rentFrequency?: "ANNUALLY" | "BIANNUALLY" | "QUARTERLY" | "MONTHLY";
  shortletDailyRate?: number;
  shortletWeeklyRate?: number;
  shortletMonthlyRate?: number;
  landlordIndex: number;
  photoIndex: number;
  extraImages?: number[];
}

const PROPERTIES: PropertySeed[] = [
  // ── Eti-Osa (8) ──────────────────────────────────────────────────────────
  {
    title: "Luxury 4-Bedroom Detached Duplex, Lekki Phase 1",
    address: "14 Admiralty Way, Lekki Phase 1, Lagos",
    lga: "Eti-Osa",
    listingType: "RENT",
    pricePerYear: 7_500_000,
    propertyType: "Detached Duplex",
    bedrooms: 4,
    bathrooms: 5,
    size: 450,
    landlordIndex: 0,
    photoIndex: 0,
    extraImages: [1, 2, 3],
  },
  {
    title: "Elegant 3-Bedroom Flat, Ikoyi",
    address: "7 Bourdillon Road, Ikoyi, Lagos",
    lga: "Eti-Osa",
    listingType: "RENT",
    pricePerYear: 3_500_000,
    propertyType: "3 Bedroom Flat",
    bedrooms: 3,
    bathrooms: 3,
    size: 220,
    landlordIndex: 1,
    photoIndex: 3,
    extraImages: [4, 5, 6],
  },
  {
    title: "Stunning Mansion with Pool, Victoria Island",
    address: "22 Adeola Odeku Street, Victoria Island, Lagos",
    lga: "Eti-Osa",
    listingType: "SALE",
    pricePerYear: 0,
    propertyType: "Mansion",
    bedrooms: 6,
    bathrooms: 7,
    size: 900,
    landlordIndex: 0,
    photoIndex: 2,
    extraImages: [6, 7, 8],
  },
  {
    title: "Modern 2-Bedroom Shortlet, Lekki Phase 2",
    address: "5 Freedom Way, Lekki Phase 2, Lagos",
    lga: "Eti-Osa",
    listingType: "SHORTLET",
    pricePerYear: 0,
    propertyType: "2 Bedroom Flat",
    bedrooms: 2,
    bathrooms: 2,
    size: 130,
    shortletDailyRate: 45_000,
    shortletWeeklyRate: 280_000,
    shortletMonthlyRate: 900_000,
    landlordIndex: 2,
    photoIndex: 8,
    extraImages: [9, 10, 11],
  },
  {
    title: "Penthouse Apartment, Victoria Island",
    address: "1 Ozumba Mbadiwe Avenue, Victoria Island, Lagos",
    lga: "Eti-Osa",
    listingType: "SHORTLET",
    pricePerYear: 0,
    propertyType: "Penthouse",
    bedrooms: 3,
    bathrooms: 4,
    size: 300,
    shortletDailyRate: 120_000,
    shortletWeeklyRate: 750_000,
    shortletMonthlyRate: 2_500_000,
    landlordIndex: 1,
    photoIndex: 10,
    extraImages: [11, 12, 13],
  },
  {
    title: "Semi-Detached Duplex for Sale, Lekki Phase 1",
    address: "9 Chevron Drive, Lekki Phase 1, Lagos",
    lga: "Eti-Osa",
    listingType: "SALE",
    pricePerYear: 0,
    propertyType: "Semi-Detached Duplex",
    bedrooms: 4,
    bathrooms: 4,
    size: 380,
    landlordIndex: 3,
    photoIndex: 12,
    extraImages: [13, 0, 1],
  },
  {
    title: "Spacious 4-Bedroom Terrace Duplex, Ikoyi",
    address: "3 Glover Road, Ikoyi, Lagos",
    lga: "Eti-Osa",
    listingType: "RENT",
    pricePerYear: 6_000_000,
    propertyType: "Terrace Duplex",
    bedrooms: 4,
    bathrooms: 4,
    size: 350,
    landlordIndex: 0,
    photoIndex: 1,
    extraImages: [2, 3, 4],
  },
  {
    title: "Cozy 2-Bedroom Flat, Lekki Phase 1",
    address: "18 Fola Osibo Road, Lekki Phase 1, Lagos",
    lga: "Eti-Osa",
    listingType: "RENT",
    pricePerYear: 1_800_000,
    propertyType: "2 Bedroom Flat",
    bedrooms: 2,
    bathrooms: 2,
    size: 120,
    landlordIndex: 2,
    photoIndex: 4,
    extraImages: [5, 6, 7],
  },

  // ── Ikeja (5) ─────────────────────────────────────────────────────────────
  {
    title: "4-Bedroom Detached Duplex, Ikeja GRA",
    address: "12 Isaac John Street, Ikeja GRA, Lagos",
    lga: "Ikeja",
    listingType: "RENT",
    pricePerYear: 5_000_000,
    propertyType: "Detached Duplex",
    bedrooms: 4,
    bathrooms: 4,
    size: 400,
    landlordIndex: 1,
    photoIndex: 6,
    extraImages: [7, 8, 9],
  },
  {
    title: "3-Bedroom Flat, Omole Phase 1",
    address: "7 Omole Phase 1, Ikeja, Lagos",
    lga: "Ikeja",
    listingType: "RENT",
    pricePerYear: 2_200_000,
    propertyType: "3 Bedroom Flat",
    bedrooms: 3,
    bathrooms: 3,
    size: 180,
    landlordIndex: 3,
    photoIndex: 9,
    extraImages: [10, 11, 12],
  },
  {
    title: "2-Bedroom Flat, Magodo Phase 2",
    address: "22 Magodo Phase 2, Ikeja, Lagos",
    lga: "Ikeja",
    listingType: "RENT",
    pricePerYear: 1_200_000,
    propertyType: "2 Bedroom Flat",
    bedrooms: 2,
    bathrooms: 2,
    size: 110,
    landlordIndex: 0,
    photoIndex: 11,
    extraImages: [12, 13, 0],
  },
  {
    title: "3-Bedroom Bungalow, Magodo Phase 1",
    address: "5 Shangisha Road, Magodo Phase 1, Ikeja, Lagos",
    lga: "Ikeja",
    listingType: "RENT",
    pricePerYear: 1_800_000,
    propertyType: "Bungalow",
    bedrooms: 3,
    bathrooms: 2,
    size: 200,
    landlordIndex: 2,
    photoIndex: 13,
    extraImages: [0, 1, 2],
  },
  {
    title: "Mini Flat, Omole Phase 2",
    address: "14 Omole Phase 2, Ikeja, Lagos",
    lga: "Ikeja",
    listingType: "RENT",
    pricePerYear: 600_000,
    propertyType: "Mini Flat",
    bedrooms: 1,
    bathrooms: 1,
    size: 60,
    landlordIndex: 1,
    photoIndex: 1,
    extraImages: [2, 3, 4],
  },

  // ── Kosofe (4) ────────────────────────────────────────────────────────────
  {
    title: "Self Contain, Ketu",
    address: "3 Ketu-Alapere Road, Ketu, Lagos",
    lga: "Kosofe",
    listingType: "RENT",
    pricePerYear: 350_000,
    rentFrequency: "MONTHLY",
    propertyType: "Self Contain",
    bedrooms: 1,
    bathrooms: 1,
    size: 35,
    landlordIndex: 3,
    photoIndex: 3,
    extraImages: [4, 5, 6],
  },
  {
    title: "2-Bedroom Flat, Ojota",
    address: "11 Ojota Road, Ojota, Lagos",
    lga: "Kosofe",
    listingType: "RENT",
    pricePerYear: 750_000,
    rentFrequency: "MONTHLY",
    propertyType: "2 Bedroom Flat",
    bedrooms: 2,
    bathrooms: 1,
    size: 90,
    landlordIndex: 0,
    photoIndex: 5,
    extraImages: [6, 7, 8],
  },
  {
    title: "3-Bedroom Flat, Gbagada Phase 2",
    address: "8 Gbagada Phase 2, Kosofe, Lagos",
    lga: "Kosofe",
    listingType: "RENT",
    pricePerYear: 1_100_000,
    propertyType: "3 Bedroom Flat",
    bedrooms: 3,
    bathrooms: 2,
    size: 140,
    landlordIndex: 2,
    photoIndex: 7,
    extraImages: [8, 9, 10],
  },
  {
    title: "Mini Flat, Gbagada Phase 1",
    address: "2 Gbagada Phase 1, Kosofe, Lagos",
    lga: "Kosofe",
    listingType: "RENT",
    pricePerYear: 500_000,
    propertyType: "Mini Flat",
    bedrooms: 1,
    bathrooms: 1,
    size: 55,
    landlordIndex: 1,
    photoIndex: 9,
    extraImages: [10, 11, 12],
  },

  // ── Surulere (3) ──────────────────────────────────────────────────────────
  {
    title: "2-Bedroom Flat, Surulere",
    address: "15 Adeniran Ogunsanya Street, Surulere, Lagos",
    lga: "Surulere",
    listingType: "RENT",
    pricePerYear: 900_000,
    propertyType: "2 Bedroom Flat",
    bedrooms: 2,
    bathrooms: 2,
    size: 100,
    landlordIndex: 3,
    photoIndex: 11,
    extraImages: [12, 13, 0],
  },
  {
    title: "3-Bedroom Bungalow, Surulere",
    address: "6 Bode Thomas Street, Surulere, Lagos",
    lga: "Surulere",
    listingType: "RENT",
    pricePerYear: 1_500_000,
    propertyType: "Bungalow",
    bedrooms: 3,
    bathrooms: 2,
    size: 180,
    landlordIndex: 0,
    photoIndex: 13,
    extraImages: [0, 1, 2],
  },
  {
    title: "Mini Flat, Surulere",
    address: "20 Itire Road, Surulere, Lagos",
    lga: "Surulere",
    listingType: "RENT",
    pricePerYear: 450_000,
    propertyType: "Mini Flat",
    bedrooms: 1,
    bathrooms: 1,
    size: 50,
    landlordIndex: 2,
    photoIndex: 1,
    extraImages: [2, 3, 4],
  },

  // ── Alimosho (3) ──────────────────────────────────────────────────────────
  {
    title: "2-Bedroom Flat, Egbeda",
    address: "9 Egbeda-Idimu Road, Egbeda, Lagos",
    lga: "Alimosho",
    listingType: "RENT",
    pricePerYear: 650_000,
    propertyType: "2 Bedroom Flat",
    bedrooms: 2,
    bathrooms: 1,
    size: 85,
    landlordIndex: 1,
    photoIndex: 3,
    extraImages: [4, 5, 6],
  },
  {
    title: "Self Contain, Ikotun",
    address: "4 Ikotun Road, Ikotun, Lagos",
    lga: "Alimosho",
    listingType: "RENT",
    pricePerYear: 300_000,
    rentFrequency: "MONTHLY",
    propertyType: "Self Contain",
    bedrooms: 1,
    bathrooms: 1,
    size: 30,
    landlordIndex: 3,
    photoIndex: 5,
    extraImages: [6, 7, 8],
  },
  {
    title: "3-Bedroom Flat, Egbeda",
    address: "17 Shasha Road, Egbeda, Lagos",
    lga: "Alimosho",
    listingType: "RENT",
    pricePerYear: 900_000,
    propertyType: "3 Bedroom Flat",
    bedrooms: 3,
    bathrooms: 2,
    size: 130,
    landlordIndex: 0,
    photoIndex: 7,
    extraImages: [8, 9, 10],
  },

  // ── Ikorodu (2) ───────────────────────────────────────────────────────────
  {
    title: "3-Bedroom Bungalow, Ikorodu",
    address: "12 Lagos Road, Ikorodu, Lagos",
    lga: "Ikorodu",
    listingType: "RENT",
    pricePerYear: 800_000,
    propertyType: "Bungalow",
    bedrooms: 3,
    bathrooms: 2,
    size: 160,
    landlordIndex: 2,
    photoIndex: 9,
    extraImages: [10, 11, 12],
  },
  {
    title: "2-Bedroom Flat, Ikorodu",
    address: "5 Odogunyan Road, Ikorodu, Lagos",
    lga: "Ikorodu",
    listingType: "RENT",
    pricePerYear: 550_000,
    propertyType: "2 Bedroom Flat",
    bedrooms: 2,
    bathrooms: 1,
    size: 80,
    landlordIndex: 1,
    photoIndex: 11,
    extraImages: [12, 13, 0],
  },

  // ── Ibeju-Lekki (2) ───────────────────────────────────────────────────────
  {
    title: "Residential Land for Sale, Ibeju-Lekki",
    address: "Eleko Junction, Ibeju-Lekki, Lagos",
    lga: "Ibeju-Lekki",
    listingType: "SALE",
    pricePerYear: 0,
    propertyType: "Land",
    size: 600,
    landlordIndex: 0,
    photoIndex: 13,
    extraImages: [0, 1, 2],
  },
  {
    title: "4-Bedroom Detached Duplex for Sale, Ibeju-Lekki",
    address: "Dangote Refinery Road, Ibeju-Lekki, Lagos",
    lga: "Ibeju-Lekki",
    listingType: "SALE",
    pricePerYear: 0,
    propertyType: "Detached Duplex",
    bedrooms: 4,
    bathrooms: 4,
    size: 420,
    landlordIndex: 3,
    photoIndex: 1,
    extraImages: [2, 3, 4],
  },

  // ── Lagos Island (2) ──────────────────────────────────────────────────────
  {
    title: "Luxury Shortlet Apartment, Lagos Island",
    address: "10 Broad Street, Lagos Island, Lagos",
    lga: "Lagos Island",
    listingType: "SHORTLET",
    pricePerYear: 0,
    propertyType: "2 Bedroom Flat",
    bedrooms: 2,
    bathrooms: 2,
    size: 110,
    shortletDailyRate: 35_000,
    shortletWeeklyRate: 210_000,
    shortletMonthlyRate: 750_000,
    landlordIndex: 2,
    photoIndex: 4,
    extraImages: [5, 6, 7],
  },
  {
    title: "Commercial Property for Sale, Lagos Island",
    address: "3 Marina Road, Lagos Island, Lagos",
    lga: "Lagos Island",
    listingType: "SALE",
    pricePerYear: 0,
    propertyType: "Mansion",
    bedrooms: 5,
    bathrooms: 6,
    size: 700,
    landlordIndex: 1,
    photoIndex: 6,
    extraImages: [7, 8, 9],
  },

  // ── Apapa (1) ─────────────────────────────────────────────────────────────
  {
    title: "3-Bedroom Flat, Apapa",
    address: "8 Creek Road, Apapa, Lagos",
    lga: "Apapa",
    listingType: "RENT",
    pricePerYear: 1_400_000,
    propertyType: "3 Bedroom Flat",
    bedrooms: 3,
    bathrooms: 2,
    size: 150,
    landlordIndex: 3,
    photoIndex: 9,
    extraImages: [10, 11, 12],
  },
];

// ---------------------------------------------------------------------------
// Sale prices (pricePerYear = 0 for SALE/SHORTLET — store in metadata)
// ---------------------------------------------------------------------------

const SALE_PRICES: Record<string, number> = {
  "Stunning Mansion with Pool, Victoria Island": 450_000_000,
  "Semi-Detached Duplex for Sale, Lekki Phase 1": 120_000_000,
  "Residential Land for Sale, Ibeju-Lekki": 25_000_000,
  "4-Bedroom Detached Duplex for Sale, Ibeju-Lekki": 180_000_000,
  "Commercial Property for Sale, Lagos Island": 350_000_000,
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("🌱 Starting seed...\n");

  // 1. Upsert landlords
  console.log("👤 Creating landlord users...");
  const landlordUsers = [];
  for (const l of LANDLORDS) {
    const passwordHash = await bcrypt.hash(l.password, 12);
    const user = await prisma.user.upsert({
      where: { email: l.email },
      update: {},
      create: {
        email: l.email,
        fullName: l.fullName,
        phoneNumber: l.phoneNumber,
        passwordHash,
        roles: ["LANDLORD"],
        isVerified: true,
        verificationTier: 2,
      },
    });
    landlordUsers.push(user);
    console.log(`   ✓ ${l.fullName} (${l.email})`);
  }

  // 2. Upsert demo tenant
  console.log("\n👤 Creating demo tenant...");
  const tenantPasswordHash = await bcrypt.hash(DEMO_TENANT.password, 12);
  const demoTenant = await prisma.user.upsert({
    where: { email: DEMO_TENANT.email },
    update: {},
    create: {
      email: DEMO_TENANT.email,
      fullName: DEMO_TENANT.fullName,
      phoneNumber: DEMO_TENANT.phoneNumber,
      passwordHash: tenantPasswordHash,
      roles: ["TENANT"],
      isVerified: true,
      verificationTier: 1,
    },
  });
  console.log(`   ✓ ${DEMO_TENANT.fullName} (${DEMO_TENANT.email})`);

  // 3. Create properties
  console.log("\n🏠 Creating properties...");
  let created = 0;
  let skipped = 0;

  for (const p of PROPERTIES) {
    const landlord = landlordUsers[p.landlordIndex];

    // Check for existing property by title + landlordId to avoid duplicates
    const existing = await prisma.property.findFirst({
      where: { title: p.title, landlordId: landlord.id },
    });

    if (existing) {
      skipped++;
      continue;
    }

    // Build metadata
    const salePrice = SALE_PRICES[p.title];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metadata: any = {
      propertyType: p.propertyType,
      ...(p.bedrooms !== undefined && { bedrooms: p.bedrooms }),
      ...(p.bathrooms !== undefined && { bathrooms: p.bathrooms }),
      ...(p.size !== undefined && { size: p.size }),
      ...(p.rentFrequency && { rentFrequency: p.rentFrequency }),
      amenities: buildAmenities(p.propertyType),
      ...(p.listingType === "SALE" && salePrice && { salePrice }),
      ...(p.listingType === "SHORTLET" &&
        p.shortletDailyRate && {
          shortlet: {
            dailyRate: p.shortletDailyRate,
            ...(p.shortletWeeklyRate && { weeklyRate: p.shortletWeeklyRate }),
            ...(p.shortletMonthlyRate && { monthlyRate: p.shortletMonthlyRate }),
          },
        }),
    };

    const property = await prisma.property.create({
      data: {
        title: p.title,
        address: p.address,
        lga: p.lga,
        state: "Lagos",
        listingType: p.listingType,
        pricePerYear: p.pricePerYear,
        totalPackage: p.pricePerYear,
        status: "AVAILABLE",
        landlordId: landlord.id,
        metadata,
        developmentStage: p.propertyType === "Land" ? "LAND" : "FINISHED",
        isOffPlan: false,
      },
    });

    // Primary image
    await prisma.propertyImage.create({
      data: {
        propertyId: property.id,
        url: photoUrl(p.photoIndex),
        isPrimary: true,
        order: 0,
      },
    });

    // Extra images
    if (p.extraImages) {
      for (let i = 0; i < p.extraImages.length; i++) {
        await prisma.propertyImage.create({
          data: {
            propertyId: property.id,
            url: photoUrl(p.extraImages[i]),
            isPrimary: false,
            order: i + 1,
          },
        });
      }
    }

    created++;
    console.log(`   ✓ [${p.lga}] ${p.title}`);
  }

  console.log(
    `\n   📊 ${created} properties created, ${skipped} already existed.`
  );

  // 4. Print demo credentials
  console.log("\n" + "═".repeat(60));
  console.log("🎉 Seed complete! Demo credentials:");
  console.log("═".repeat(60));
  console.log("\n🏠 Landlords:");
  for (const l of LANDLORDS) {
    console.log(`   Email:    ${l.email}`);
    console.log(`   Password: ${l.password}\n`);
  }
  console.log("🧑 Demo Tenant:");
  console.log(`   Email:    ${DEMO_TENANT.email}`);
  console.log(`   Password: ${DEMO_TENANT.password}`);
  console.log("═".repeat(60));

  void demoTenant;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildAmenities(propertyType: string): string[] {
  const base = ["Running Water", "Pre-paid Meter", "Security"];
  const extras: Record<string, string[]> = {
    "Self Contain": [],
    "Mini Flat": ["Parking Space"],
    "2 Bedroom Flat": ["Parking Space", "Generator"],
    "3 Bedroom Flat": ["Parking Space", "Generator", "Boys Quarters"],
    "4 Bedroom Flat": [
      "Parking Space",
      "Generator",
      "Boys Quarters",
      "Swimming Pool",
    ],
    Bungalow: ["Parking Space", "Garden"],
    "Semi-Detached Duplex": ["Parking Space", "Generator", "Garden"],
    "Detached Duplex": [
      "Parking Space",
      "Generator",
      "Garden",
      "Boys Quarters",
    ],
    "Terrace Duplex": ["Parking Space", "Generator"],
    Mansion: [
      "Parking Space",
      "Generator",
      "Swimming Pool",
      "Garden",
      "Boys Quarters",
      "Gym",
    ],
    Penthouse: [
      "Parking Space",
      "Generator",
      "Swimming Pool",
      "Rooftop Terrace",
      "Gym",
    ],
    Land: [],
  };
  return [...base, ...(extras[propertyType] ?? [])];
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Nigerian residential photography from Pexels (free, no API key needed)
// These are actual Nigerian/West African residential and interior photos
// ---------------------------------------------------------------------------

const IMAGES = [
  // Nigerian/West African residential exteriors and interiors
  "https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?w=900&auto=compress",   // 0  apartment block exterior
  "https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?w=900&auto=compress", // 1  modern house exterior
  "https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?w=900&auto=compress", // 2  gated compound entrance
  "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?w=900&auto=compress", // 3  bright living room
  "https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?w=900&auto=compress", // 4  bedroom interior
  "https://images.pexels.com/photos/2251247/pexels-photo-2251247.jpeg?w=900&auto=compress", // 5  Nigerian-style kitchen
  "https://images.pexels.com/photos/439391/pexels-photo-439391.jpeg?w=900&auto=compress",   // 6  duplex front view
  "https://images.pexels.com/photos/1370704/pexels-photo-1370704.jpeg?w=900&auto=compress", // 7  detached house with gate
  "https://images.pexels.com/photos/2119713/pexels-photo-2119713.jpeg?w=900&auto=compress", // 8  apartment building
  "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?w=900&auto=compress",   // 9  bungalow exterior
  "https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?w=900&auto=compress", // 10 house with compound
  "https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg?w=900&auto=compress", // 11 clean bathroom
  "https://images.pexels.com/photos/1648776/pexels-photo-1648776.jpeg?w=900&auto=compress", // 12 self-contain/studio room
  "https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?w=900&auto=compress", // 13 terrace house row
  "https://images.pexels.com/photos/2631746/pexels-photo-2631746.jpeg?w=900&auto=compress", // 14 mini flat interior
  "https://images.pexels.com/photos/280222/pexels-photo-280222.jpeg?w=900&auto=compress",   // 15 land / empty plot
  "https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?w=900&auto=compress", // 16 estate road view
  "https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?w=900&auto=compress", // 17 dining room
  "https://images.pexels.com/photos/2062431/pexels-photo-2062431.jpeg?w=900&auto=compress", // 18 rooftop terrace
  "https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg?w=900&auto=compress",   // 19 house exterior street view
];

// ---------------------------------------------------------------------------
// The 3 demo accounts
// ---------------------------------------------------------------------------

// Admin has ALL roles to demonstrate that a user can be multi-role
const ADMIN = {
  email: "admin@hausevo.com.ng",
  fullName: "Tunde Fashola",
  phone: "+2348011111111",
  password: "Admin@Hausevo1",
  roles: ["ADMIN", "LANDLORD", "TENANT", "ARTISAN"] as const,
};

// Pure tenant
const TENANT = {
  email: "amaka.obi@tenant.ng",
  fullName: "Amaka Obi",
  phone: "+2348022222222",
  password: "Tenant@123",
  roles: ["TENANT"] as const,
};

// Pure landlord
const LANDLORD = {
  email: "emeka.okafor@landlord.ng",
  fullName: "Emeka Okafor",
  phone: "+2348033333333",
  password: "Landlord@123",
  roles: ["LANDLORD"] as const,
};

// ---------------------------------------------------------------------------
// 20 properties — real Lagos addresses, varied types, authentic pricing
// ---------------------------------------------------------------------------

const PROPERTIES = [
  // ── Lekki / Eti-Osa ─────────────────────────────────────────────────────
  {
    title: "3-Bedroom Flat, Lekki Phase 1",
    address: "14 Admiralty Way, Lekki Phase 1",
    lga: "Eti-Osa",
    listingType: "RENT" as const,
    pricePerYear: 2_800_000,
    propertyType: "3 Bedroom Flat",
    bedrooms: 3, bathrooms: 3, size: 180,
    amenities: ["Running Water", "Pre-paid Meter", "Generator", "Security", "Parking Space", "CCTV"],
    imgIdx: [0, 3, 5],
    description: "Spacious 3-bedroom flat in a secured estate in Lekki Phase 1. Close to the toll gate and Admiralty Way shops.",
  },
  {
    title: "4-Bedroom Detached Duplex, Ikoyi",
    address: "7 Bourdillon Road, Ikoyi",
    lga: "Eti-Osa",
    listingType: "RENT" as const,
    pricePerYear: 7_500_000,
    propertyType: "Detached Duplex",
    bedrooms: 4, bathrooms: 5, size: 420,
    amenities: ["Running Water", "Pre-paid Meter", "Generator", "Security", "Parking Space", "Swimming Pool", "Boys Quarters", "Garden", "CCTV"],
    imgIdx: [6, 3, 4, 5],
    description: "Premium 4-bedroom duplex on Bourdillon Road, Ikoyi. Fully serviced with 24/7 security and backup power.",
  },
  {
    title: "2-Bedroom Shortlet, Lekki Phase 2",
    address: "5 Freedom Way, Lekki Phase 2",
    lga: "Eti-Osa",
    listingType: "SHORTLET" as const,
    pricePerYear: 0,
    propertyType: "2 Bedroom Flat",
    bedrooms: 2, bathrooms: 2, size: 110,
    amenities: ["Running Water", "Pre-paid Meter", "Generator", "Air Conditioning", "WiFi", "DSTV", "Security", "Parking Space"],
    shortletDailyRate: 45_000,
    shortletWeeklyRate: 280_000,
    shortletMonthlyRate: 900_000,
    imgIdx: [8, 3, 11],
    description: "Stylish shortlet apartment fully furnished and serviced. Perfect for business trips and holidays in Lagos.",
  },
  {
    title: "5-Bedroom Mansion for Sale, Victoria Island",
    address: "22 Ozumba Mbadiwe Avenue, Victoria Island",
    lga: "Eti-Osa",
    listingType: "SALE" as const,
    pricePerYear: 0,
    salePrice: 380_000_000,
    propertyType: "Mansion",
    bedrooms: 5, bathrooms: 6, size: 750,
    amenities: ["Running Water", "Generator", "Security", "Parking Space", "Swimming Pool", "Boys Quarters", "Garden", "Gym", "CCTV"],
    imgIdx: [1, 6, 9],
    description: "Magnificent 5-bedroom mansion on VI with a private pool, cinema room, and staff quarters. C of O available.",
  },

  // ── Ikeja ────────────────────────────────────────────────────────────────
  {
    title: "4-Bedroom Duplex, Ikeja GRA",
    address: "12 Isaac John Street, Ikeja GRA",
    lga: "Ikeja",
    listingType: "RENT" as const,
    pricePerYear: 4_500_000,
    propertyType: "Detached Duplex",
    bedrooms: 4, bathrooms: 4, size: 380,
    amenities: ["Running Water", "Pre-paid Meter", "Generator", "Security", "Parking Space", "Boys Quarters", "Garden"],
    imgIdx: [6, 0, 4],
    description: "Well-maintained 4-bedroom duplex in the heart of Ikeja GRA. Close to the airport and Alausa.",
  },
  {
    title: "3-Bedroom Flat, Omole Phase 1",
    address: "7 Omole Phase 1, Ikeja",
    lga: "Ikeja",
    listingType: "RENT" as const,
    pricePerYear: 2_000_000,
    propertyType: "3 Bedroom Flat",
    bedrooms: 3, bathrooms: 2, size: 150,
    amenities: ["Running Water", "Pre-paid Meter", "Generator", "Security", "Parking Space"],
    imgIdx: [12, 3, 5],
    description: "Clean 3-bedroom flat in the quiet Omole Phase 1 estate. Excellent road network and peaceful environment.",
  },
  {
    title: "2-Bedroom Flat, Magodo Phase 2",
    address: "22 Magodo Phase 2, Ikeja",
    lga: "Ikeja",
    listingType: "RENT" as const,
    pricePerYear: 1_200_000,
    propertyType: "2 Bedroom Flat",
    bedrooms: 2, bathrooms: 2, size: 110,
    amenities: ["Running Water", "Pre-paid Meter", "Security", "Parking Space"],
    imgIdx: [7, 3],
    description: "Decent 2-bedroom flat in Magodo Phase 2. Quiet neighbourhood, close to the CMD road.",
  },
  {
    title: "Mini Flat, Oregun, Ikeja",
    address: "15 Oregun Road, Oregun, Ikeja",
    lga: "Ikeja",
    listingType: "RENT" as const,
    pricePerYear: 600_000,
    propertyType: "Mini Flat",
    bedrooms: 1, bathrooms: 1, size: 55,
    amenities: ["Running Water", "Pre-paid Meter", "Security"],
    imgIdx: [14, 16],
    description: "Affordable mini flat for working professionals. Close to Computer Village and major bus stops.",
  },

  // ── Surulere / Lagos Mainland ─────────────────────────────────────────────
  {
    title: "2-Bedroom Flat, Surulere",
    address: "15 Adeniran Ogunsanya Street, Surulere",
    lga: "Surulere",
    listingType: "RENT" as const,
    pricePerYear: 950_000,
    propertyType: "2 Bedroom Flat",
    bedrooms: 2, bathrooms: 2, size: 100,
    amenities: ["Running Water", "Pre-paid Meter", "Security", "Parking Space"],
    imgIdx: [2, 3, 5],
    description: "Comfortable 2-bedroom flat on a quiet street in Surulere. Walking distance from Adeniran Ogunsanya market.",
  },
  {
    title: "3-Bedroom Bungalow, Surulere",
    address: "6 Bode Thomas Street, Surulere",
    lga: "Surulere",
    listingType: "RENT" as const,
    pricePerYear: 1_400_000,
    propertyType: "Bungalow",
    bedrooms: 3, bathrooms: 2, size: 160,
    amenities: ["Running Water", "Pre-paid Meter", "Generator", "Security", "Parking Space", "Garden"],
    imgIdx: [9, 2, 4],
    description: "Spacious bungalow with a private compound in Surulere. Suitable for a family with children.",
  },

  // ── Yaba / Lagos Mainland ─────────────────────────────────────────────────
  {
    title: "Self Contain, Yaba",
    address: "3 Herbert Macaulay Way, Yaba",
    lga: "Lagos Mainland",
    listingType: "RENT" as const,
    pricePerYear: 400_000,
    propertyType: "Self Contain",
    bedrooms: 1, bathrooms: 1, size: 32,
    amenities: ["Running Water", "Pre-paid Meter"],
    imgIdx: [14, 16],
    description: "Clean self-contain for students and young professionals. Very close to Unilag and Yaba Tech.",
  },
  {
    title: "2-Bedroom Flat, Akoka, Yaba",
    address: "11 Akoka Road, Akoka, Yaba",
    lga: "Lagos Mainland",
    listingType: "RENT" as const,
    pricePerYear: 750_000,
    rentFrequency: "BIANNUALLY" as const,
    propertyType: "2 Bedroom Flat",
    bedrooms: 2, bathrooms: 1, size: 85,
    amenities: ["Running Water", "Pre-paid Meter", "Security"],
    imgIdx: [10, 3],
    description: "Well-ventilated 2-bedroom flat in Akoka, very close to UNILAG gate. Paid every 6 months.",
  },

  // ── Kosofe / Gbagada ─────────────────────────────────────────────────────
  {
    title: "3-Bedroom Flat, Gbagada Phase 2",
    address: "8 Gbagada Phase 2, Kosofe",
    lga: "Kosofe",
    listingType: "RENT" as const,
    pricePerYear: 1_100_000,
    propertyType: "3 Bedroom Flat",
    bedrooms: 3, bathrooms: 2, size: 135,
    amenities: ["Running Water", "Pre-paid Meter", "Generator", "Security", "Parking Space"],
    imgIdx: [12, 4, 5],
    description: "Solid 3-bedroom flat in Gbagada Phase 2. Gated compound with ample car parking.",
  },
  {
    title: "Mini Flat, Gbagada Phase 1",
    address: "2 Gbagada Phase 1, Kosofe",
    lga: "Kosofe",
    listingType: "RENT" as const,
    pricePerYear: 480_000,
    propertyType: "Mini Flat",
    bedrooms: 1, bathrooms: 1, size: 50,
    amenities: ["Running Water", "Pre-paid Meter", "Security"],
    imgIdx: [16, 14],
    description: "Compact and affordable mini flat in Gbagada. Good for a young professional or couple.",
  },

  // ── Alimosho / Egbeda ────────────────────────────────────────────────────
  {
    title: "3-Bedroom Flat, Egbeda",
    address: "9 Egbeda-Idimu Road, Egbeda",
    lga: "Alimosho",
    listingType: "RENT" as const,
    pricePerYear: 850_000,
    propertyType: "3 Bedroom Flat",
    bedrooms: 3, bathrooms: 2, size: 130,
    amenities: ["Running Water", "Pre-paid Meter", "Security", "Parking Space"],
    imgIdx: [13, 2],
    description: "Affordable 3-bedroom flat in Egbeda with a shared compound. Good road access and security.",
  },
  {
    title: "Self Contain, Ikotun",
    address: "4 Ikotun Road, Ikotun, Alimosho",
    lga: "Alimosho",
    listingType: "RENT" as const,
    pricePerYear: 300_000,
    rentFrequency: "MONTHLY" as const,
    propertyType: "Self Contain",
    bedrooms: 1, bathrooms: 1, size: 28,
    amenities: ["Running Water", "Pre-paid Meter"],
    imgIdx: [16, 14],
    description: "Budget-friendly self-contain in Ikotun. Suitable for artisans, traders, and students.",
  },

  // ── Ikorodu ───────────────────────────────────────────────────────────────
  {
    title: "3-Bedroom Bungalow, Ikorodu",
    address: "12 Lagos Road, Ikorodu",
    lga: "Ikorodu",
    listingType: "RENT" as const,
    pricePerYear: 750_000,
    propertyType: "Bungalow",
    bedrooms: 3, bathrooms: 2, size: 155,
    amenities: ["Running Water", "Pre-paid Meter", "Security", "Garden", "Parking Space"],
    imgIdx: [9, 2, 15],
    description: "Family bungalow in Ikorodu with a large compound. Quiet and suitable for a young family.",
  },
  {
    title: "2-Bedroom Flat, Ikorodu",
    address: "5 Odogunyan Road, Ikorodu",
    lga: "Ikorodu",
    listingType: "RENT" as const,
    pricePerYear: 520_000,
    propertyType: "2 Bedroom Flat",
    bedrooms: 2, bathrooms: 1, size: 78,
    amenities: ["Running Water", "Pre-paid Meter", "Security"],
    imgIdx: [7, 3],
    description: "Clean 2-bedroom flat in Ikorodu town. Very affordable and close to the marina road.",
  },

  // ── Ibeju-Lekki ──────────────────────────────────────────────────────────
  {
    title: "4-Bedroom Duplex for Sale, Ibeju-Lekki",
    address: "Dangote Refinery Road, Ibeju-Lekki",
    lga: "Ibeju-Lekki",
    listingType: "SALE" as const,
    pricePerYear: 0,
    salePrice: 165_000_000,
    propertyType: "Detached Duplex",
    bedrooms: 4, bathrooms: 4, size: 400,
    amenities: ["Running Water", "Generator", "Security", "Parking Space", "Boys Quarters", "Garden"],
    imgIdx: [1, 6, 9, 15],
    description: "Brand new 4-bedroom duplex near the Dangote Refinery corridor. Strong investment potential as the area develops.",
  },
  {
    title: "Residential Land for Sale, Ibeju-Lekki",
    address: "Eleko Junction, Ibeju-Lekki",
    lga: "Ibeju-Lekki",
    listingType: "SALE" as const,
    pricePerYear: 0,
    salePrice: 22_000_000,
    propertyType: "Land",
    size: 500,
    amenities: [],
    imgIdx: [19, 15],
    description: "600 sqm dry land at Eleko Junction with a Government Allocation Letter. Survey plan available.",
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("🌱 Starting seed…\n");

  // 1. Create the 3 demo accounts
  console.log("👤 Creating demo accounts…");

  const adminHash = await bcrypt.hash(ADMIN.password, 12);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN.email },
    update: { roles: ADMIN.roles as unknown as any[], isVerified: true, verificationTier: 2, onboardingCompleted: true },
    create: {
      email: ADMIN.email,
      fullName: ADMIN.fullName,
      phoneNumber: ADMIN.phone,
      passwordHash: adminHash,
      roles: ADMIN.roles as unknown as any[],
      isVerified: true,
      verificationTier: 2,
      onboardingCompleted: true,
    },
  });
  console.log(`   ✓ ${ADMIN.fullName} — roles: ${ADMIN.roles.join(", ")}`);
  console.log(`     Email: ${ADMIN.email} | Password: ${ADMIN.password}`);

  const tenantHash = await bcrypt.hash(TENANT.password, 12);
  await prisma.user.upsert({
    where: { email: TENANT.email },
    update: { roles: TENANT.roles as unknown as any[], isVerified: true, verificationTier: 1, onboardingCompleted: true },
    create: {
      email: TENANT.email,
      fullName: TENANT.fullName,
      passwordHash: tenantHash,
      roles: TENANT.roles as unknown as any[],
      isVerified: true,
      verificationTier: 1,
      onboardingCompleted: true,
    },
  });
  console.log(`   ✓ ${TENANT.fullName} — role: TENANT`);
  console.log(`     Email: ${TENANT.email} | Password: ${TENANT.password}`);

  const landlordHash = await bcrypt.hash(LANDLORD.password, 12);
  const existingLandlord = await prisma.user.findUnique({ where: { email: LANDLORD.email } });
  const landlord = await prisma.user.upsert({
    where: { email: LANDLORD.email },
    update: { roles: LANDLORD.roles as unknown as any[], isVerified: true, verificationTier: 2, onboardingCompleted: true },
    create: {
      email: LANDLORD.email,
      fullName: LANDLORD.fullName,
      passwordHash: landlordHash,
      roles: LANDLORD.roles as unknown as any[],
      isVerified: true,
      verificationTier: 2,
      onboardingCompleted: true,
    },
  });
  void existingLandlord;
  console.log(`   ✓ ${LANDLORD.fullName} — role: LANDLORD`);
  console.log(`     Email: ${LANDLORD.email} | Password: ${LANDLORD.password}`);

  // Admin also has an artisan profile (demonstrates multi-role)
  const existingArtisan = await prisma.artisanProfile.findUnique({ where: { userId: admin.id } });
  if (!existingArtisan) {
    await prisma.artisanProfile.create({
      data: {
        userId: admin.id,
        category: "ELECTRICIAN",
        yearsOfExperience: 8,
        startingPrice: 15000,
        bio: "Certified electrician with 8 years experience across Lagos. Specialise in rewiring, industrial installations, and solar systems.",
        isVetted: true,
      },
    });
    console.log(`   ✓ Admin artisan profile created (ELECTRICIAN)`);
  }

  // 2. Create 20 properties
  console.log("\n🏠 Creating properties…");
  let created = 0;
  let skipped = 0;

  // Alternate between admin (as landlord) and the dedicated landlord
  const landlordPool = [admin.id, landlord.id];

  for (let i = 0; i < PROPERTIES.length; i++) {
    const p = PROPERTIES[i];
    const landlordId = landlordPool[i % 2];

    const exists = await prisma.property.findFirst({ where: { title: p.title, landlordId } });
    if (exists) { skipped++; continue; }

    const metadata: Record<string, unknown> = {
      propertyType: p.propertyType,
      ...(p.bedrooms !== undefined && { bedrooms: p.bedrooms }),
      ...(p.bathrooms !== undefined && { bathrooms: p.bathrooms }),
      ...(p.size !== undefined && { size: p.size }),
      ...("rentFrequency" in p && p.rentFrequency && { rentFrequency: p.rentFrequency }),
      amenities: p.amenities ?? [],
      description: p.description,
      ...("salePrice" in p && p.salePrice && { salePrice: p.salePrice }),
      ...("shortletDailyRate" in p && p.shortletDailyRate && {
        shortlet: {
          dailyRate: p.shortletDailyRate,
          ...("shortletWeeklyRate" in p && p.shortletWeeklyRate && { weeklyRate: p.shortletWeeklyRate }),
          ...("shortletMonthlyRate" in p && p.shortletMonthlyRate && { monthlyRate: p.shortletMonthlyRate }),
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
        totalPackage: p.pricePerYear > 0 ? p.pricePerYear + 50_000 : 0,
        status: "AVAILABLE",
        landlordId,
        metadata: metadata as any,
        developmentStage: (p.propertyType === "Land" ? "LAND" : "FINISHED") as any,
        deedVerified: i % 3 === 0, // every 3rd property is deed-verified
        priceVerified: i % 4 === 0,
        healthScore: 70 + (i % 3) * 10, // 70, 80, or 90
      },
    });

    // Images
    for (let j = 0; j < p.imgIdx.length; j++) {
      await prisma.propertyImage.create({
        data: {
          propertyId: property.id,
          url: IMAGES[p.imgIdx[j] % IMAGES.length],
          isPrimary: j === 0,
          order: j,
        },
      });
    }

    created++;
    console.log(`   ✓ [${p.lga}] ${p.title}`);
  }

  console.log(`\n   📊 ${created} properties created, ${skipped} already existed.`);

  // 3. Print summary
  console.log("\n" + "═".repeat(60));
  console.log("🎉 Seed complete!");
  console.log("═".repeat(60));
  console.log(`
DEMO ACCOUNTS
─────────────────────────────────────────
Admin (all roles — ADMIN, LANDLORD, TENANT, ARTISAN):
  Email:    ${ADMIN.email}
  Password: ${ADMIN.password}

Tenant:
  Email:    ${TENANT.email}
  Password: ${TENANT.password}

Landlord:
  Email:    ${LANDLORD.email}
  Password: ${LANDLORD.password}

NOTE: A user CAN hold multiple roles simultaneously.
The admin account demonstrates all 4 roles at once.
═══════════════════════════════════════════════════`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

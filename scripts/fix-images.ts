/**
 * One-time script to replace the broken Unsplash photo ID in the database.
 * Run with: npx tsx --tsconfig tsconfig.json scripts/fix-images.ts
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const broken = "https://images.unsplash.com/photo-1475855581690-a37cf4ad8d9e?w=800&q=80";
  const fixed  = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80";

  const result = await prisma.propertyImage.updateMany({
    where: { url: broken },
    data:  { url: fixed },
  });

  console.log(`✅ Fixed ${result.count} image(s)`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

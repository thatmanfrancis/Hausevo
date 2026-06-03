import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const IMAGES = [
  "https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?w=900&auto=compress",
  "https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?w=900&auto=compress",
  "https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?w=900&auto=compress",
  "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?w=900&auto=compress",
  "https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?w=900&auto=compress",
  "https://images.pexels.com/photos/2251247/pexels-photo-2251247.jpeg?w=900&auto=compress",
  "https://images.pexels.com/photos/439391/pexels-photo-439391.jpeg?w=900&auto=compress",
  "https://images.pexels.com/photos/1370704/pexels-photo-1370704.jpeg?w=900&auto=compress",
  "https://images.pexels.com/photos/2119713/pexels-photo-2119713.jpeg?w=900&auto=compress",
  "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?w=900&auto=compress",
  "https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?w=900&auto=compress",
  "https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg?w=900&auto=compress",
  "https://images.pexels.com/photos/1648776/pexels-photo-1648776.jpeg?w=900&auto=compress",
  "https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?w=900&auto=compress",
  "https://images.pexels.com/photos/2631746/pexels-photo-2631746.jpeg?w=900&auto=compress",
  "https://images.pexels.com/photos/280222/pexels-photo-280222.jpeg?w=900&auto=compress",
  "https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?w=900&auto=compress",
  "https://images.pexels.com/photos/2062431/pexels-photo-2062431.jpeg?w=900&auto=compress",
  "https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg?w=900&auto=compress",
  "https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?w=900&auto=compress",
];

async function main() {
  const images = await prisma.propertyImage.findMany({ orderBy: { createdAt: "asc" } });
  console.log(`Updating ${images.length} images to Pexels URLs...`);
  for (let i = 0; i < images.length; i++) {
    await prisma.propertyImage.update({
      where: { id: images[i].id },
      data: { url: IMAGES[i % IMAGES.length] },
    });
  }
  console.log("✓ Done.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

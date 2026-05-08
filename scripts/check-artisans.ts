const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkArtisans() {
  const usersWithArtisanRole = await prisma.user.findMany({
    where: {
      roles: {
        has: "ARTISAN",
      },
    },
    include: {
      artisanProfile: true,
    },
  });

  console.log(`Users with ARTISAN role: ${usersWithArtisanRole.length}`);
  usersWithArtisanRole.forEach((u: any) => {
    console.log(
      `- ${u.fullName} (${u.email}): Profile exists? ${!!u.artisanProfile}`,
    );
  });

  const allProfiles = await prisma.artisanProfile.findMany();
  console.log(`Total ArtisanProfiles: ${allProfiles.length}`);
}

checkArtisans()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());

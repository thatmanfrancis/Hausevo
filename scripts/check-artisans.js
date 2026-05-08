const { PrismaClient } = require("./src/generated/prisma");
const prisma = new PrismaClient();

async function checkArtisans() {
  try {
    const usersWithArtisanRole = await prisma.user.findMany({
      where: {
        roles: {
          has: "ARTISAN"
        }
      },
      include: {
        artisanProfile: true
      }
    });

    console.log(`Users with ARTISAN role: ${usersWithArtisanRole.length}`);
    usersWithArtisanRole.forEach(u => {
      console.log(`- ${u.fullName} (${u.email}): Profile exists? ${!!u.artisanProfile}`);
    });

    const allProfiles = await prisma.artisanProfile.findMany();
    console.log(`Total ArtisanProfiles: ${allProfiles.length}`);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkArtisans();

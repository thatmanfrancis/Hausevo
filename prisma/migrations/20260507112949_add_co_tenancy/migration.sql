-- CreateTable
CREATE TABLE "_CoTenants" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CoTenants_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CoTenants_B_index" ON "_CoTenants"("B");

-- AddForeignKey
ALTER TABLE "_CoTenants" ADD CONSTRAINT "_CoTenants_A_fkey" FOREIGN KEY ("A") REFERENCES "Tenancy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CoTenants" ADD CONSTRAINT "_CoTenants_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

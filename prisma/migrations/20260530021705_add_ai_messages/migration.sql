-- CreateTable
CREATE TABLE "AIMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AIMessage_userId_createdAt_idx" ON "AIMessage"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

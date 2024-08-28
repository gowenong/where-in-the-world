/*
  Warnings:

  - You are about to drop the column `personId` on the `Tag` table. All the data in the column will be lost.
  - You are about to drop the column `personId` on the `VisitedLocation` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Tag" DROP CONSTRAINT "Tag_personId_fkey";

-- DropForeignKey
ALTER TABLE "VisitedLocation" DROP CONSTRAINT "VisitedLocation_personId_fkey";

-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "countryCityId" INTEGER;

-- AlterTable
ALTER TABLE "Tag" DROP COLUMN "personId";

-- AlterTable
ALTER TABLE "VisitedLocation" DROP COLUMN "personId";

-- CreateTable
CREATE TABLE "CountryCity" (
    "id" SERIAL NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,

    CONSTRAINT "CountryCity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PersonToVisitedLocation" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_PersonToTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "CountryCity_country_city_key" ON "CountryCity"("country", "city");

-- CreateIndex
CREATE UNIQUE INDEX "_PersonToVisitedLocation_AB_unique" ON "_PersonToVisitedLocation"("A", "B");

-- CreateIndex
CREATE INDEX "_PersonToVisitedLocation_B_index" ON "_PersonToVisitedLocation"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PersonToTag_AB_unique" ON "_PersonToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_PersonToTag_B_index" ON "_PersonToTag"("B");

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_countryCityId_fkey" FOREIGN KEY ("countryCityId") REFERENCES "CountryCity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PersonToVisitedLocation" ADD CONSTRAINT "_PersonToVisitedLocation_A_fkey" FOREIGN KEY ("A") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PersonToVisitedLocation" ADD CONSTRAINT "_PersonToVisitedLocation_B_fkey" FOREIGN KEY ("B") REFERENCES "VisitedLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PersonToTag" ADD CONSTRAINT "_PersonToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PersonToTag" ADD CONSTRAINT "_PersonToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

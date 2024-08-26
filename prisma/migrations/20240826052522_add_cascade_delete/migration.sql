-- DropForeignKey
ALTER TABLE "Tag" DROP CONSTRAINT "Tag_personId_fkey";

-- DropForeignKey
ALTER TABLE "VisitedLocation" DROP CONSTRAINT "VisitedLocation_personId_fkey";

-- AddForeignKey
ALTER TABLE "VisitedLocation" ADD CONSTRAINT "VisitedLocation_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

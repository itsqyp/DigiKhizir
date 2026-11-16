-- CreateEnum
CREATE TYPE "EmergencyType" AS ENUM ('MEDICAL', 'RESCUE', 'FLOOD_TRAPPED', 'FOOD_WATER', 'ANIMAL_RESCUE', 'OTHER');

-- DropForeignKey
ALTER TABLE "SOSRequest" DROP CONSTRAINT "SOSRequest_requesterId_fkey";

-- AlterTable
ALTER TABLE "SOSRequest" ADD COLUMN     "districtId" TEXT,
ADD COLUMN     "emergencyType" "EmergencyType" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "name" TEXT,
ADD COLUMN     "phone" TEXT,
ALTER COLUMN "requesterId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "SOSRequest" ADD CONSTRAINT "SOSRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

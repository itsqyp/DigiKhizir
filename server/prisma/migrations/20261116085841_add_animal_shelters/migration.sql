-- CreateEnum
CREATE TYPE "AnimalType" AS ENUM ('PET', 'LIVESTOCK', 'POULTRY', 'OTHER');

-- CreateTable
CREATE TABLE "AnimalShelter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameBn" TEXT,
    "address" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "capacity" INTEGER NOT NULL,
    "occupancy" INTEGER,
    "animalTypes" "AnimalType"[],
    "contactName" TEXT,
    "contactPhone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnimalShelter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnimalShelterFacility" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameBn" TEXT,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "animalShelterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnimalShelterFacility_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AnimalShelterFacility" ADD CONSTRAINT "AnimalShelterFacility_animalShelterId_fkey" FOREIGN KEY ("animalShelterId") REFERENCES "AnimalShelter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

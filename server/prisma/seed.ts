import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const districts = [
  { id: "bhola", name: "Bhola", lat: 22.6859, lng: 90.6482 },
  { id: "patuakhali", name: "Patuakhali", lat: 22.3596, lng: 90.3299 },
  { id: "barguna", name: "Barguna", lat: 22.1597, lng: 90.1266 },
  { id: "noakhali", name: "Noakhali", lat: 22.8696, lng: 91.0995 },
  { id: "lakshmipur", name: "Lakshmipur", lat: 22.9447, lng: 90.8282 },
  { id: "satkhira", name: "Satkhira", lat: 22.7185, lng: 89.0705 },
  { id: "khulna", name: "Khulna", lat: 22.8456, lng: 89.5403 },
  { id: "bagerhat", name: "Bagerhat", lat: 22.6516, lng: 89.7859 },
  { id: "coxsbazar", name: "Cox's Bazar", lat: 21.4272, lng: 92.0058 },
  { id: "chattogram", name: "Chattogram", lat: 22.3569, lng: 91.7832 },
  { id: "feni", name: "Feni", lat: 23.0159, lng: 91.3976 },
  { id: "barishal", name: "Barishal", lat: 22.701, lng: 90.3535 },
  { id: "pirojpur", name: "Pirojpur", lat: 22.5841, lng: 89.972 },
  { id: "jhalokati", name: "Jhalokati", lat: 22.6406, lng: 90.1987 },
  { id: "chandpur", name: "Chandpur", lat: 23.2333, lng: 90.6712 },
  { id: "shariatpur", name: "Shariatpur", lat: 23.2423, lng: 90.4348 },
  { id: "gopalganj", name: "Gopalganj", lat: 23.0051, lng: 89.8266 },
  { id: "narail", name: "Narail", lat: 23.1725, lng: 89.5127 },
  { id: "jashore", name: "Jashore", lat: 23.1664, lng: 89.2081 },
] as const;

const demoId = (type: string, districtId: string) =>
  `demo-${type}-${districtId}`;

async function main() {
  console.log("Removing previous DigiKhizir demo records...");

  // Delete only records created by this demo seed.
  // Related facilities and inventory are deleted through cascade relations.
  await prisma.animalShelter.deleteMany({
    where: { id: { startsWith: "demo-animal-" } },
  });

  await prisma.reliefPoint.deleteMany({
    where: { id: { startsWith: "demo-food-" } },
  });

  await prisma.shelter.deleteMany({
    where: { id: { startsWith: "demo-human-" } },
  });

  console.log("Creating demo records...");

  for (const [index, district] of districts.entries()) {
    const latitude = district.lat;
    const longitude = district.lng;

    // 1. HUMAN SHELTER
    await prisma.shelter.create({
      data: {
        id: demoId("human", district.id),
        name: `DEMO ONLY - Human Shelter (${district.name})`,
        nameBn: `ডেমো আশ্রয়কেন্দ্র - ${district.name}`,
        address: `Illustrative demo address, ${district.name}, Bangladesh`,
        districtId: district.id,
        latitude: latitude + 0.004,
        longitude: longitude + 0.004,
        capacity: 300 + index * 10,
        occupancy: 80 + index * 5,
        isActive: true,
        facilities: {
          create: [
            { name: "Raised flood-safe platform", available: true },
            { name: "Drinking water", available: true },
            { name: "Separate space for women and children", available: true },
            { name: "First aid", available: index % 3 !== 0 },
            { name: "Accessible toilet", available: index % 2 === 0 },
          ],
        },
      },
    });

    // 2. FOOD DISTRIBUTION POINT
    const dryFoodItems = [
      { itemName: "Chira (Flattened Rice)", quantity: 40 + index, unit: "kg" },
      { itemName: "Muri (Puffed Rice)", quantity: 25 + index, unit: "kg" },
      { itemName: "Khoi", quantity: 10 + index, unit: "kg" },
      { itemName: "Chhatu (Roasted Flour)", quantity: 15 + index, unit: "kg" },
      { itemName: "Gur (Jaggery)", quantity: 12 + index, unit: "kg" },
      { itemName: "Roasted Peanuts", quantity: 10 + index, unit: "kg" },
      { itemName: "Roasted Chickpeas", quantity: 12 + index, unit: "kg" },
      { itemName: "Dates", quantity: 8 + index, unit: "kg" },
      { itemName: "Raisins", quantity: 5 + index, unit: "kg" },
      { itemName: "Dry Biscuits", quantity: 20 + index, unit: "kg" },
      { itemName: "Toast / Rusk", quantity: 10 + index, unit: "kg" },
      { itemName: "Powdered Milk", quantity: 10 + index, unit: "kg" },
      { itemName: "Infant Formula", quantity: 5 + index, unit: "kg" },
    ];

    const dryFoodStockKg = dryFoodItems.reduce(
      (total, item) => total + item.quantity,
      0,
    );

    await prisma.reliefPoint.create({
      data: {
        id: demoId("food", district.id),
        name: `DEMO ONLY - Food Distribution (${district.name})`,
        nameBn: `ডেমো খাদ্য বিতরণ কেন্দ্র - ${district.name}`,
        address: `Illustrative demo address, ${district.name}, Bangladesh`,
        districtId: district.id,
        latitude: latitude - 0.004,
        longitude: longitude + 0.005,
        contactPhone: "01XXXXXXXXX",
        dryFoodCapacityKg: 500 + index * 20,
        dryFoodStockKg,
        isActive: true,
        inventory: {
          create: [
            ...dryFoodItems.map((item) => ({
              category: "FOOD" as const,
              ...item,
            })),
            {
              category: "FOOD",
              itemName: "Canned Foods",
              quantity: 100 + index * 5,
              unit: "cans",
            },
            {
              category: "WATER",
              itemName: "Bottled Drinking Water",
              quantity: 200 + index * 10,
              unit: "bottles",
            },
            {
              category: "MEDICINE",
              itemName: "Oral Rehydration Salts (ORS)",
              quantity: 150 + index * 5,
              unit: "sachets",
            },
            {
              category: "OTHER",
              itemName: "Water Purification Tablets",
              quantity: 100 + index * 5,
              unit: "tablets",
            },
            {
              category: "OTHER",
              itemName: "Alum (Fitkiri)",
              quantity: 10 + index,
              unit: "kg",
            },
          ],
        },
      },
    });

    // 3. ANIMAL-SAFE SHELTER
    await prisma.animalShelter.create({
      data: {
        id: demoId("animal", district.id),
        name: `DEMO ONLY - Animal Shelter (${district.name})`,
        nameBn: `ডেমো পশু আশ্রয়কেন্দ্র - ${district.name}`,
        address: `Illustrative demo address, ${district.name}, Bangladesh`,
        districtId: district.id,
        latitude: latitude + 0.006,
        longitude: longitude - 0.005,
        capacity: 250 + index * 10,
        occupancy: 60 + index * 4,
        animalTypes: ["LIVESTOCK", "POULTRY", "PET"],
        contactName: "Demo Animal Shelter Coordinator",
        contactPhone: "01XXXXXXXXX",
        isActive: true,
        facilities: {
          create: [
            { name: "Raised platform for flood protection", available: true },
            { name: "Animal drinking water", available: true },
            { name: "Fodder and feed storage", available: index % 3 !== 0 },
            { name: "Veterinary first aid", available: index % 2 === 0 },
            { name: "Separate pet enclosure", available: true },
            { name: "Poultry enclosure", available: true },
          ],
        },
      },
    });

    console.log(`Created demo records for ${district.name}`);
  }

  console.log("Successfully created demo records for all 19 districts.");
}

main()
  .catch((error) => {
    console.error("Demo seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

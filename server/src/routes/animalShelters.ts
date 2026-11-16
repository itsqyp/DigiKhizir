import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";

const animalSheltersRoute = new Hono();

const animalTypes = ["PET", "LIVESTOCK", "POULTRY", "OTHER"] as const;

// GET /api/animal-shelters
// GET /api/animal-shelters?districtId=bhola
// GET /api/animal-shelters?animalType=LIVESTOCK

animalSheltersRoute.get("/", async (c) => {
  try {
    const districtId = c.req.query("districtId");
    const animalType = c.req.query("animalType")?.toUpperCase();

    if (
      animalType &&
      !animalTypes.includes(animalType as (typeof animalTypes)[number])
    ) {
      return c.json(
        {
          success: false,
          message: "Invalid animal type.",
          allowedTypes: animalTypes,
        },
        400,
      );
    }

    const shelters = await prisma.animalShelter.findMany({
      where: {
        isActive: true,

        ...(districtId ? { districtId: districtId.toLowerCase() } : {}),

        ...(animalType
          ? {
              animalTypes: {
                has: animalType as (typeof animalTypes)[number],
              },
            }
          : {}),
      },

      include: {
        facilities: {
          orderBy: {
            name: "asc",
          },
        },
      },

      orderBy: {
        name: "asc",
      },
    });

    const data = shelters.map((shelter) => ({
      ...shelter,
      availableCapacity:
        shelter.occupancy === null
          ? null
          : Math.max(0, shelter.capacity - shelter.occupancy),
    }));

    return c.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Failed to retrieve animal shelters:", error);

    return c.json(
      {
        success: false,
        message: "Failed to retrieve animal shelters.",
      },
      500,
    );
  }
});

// GET /api/animal-shelters/:id

animalSheltersRoute.get("/:id", async (c) => {
  try {
    const { id } = c.req.param();

    const shelter = await prisma.animalShelter.findFirst({
      where: {
        id,
        isActive: true,
      },

      include: {
        facilities: {
          orderBy: {
            name: "asc",
          },
        },
      },
    });

    if (!shelter) {
      return c.json(
        {
          success: false,
          message: "Animal shelter not found.",
        },
        404,
      );
    }

    return c.json({
      success: true,
      data: {
        ...shelter,
        availableCapacity:
          shelter.occupancy === null
            ? null
            : Math.max(0, shelter.capacity - shelter.occupancy),
      },
    });
  } catch (error) {
    console.error("Failed to retrieve animal shelter:", error);

    return c.json(
      {
        success: false,
        message: "Failed to retrieve animal shelter.",
      },
      500,
    );
  }
});

export default animalSheltersRoute;

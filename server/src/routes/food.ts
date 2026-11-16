import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";

const foodRoute = new Hono();

// GET /api/food
// GET /api/food?districtId=bhola

foodRoute.get("/", async (c) => {
  try {
    const districtId = c.req.query("districtId");

    const foodPoints = await prisma.reliefPoint.findMany({
      where: {
        isActive: true,
        ...(districtId ? { districtId: districtId.toLowerCase() } : {}),
        inventory: {
          some: {
            category: "FOOD",
            quantity: {
              gt: 0,
            },
          },
        },
      },
      include: {
        inventory: {
          where: {
            category: "FOOD",
            quantity: {
              gt: 0,
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return c.json({
      success: true,
      count: foodPoints.length,
      data: foodPoints,
    });
  } catch (error) {
    console.error("Failed to retrieve food locations:", error);

    return c.json(
      {
        success: false,
        message: "Failed to retrieve food locations.",
      },
      500,
    );
  }
});

// GET /api/food/:id

foodRoute.get("/:id", async (c) => {
  try {
    const { id } = c.req.param();

    const foodPoint = await prisma.reliefPoint.findFirst({
      where: {
        id,
        isActive: true,
      },
      include: {
        inventory: {
          where: {
            category: "FOOD",
            quantity: {
              gt: 0,
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
        },
      },
    });

    if (!foodPoint) {
      return c.json(
        {
          success: false,
          message: "Food distribution location not found.",
        },
        404,
      );
    }

    return c.json({
      success: true,
      data: foodPoint,
    });
  } catch (error) {
    console.error("Failed to retrieve food location:", error);

    return c.json(
      {
        success: false,
        message: "Failed to retrieve food location.",
      },
      500,
    );
  }
});

export default foodRoute;

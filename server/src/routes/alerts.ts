import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";

const alertsRoute = new Hono();

// GET /api/alerts
// GET /api/alerts?districtId=bhola

alertsRoute.get("/", async (c) => {
  try {
    const districtId = c.req.query("districtId");

    const alerts = await prisma.disasterAlert.findMany({
      where: {
        status: "ACTIVE",

        ...(districtId
          ? {
              districtIds: {
                has: districtId.toLowerCase(),
              },
            }
          : {}),

        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: {
        issuedAt: "desc",
      },
    });

    return c.json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (error) {
    console.error("Failed to fetch disaster alerts:", error);

    return c.json(
      {
        success: false,
        message: "Failed to retrieve disaster alerts.",
      },
      500,
    );
  }
});

export default alertsRoute;

import { Hono } from "hono";
import { verify } from "hono/jwt";
import { prisma } from "../lib/prisma.js";

const adminRoute = new Hono();

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return secret;
}

// GET /api/admin/stats
// Only authenticated ADMIN accounts can access this endpoint.
adminRoute.get("/stats", async (c) => {
  try {
    const authorization = c.req.header("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return c.json(
        {
          success: false,
          message: "Authentication required.",
        },
        401,
      );
    }

    const token = authorization.slice("Bearer ".length);
    const payload = await verify(token, getJwtSecret(), "HS256");

    if (payload.role !== "ADMIN") {
      return c.json(
        {
          success: false,
          message: "You are not authorized to access this resource.",
        },
        403,
      );
    }

    const now = new Date();

    const [humanShelters, foodPoints, animalShelters, activeAlerts] =
      await Promise.all([
        prisma.shelter.count({
          where: {
            isActive: true,
          },
        }),

        prisma.reliefPoint.count({
          where: {
            isActive: true,
          },
        }),

        prisma.animalShelter.count({
          where: {
            isActive: true,
          },
        }),

        prisma.disasterAlert.count({
          where: {
            status: "ACTIVE",
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        }),
      ]);

    return c.json({
      success: true,
      data: {
        humanShelters,
        foodPoints,
        animalShelters,
        activeAlerts,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);

    return c.json(
      {
        success: false,
        message: "Invalid or expired session.",
      },
      401,
    );
  }
});

export default adminRoute;

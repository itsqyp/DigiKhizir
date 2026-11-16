import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";

const sheltersRoute = new Hono();

// Calculate distance between two geographical coordinates (km).
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const earthRadius = 6371;

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const latitudeDifference = toRadians(lat2 - lat1);
  const longitudeDifference = toRadians(lon2 - lon1);

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(longitudeDifference / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

// GET /api/shelters
// GET /api/shelters?districtId=bhola
// GET /api/shelters?latitude=22.6859&longitude=90.6482
// GET /api/shelters?districtId=bhola&latitude=22.6859&longitude=90.6482
// Optional: &limit=10

sheltersRoute.get("/", async (c) => {
  try {
    const districtId = c.req.query("districtId")?.trim();

    const latitudeQuery = c.req.query("latitude");
    const longitudeQuery = c.req.query("longitude");
    const limitQuery = c.req.query("limit");

    // Validate coordinates.
    if ((latitudeQuery === undefined) !== (longitudeQuery === undefined)) {
      return c.json(
        {
          success: false,
          message: "Both latitude and longitude are required.",
        },
        400,
      );
    }

    let latitude: number | undefined;
    let longitude: number | undefined;

    if (latitudeQuery !== undefined && longitudeQuery !== undefined) {
      latitude = Number(latitudeQuery);
      longitude = Number(longitudeQuery);

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        return c.json(
          {
            success: false,
            message: "Invalid latitude or longitude.",
          },
          400,
        );
      }
    }

    // Validate result limit.
    let limit = 20;

    if (limitQuery !== undefined) {
      limit = Number(limitQuery);

      if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
        return c.json(
          {
            success: false,
            message: "Limit must be an integer between 1 and 50.",
          },
          400,
        );
      }
    }

    const shelters = await prisma.shelter.findMany({
      where: {
        isActive: true,
        ...(districtId ? { districtId: districtId.toLowerCase() } : {}),
      },
      include: {
        facilities: {
          select: {
            id: true,
            name: true,
            nameBn: true,
            available: true,
          },
        },
      },
    });

    // If coordinates are supplied, calculate distance and sort nearest first.
    if (latitude !== undefined && longitude !== undefined) {
      const nearbyShelters = shelters
        .map((shelter) => ({
          ...shelter,
          distanceKm: Number(
            calculateDistance(
              latitude,
              longitude,
              shelter.latitude,
              shelter.longitude,
            ).toFixed(2),
          ),
          capacityRemaining:
            shelter.occupancy === null
              ? null
              : Math.max(0, shelter.capacity - shelter.occupancy),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, limit);

      return c.json({
        success: true,
        count: nearbyShelters.length,
        sortBy: "distance",
        data: nearbyShelters,
      });
    }

    const results = shelters.slice(0, limit).map((shelter) => ({
      ...shelter,
      capacityRemaining:
        shelter.occupancy === null
          ? null
          : Math.max(0, shelter.capacity - shelter.occupancy),
    }));

    return c.json({
      success: true,
      count: results.length,
      sortBy: "default",
      data: results,
    });
  } catch (error) {
    console.error("Failed to fetch shelters:", error);

    return c.json(
      {
        success: false,
        message: "Failed to retrieve shelters.",
      },
      500,
    );
  }
});

export default sheltersRoute;

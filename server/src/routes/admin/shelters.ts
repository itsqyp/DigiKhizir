import { Hono, type Context } from "hono";
import { verify } from "hono/jwt";
import { prisma } from "../../lib/prisma.js";

const adminSheltersRoute = new Hono();

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return secret;
}

// Verify admin authentication.
async function isAdmin(c: Context): Promise<boolean> {
  const authorization = c.req.header("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return false;
  }

  try {
    const token = authorization.slice(7);
    const payload = await verify(token, getJwtSecret(), "HS256");

    return payload.role === "ADMIN";
  } catch {
    return false;
  }
}

interface FacilityInput {
  name: string;
  nameBn: string | null;
  available: boolean;
}

// Validate and parse shelter facilities.
function parseFacilities(value: unknown): FacilityInput[] | null {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    return null;
  }

  const facilities: FacilityInput[] = [];

  for (const item of value) {
    if (
      typeof item !== "object" ||
      item === null ||
      !("name" in item) ||
      typeof item.name !== "string" ||
      !item.name.trim()
    ) {
      return null;
    }

    const nameBn =
      "nameBn" in item && typeof item.nameBn === "string"
        ? item.nameBn.trim() || null
        : null;

    const available =
      "available" in item && typeof item.available === "boolean"
        ? item.available
        : true;

    facilities.push({
      name: item.name.trim(),
      nameBn,
      available,
    });
  }

  return facilities;
}

interface ShelterInput {
  name: string;
  nameBn: string | null;
  address: string;
  districtId: string;
  latitude: number;
  longitude: number;
  capacity: number;
  occupancy: number | null;
}

interface ShelterValidation {
  error?: string;
  data?: ShelterInput;
}

// Validate shelter information.
function validateShelterFields(
  body: Record<string, unknown>,
): ShelterValidation {
  const name = typeof body.name === "string" ? body.name.trim() : "";

  const address = typeof body.address === "string" ? body.address.trim() : "";

  const districtId =
    typeof body.districtId === "string"
      ? body.districtId.trim().toLowerCase()
      : "";

  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);
  const capacity = Number(body.capacity);

  const occupancy =
    body.occupancy === null ||
    body.occupancy === undefined ||
    body.occupancy === ""
      ? null
      : Number(body.occupancy);

  const nameBn =
    typeof body.nameBn === "string" ? body.nameBn.trim() || null : null;

  if (!name || !address || !districtId) {
    return {
      error: "Name, address, and district are required.",
    };
  }

  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return {
      error: "Please provide valid latitude and longitude values.",
    };
  }

  if (!Number.isInteger(capacity) || capacity < 1) {
    return {
      error: "Capacity must be a positive whole number.",
    };
  }

  if (
    occupancy !== null &&
    (!Number.isInteger(occupancy) || occupancy < 0 || occupancy > capacity)
  ) {
    return {
      error: "Occupancy must be between 0 and the shelter capacity.",
    };
  }

  return {
    data: {
      name,
      nameBn,
      address,
      districtId,
      latitude,
      longitude,
      capacity,
      occupancy,
    },
  };
}

// GET /api/admin/shelters
// Optional: ?districtId=bhola
// Optional: ?status=active | inactive | all

adminSheltersRoute.get("/", async (c) => {
  if (!(await isAdmin(c))) {
    return c.json(
      {
        success: false,
        message: "Unauthorized. Admin access required.",
      },
      401,
    );
  }

  try {
    const districtId = c.req.query("districtId")?.trim().toLowerCase();
    const status = c.req.query("status") ?? "all";

    if (!["active", "inactive", "all"].includes(status)) {
      return c.json(
        {
          success: false,
          message: "Status must be active, inactive, or all.",
        },
        400,
      );
    }

    const shelters = await prisma.shelter.findMany({
      where: {
        ...(districtId ? { districtId } : {}),
        ...(status === "active" ? { isActive: true } : {}),
        ...(status === "inactive" ? { isActive: false } : {}),
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
      orderBy: {
        createdAt: "desc",
      },
    });

    const data = shelters.map((shelter) => ({
      ...shelter,
      capacityRemaining:
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
    console.error("Failed to fetch admin shelters:", error);

    return c.json(
      {
        success: false,
        message: "Failed to retrieve shelters.",
      },
      500,
    );
  }
});

// POST /api/admin/shelters

adminSheltersRoute.post("/", async (c) => {
  if (!(await isAdmin(c))) {
    return c.json(
      {
        success: false,
        message: "Unauthorized. Admin access required.",
      },
      401,
    );
  }

  try {
    const body = await c.req.json<Record<string, unknown>>();
    const validation = validateShelterFields(body);

    if (validation.error || !validation.data) {
      return c.json(
        {
          success: false,
          message: validation.error ?? "Invalid shelter information.",
        },
        400,
      );
    }

    const facilities = parseFacilities(body.facilities);

    if (!facilities) {
      return c.json(
        {
          success: false,
          message: "Invalid facilities information.",
        },
        400,
      );
    }

    const shelter = await prisma.shelter.create({
      data: {
        ...validation.data,
        isActive: typeof body.isActive === "boolean" ? body.isActive : true,
        facilities: {
          create: facilities,
        },
      },
      include: {
        facilities: true,
      },
    });

    return c.json(
      {
        success: true,
        message: "Shelter created successfully.",
        data: shelter,
      },
      201,
    );
  } catch (error) {
    console.error("Failed to create shelter:", error);

    return c.json(
      {
        success: false,
        message: "Failed to create shelter.",
      },
      500,
    );
  }
});

// PUT /api/admin/shelters/:id

adminSheltersRoute.put("/:id", async (c) => {
  if (!(await isAdmin(c))) {
    return c.json(
      {
        success: false,
        message: "Unauthorized. Admin access required.",
      },
      401,
    );
  }

  try {
    const id = c.req.param("id");
    const body = await c.req.json<Record<string, unknown>>();

    const validation = validateShelterFields(body);

    if (validation.error || !validation.data) {
      return c.json(
        {
          success: false,
          message: validation.error ?? "Invalid shelter information.",
        },
        400,
      );
    }

    const existingShelter = await prisma.shelter.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingShelter) {
      return c.json(
        {
          success: false,
          message: "Shelter not found.",
        },
        404,
      );
    }

    const facilities = parseFacilities(body.facilities);

    if (!facilities) {
      return c.json(
        {
          success: false,
          message: "Invalid facilities information.",
        },
        400,
      );
    }

    const shelter = await prisma.shelter.update({
      where: { id },
      data: {
        ...validation.data,

        ...(typeof body.isActive === "boolean"
          ? { isActive: body.isActive }
          : {}),

        ...(body.facilities !== undefined
          ? {
              facilities: {
                deleteMany: {},
                create: facilities,
              },
            }
          : {}),
      },
      include: {
        facilities: true,
      },
    });

    return c.json({
      success: true,
      message: "Shelter updated successfully.",
      data: shelter,
    });
  } catch (error) {
    console.error("Failed to update shelter:", error);

    return c.json(
      {
        success: false,
        message: "Failed to update shelter.",
      },
      500,
    );
  }
});

// PATCH /api/admin/shelters/:id/status

adminSheltersRoute.patch("/:id/status", async (c) => {
  if (!(await isAdmin(c))) {
    return c.json(
      {
        success: false,
        message: "Unauthorized. Admin access required.",
      },
      401,
    );
  }

  try {
    const id = c.req.param("id");
    const body = await c.req.json<{ isActive?: boolean }>();

    if (typeof body.isActive !== "boolean") {
      return c.json(
        {
          success: false,
          message: "isActive must be a boolean.",
        },
        400,
      );
    }

    const shelter = await prisma.shelter.update({
      where: { id },
      data: {
        isActive: body.isActive,
      },
    });

    return c.json({
      success: true,
      message: body.isActive
        ? "Shelter activated successfully."
        : "Shelter deactivated successfully.",
      data: shelter,
    });
  } catch (error) {
    console.error("Failed to update shelter status:", error);

    return c.json(
      {
        success: false,
        message: "Shelter not found or update failed.",
      },
      404,
    );
  }
});

// DELETE /api/admin/shelters/:id

adminSheltersRoute.delete("/:id", async (c) => {
  if (!(await isAdmin(c))) {
    return c.json(
      {
        success: false,
        message: "Unauthorized. Admin access required.",
      },
      401,
    );
  }

  try {
    const id = c.req.param("id");

    await prisma.shelter.delete({
      where: { id },
    });

    return c.json({
      success: true,
      message: "Shelter deleted successfully.",
    });
  } catch (error) {
    console.error("Failed to delete shelter:", error);

    return c.json(
      {
        success: false,
        message: "Shelter not found or deletion failed.",
      },
      404,
    );
  }
});

export default adminSheltersRoute;

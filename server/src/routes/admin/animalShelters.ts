import { Hono, type Context } from "hono";
import { verify } from "hono/jwt";
import { prisma } from "../../lib/prisma.js";

const adminAnimalSheltersRoute = new Hono();

const animalTypes = ["PET", "LIVESTOCK", "POULTRY", "OTHER"] as const;

type AnimalTypeValue = (typeof animalTypes)[number];

type FacilityInput = {
  name?: string;
  nameBn?: string | null;
  available?: boolean;
};

type AnimalShelterInput = {
  name?: string;
  nameBn?: string | null;
  address?: string;
  districtId?: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  occupancy?: number | null;
  animalTypes?: string[];
  contactName?: string | null;
  contactPhone?: string | null;
  facilities?: FacilityInput[];
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return secret;
}

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

function validateAnimalTypes(types: unknown): types is string[] {
  return (
    Array.isArray(types) &&
    types.length > 0 &&
    types.every(
      (type) =>
        typeof type === "string" &&
        animalTypes.includes(type as AnimalTypeValue),
    ) &&
    new Set(types).size === types.length
  );
}

function validateFacilities(
  facilities: unknown,
): facilities is FacilityInput[] {
  return (
    Array.isArray(facilities) &&
    facilities.every(
      (facility) =>
        facility !== null &&
        typeof facility === "object" &&
        typeof facility.name === "string" &&
        facility.name.trim().length > 0 &&
        (facility.nameBn === undefined ||
          facility.nameBn === null ||
          typeof facility.nameBn === "string") &&
        (facility.available === undefined ||
          typeof facility.available === "boolean"),
    )
  );
}

function validateShelterFields(
  body: AnimalShelterInput,
  partial = false,
): string | null {
  if (!partial || body.name !== undefined) {
    if (!body.name?.trim()) {
      return "Shelter name is required.";
    }
  }

  if (!partial || body.address !== undefined) {
    if (!body.address?.trim()) {
      return "Address is required.";
    }
  }

  if (!partial || body.districtId !== undefined) {
    if (!body.districtId?.trim()) {
      return "District is required.";
    }
  }

  if (
    body.latitude !== undefined &&
    (!Number.isFinite(body.latitude) ||
      body.latitude < -90 ||
      body.latitude > 90)
  ) {
    return "Latitude must be between -90 and 90.";
  }

  if (
    body.longitude !== undefined &&
    (!Number.isFinite(body.longitude) ||
      body.longitude < -180 ||
      body.longitude > 180)
  ) {
    return "Longitude must be between -180 and 180.";
  }

  if (
    (!partial || body.capacity !== undefined) &&
    (body.capacity === undefined ||
      !Number.isInteger(body.capacity) ||
      body.capacity < 0)
  ) {
    return "Capacity must be a non-negative integer.";
  }

  if (
    body.occupancy !== undefined &&
    body.occupancy !== null &&
    (!Number.isInteger(body.occupancy) || body.occupancy < 0)
  ) {
    return "Occupancy must be a non-negative integer.";
  }

  if (
    body.capacity !== undefined &&
    body.occupancy !== undefined &&
    body.occupancy !== null &&
    body.occupancy > body.capacity
  ) {
    return "Occupancy cannot exceed capacity.";
  }

  if (
    body.animalTypes !== undefined &&
    !validateAnimalTypes(body.animalTypes)
  ) {
    return "Select at least one valid animal type.";
  }

  if (body.facilities !== undefined && !validateFacilities(body.facilities)) {
    return "Each facility must have a name and valid details.";
  }

  return null;
}

// GET /api/admin/animal-shelters
// GET /api/admin/animal-shelters?districtId=bhola
// GET /api/admin/animal-shelters?status=active
// GET /api/admin/animal-shelters?animalType=LIVESTOCK

adminAnimalSheltersRoute.get("/", async (c) => {
  if (!(await isAdmin(c))) {
    return c.json({ success: false, message: "Unauthorized." }, 401);
  }

  try {
    const districtId = c.req.query("districtId")?.toLowerCase();
    const status = c.req.query("status") ?? "all";
    const animalType = c.req.query("animalType")?.toUpperCase();

    if (!["all", "active", "inactive"].includes(status)) {
      return c.json({ success: false, message: "Invalid status filter." }, 400);
    }

    if (animalType && !animalTypes.includes(animalType as AnimalTypeValue)) {
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
        ...(districtId ? { districtId } : {}),
        ...(status === "active" ? { isActive: true } : {}),
        ...(status === "inactive" ? { isActive: false } : {}),
        ...(animalType
          ? { animalTypes: { has: animalType as AnimalTypeValue } }
          : {}),
      },
      include: {
        facilities: {
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
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
    console.error("Failed to retrieve admin animal shelters:", error);

    return c.json(
      { success: false, message: "Failed to retrieve animal shelters." },
      500,
    );
  }
});

// POST /api/admin/animal-shelters

adminAnimalSheltersRoute.post("/", async (c) => {
  if (!(await isAdmin(c))) {
    return c.json({ success: false, message: "Unauthorized." }, 401);
  }

  try {
    const body = await c.req.json<AnimalShelterInput>();

    const validationError = validateShelterFields(body);

    if (validationError) {
      return c.json({ success: false, message: validationError }, 400);
    }

    const shelter = await prisma.animalShelter.create({
      data: {
        name: body.name!.trim(),
        nameBn: body.nameBn?.trim() || null,
        address: body.address!.trim(),
        districtId: body.districtId!.trim().toLowerCase(),
        latitude: body.latitude!,
        longitude: body.longitude!,
        capacity: body.capacity!,
        occupancy: body.occupancy ?? null,
        animalTypes: body.animalTypes as AnimalTypeValue[],
        contactName: body.contactName?.trim() || null,
        contactPhone: body.contactPhone?.trim() || null,
        facilities: {
          create: (body.facilities ?? []).map((facility) => ({
            name: facility.name!.trim(),
            nameBn: facility.nameBn?.trim() || null,
            available: facility.available ?? true,
          })),
        },
      },
      include: {
        facilities: true,
      },
    });

    return c.json(
      {
        success: true,
        message: "Animal shelter created successfully.",
        data: {
          ...shelter,
          availableCapacity:
            shelter.occupancy === null
              ? null
              : Math.max(0, shelter.capacity - shelter.occupancy),
        },
      },
      201,
    );
  } catch (error) {
    console.error("Failed to create animal shelter:", error);

    return c.json(
      { success: false, message: "Failed to create animal shelter." },
      500,
    );
  }
});

// PUT /api/admin/animal-shelters/:id

adminAnimalSheltersRoute.put("/:id", async (c) => {
  if (!(await isAdmin(c))) {
    return c.json({ success: false, message: "Unauthorized." }, 401);
  }

  try {
    const { id } = c.req.param();
    const body = await c.req.json<AnimalShelterInput>();

    const validationError = validateShelterFields(body, true);

    if (validationError) {
      return c.json({ success: false, message: validationError }, 400);
    }

    const existing = await prisma.animalShelter.findUnique({
      where: { id },
    });

    if (!existing) {
      return c.json(
        { success: false, message: "Animal shelter not found." },
        404,
      );
    }

    const nextCapacity = body.capacity ?? existing.capacity;
    const nextOccupancy =
      body.occupancy !== undefined ? body.occupancy : existing.occupancy;

    if (nextOccupancy !== null && nextOccupancy > nextCapacity) {
      return c.json(
        { success: false, message: "Occupancy cannot exceed capacity." },
        400,
      );
    }

    const shelter = await prisma.animalShelter.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.nameBn !== undefined && {
          nameBn: body.nameBn?.trim() || null,
        }),
        ...(body.address !== undefined && {
          address: body.address.trim(),
        }),
        ...(body.districtId !== undefined && {
          districtId: body.districtId.trim().toLowerCase(),
        }),
        ...(body.latitude !== undefined && { latitude: body.latitude }),
        ...(body.longitude !== undefined && { longitude: body.longitude }),
        ...(body.capacity !== undefined && { capacity: body.capacity }),
        ...(body.occupancy !== undefined && {
          occupancy: body.occupancy,
        }),
        ...(body.animalTypes !== undefined && {
          animalTypes: body.animalTypes as AnimalTypeValue[],
        }),
        ...(body.contactName !== undefined && {
          contactName: body.contactName?.trim() || null,
        }),
        ...(body.contactPhone !== undefined && {
          contactPhone: body.contactPhone?.trim() || null,
        }),
        ...(body.facilities !== undefined && {
          facilities: {
            deleteMany: {},
            create: body.facilities.map((facility) => ({
              name: facility.name!.trim(),
              nameBn: facility.nameBn?.trim() || null,
              available: facility.available ?? true,
            })),
          },
        }),
      },
      include: {
        facilities: true,
      },
    });

    return c.json({
      success: true,
      message: "Animal shelter updated successfully.",
      data: {
        ...shelter,
        availableCapacity:
          shelter.occupancy === null
            ? null
            : Math.max(0, shelter.capacity - shelter.occupancy),
      },
    });
  } catch (error) {
    console.error("Failed to update animal shelter:", error);

    return c.json(
      { success: false, message: "Failed to update animal shelter." },
      500,
    );
  }
});

// PATCH /api/admin/animal-shelters/:id/status

adminAnimalSheltersRoute.patch("/:id/status", async (c) => {
  if (!(await isAdmin(c))) {
    return c.json({ success: false, message: "Unauthorized." }, 401);
  }

  try {
    const { id } = c.req.param();
    const body = await c.req.json<{ isActive?: boolean }>();

    if (typeof body.isActive !== "boolean") {
      return c.json(
        { success: false, message: "A valid isActive value is required." },
        400,
      );
    }

    const shelter = await prisma.animalShelter.update({
      where: { id },
      data: { isActive: body.isActive },
    });

    return c.json({
      success: true,
      message: `Animal shelter ${body.isActive ? "activated" : "deactivated"} successfully.`,
      data: shelter,
    });
  } catch (error) {
    console.error("Failed to update animal shelter status:", error);

    return c.json(
      { success: false, message: "Failed to update animal shelter status." },
      500,
    );
  }
});

// DELETE /api/admin/animal-shelters/:id

adminAnimalSheltersRoute.delete("/:id", async (c) => {
  if (!(await isAdmin(c))) {
    return c.json({ success: false, message: "Unauthorized." }, 401);
  }

  try {
    const { id } = c.req.param();

    await prisma.animalShelter.delete({
      where: { id },
    });

    return c.json({
      success: true,
      message: "Animal shelter deleted successfully.",
    });
  } catch (error) {
    console.error("Failed to delete animal shelter:", error);

    return c.json(
      { success: false, message: "Failed to delete animal shelter." },
      500,
    );
  }
});

// POST /api/admin/animal-shelters/:id/facilities

adminAnimalSheltersRoute.post("/:id/facilities", async (c) => {
  if (!(await isAdmin(c))) {
    return c.json({ success: false, message: "Unauthorized." }, 401);
  }

  try {
    const { id } = c.req.param();
    const body = await c.req.json<FacilityInput>();

    if (!body.name?.trim()) {
      return c.json(
        { success: false, message: "Facility name is required." },
        400,
      );
    }

    const shelter = await prisma.animalShelter.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!shelter) {
      return c.json(
        { success: false, message: "Animal shelter not found." },
        404,
      );
    }

    const facility = await prisma.animalShelterFacility.create({
      data: {
        animalShelterId: id,
        name: body.name.trim(),
        nameBn: body.nameBn?.trim() || null,
        available: body.available ?? true,
      },
    });

    return c.json(
      {
        success: true,
        message: "Facility added successfully.",
        data: facility,
      },
      201,
    );
  } catch (error) {
    console.error("Failed to add animal shelter facility:", error);

    return c.json({ success: false, message: "Failed to add facility." }, 500);
  }
});

// PUT /api/admin/animal-shelters/:id/facilities/:facilityId

adminAnimalSheltersRoute.put("/:id/facilities/:facilityId", async (c) => {
  if (!(await isAdmin(c))) {
    return c.json({ success: false, message: "Unauthorized." }, 401);
  }

  try {
    const { id, facilityId } = c.req.param();
    const body = await c.req.json<FacilityInput>();

    if (body.name !== undefined && !body.name.trim()) {
      return c.json(
        { success: false, message: "Facility name cannot be empty." },
        400,
      );
    }

    if (body.available !== undefined && typeof body.available !== "boolean") {
      return c.json(
        { success: false, message: "Invalid facility availability." },
        400,
      );
    }

    const existing = await prisma.animalShelterFacility.findFirst({
      where: {
        id: facilityId,
        animalShelterId: id,
      },
    });

    if (!existing) {
      return c.json({ success: false, message: "Facility not found." }, 404);
    }

    const facility = await prisma.animalShelterFacility.update({
      where: { id: facilityId },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.nameBn !== undefined && {
          nameBn: body.nameBn?.trim() || null,
        }),
        ...(body.available !== undefined && {
          available: body.available,
        }),
      },
    });

    return c.json({
      success: true,
      message: "Facility updated successfully.",
      data: facility,
    });
  } catch (error) {
    console.error("Failed to update facility:", error);

    return c.json(
      { success: false, message: "Failed to update facility." },
      500,
    );
  }
});

// DELETE /api/admin/animal-shelters/:id/facilities/:facilityId

adminAnimalSheltersRoute.delete("/:id/facilities/:facilityId", async (c) => {
  if (!(await isAdmin(c))) {
    return c.json({ success: false, message: "Unauthorized." }, 401);
  }

  try {
    const { id, facilityId } = c.req.param();

    const existing = await prisma.animalShelterFacility.findFirst({
      where: {
        id: facilityId,
        animalShelterId: id,
      },
    });

    if (!existing) {
      return c.json({ success: false, message: "Facility not found." }, 404);
    }

    await prisma.animalShelterFacility.delete({
      where: { id: facilityId },
    });

    return c.json({
      success: true,
      message: "Facility deleted successfully.",
    });
  } catch (error) {
    console.error("Failed to delete facility:", error);

    return c.json(
      { success: false, message: "Failed to delete facility." },
      500,
    );
  }
});

export default adminAnimalSheltersRoute;

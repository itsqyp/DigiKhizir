import { Hono, type Context } from "hono";
import { verify } from "hono/jwt";
import { prisma } from "../../lib/prisma.js";

const adminFoodRoute = new Hono();

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

const validCategories = [
  "FOOD",
  "WATER",
  "MEDICINE",
  "CLOTHING",
  "OTHER",
] as const;

type InventoryInput = {
  category?: string;
  itemName?: string;
  itemNameBn?: string | null;
  quantity?: number;
  unit?: string;
};

function validateInventory(item: InventoryInput): string | null {
  if (
    !item.category ||
    !validCategories.includes(item.category as (typeof validCategories)[number])
  ) {
    return "A valid inventory category is required.";
  }

  if (!item.itemName?.trim()) {
    return "Item name is required.";
  }

  if (
    !Number.isInteger(item.quantity) ||
    item.quantity === undefined ||
    item.quantity < 0
  ) {
    return "Quantity must be a non-negative integer.";
  }

  if (!item.unit?.trim()) {
    return "Unit is required.";
  }

  return null;
}

// GET /api/admin/food
// GET /api/admin/food?districtId=bhola
// GET /api/admin/food?status=active

adminFoodRoute.get("/", async (c) => {
  if (!(await isAdmin(c))) {
    return c.json({ success: false, message: "Unauthorized." }, 401);
  }

  try {
    const districtId = c.req.query("districtId")?.toLowerCase();
    const status = c.req.query("status") ?? "all";

    if (!["all", "active", "inactive"].includes(status)) {
      return c.json({ success: false, message: "Invalid status filter." }, 400);
    }

    const foodPoints = await prisma.reliefPoint.findMany({
      where: {
        ...(districtId ? { districtId } : {}),
        ...(status === "active" ? { isActive: true } : {}),
        ...(status === "inactive" ? { isActive: false } : {}),
      },
      include: {
        inventory: {
          orderBy: { updatedAt: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return c.json({
      success: true,
      count: foodPoints.length,
      data: foodPoints,
    });
  } catch (error) {
    console.error("Failed to retrieve admin food points:", error);

    return c.json(
      { success: false, message: "Failed to retrieve food points." },
      500,
    );
  }
});

// POST /api/admin/food

adminFoodRoute.post("/", async (c) => {
  if (!(await isAdmin(c))) {
    return c.json({ success: false, message: "Unauthorized." }, 401);
  }

  try {
    const body = await c.req.json<{
      name?: string;
      nameBn?: string;
      address?: string;
      districtId?: string;
      latitude?: number;
      longitude?: number;
      contactPhone?: string;
      dryFoodCapacityKg?: number | null;
      dryFoodStockKg?: number | null;
      inventory?: InventoryInput[];
    }>();

    if (
      !body.name?.trim() ||
      !body.address?.trim() ||
      !body.districtId?.trim()
    ) {
      return c.json(
        {
          success: false,
          message: "Name, address, and district are required.",
        },
        400,
      );
    }

    if (
      typeof body.latitude !== "number" ||
      !Number.isFinite(body.latitude) ||
      body.latitude < -90 ||
      body.latitude > 90 ||
      typeof body.longitude !== "number" ||
      !Number.isFinite(body.longitude) ||
      body.longitude < -180 ||
      body.longitude > 180
    ) {
      return c.json(
        { success: false, message: "Valid coordinates are required." },
        400,
      );
    }

    if (
      (body.dryFoodCapacityKg != null &&
        (!Number.isInteger(body.dryFoodCapacityKg) ||
          body.dryFoodCapacityKg < 0)) ||
      (body.dryFoodStockKg != null &&
        (!Number.isInteger(body.dryFoodStockKg) || body.dryFoodStockKg < 0))
    ) {
      return c.json(
        {
          success: false,
          message: "Dry food quantities must be non-negative integers.",
        },
        400,
      );
    }

    if (
      body.dryFoodCapacityKg != null &&
      body.dryFoodStockKg != null &&
      body.dryFoodStockKg > body.dryFoodCapacityKg
    ) {
      return c.json(
        { success: false, message: "Dry food stock cannot exceed capacity." },
        400,
      );
    }

    const inventory = body.inventory ?? [];

    if (!Array.isArray(inventory)) {
      return c.json(
        { success: false, message: "Inventory must be an array." },
        400,
      );
    }

    for (const item of inventory) {
      const validationError = validateInventory(item);

      if (validationError) {
        return c.json({ success: false, message: validationError }, 400);
      }
    }

    const foodPoint = await prisma.reliefPoint.create({
      data: {
        name: body.name.trim(),
        nameBn: body.nameBn?.trim() || null,
        address: body.address.trim(),
        districtId: body.districtId.trim().toLowerCase(),
        latitude: body.latitude,
        longitude: body.longitude,
        contactPhone: body.contactPhone?.trim() || null,
        dryFoodCapacityKg: body.dryFoodCapacityKg ?? null,
        dryFoodStockKg: body.dryFoodStockKg ?? null,
        inventory: {
          create: inventory.map((item) => ({
            category: item.category as (typeof validCategories)[number],
            itemName: item.itemName!.trim(),
            itemNameBn: item.itemNameBn?.trim() || null,
            quantity: item.quantity!,
            unit: item.unit!.trim(),
          })),
        },
      },
      include: { inventory: true },
    });

    return c.json(
      {
        success: true,
        message: "Food distribution point created successfully.",
        data: foodPoint,
      },
      201,
    );
  } catch (error) {
    console.error("Failed to create food point:", error);

    return c.json(
      { success: false, message: "Failed to create food point." },
      500,
    );
  }
});

// PUT /api/admin/food/:id

adminFoodRoute.put("/:id", async (c) => {
  if (!(await isAdmin(c))) {
    return c.json({ success: false, message: "Unauthorized." }, 401);
  }

  try {
    const { id } = c.req.param();

    const body = await c.req.json<{
      name?: string;
      nameBn?: string | null;
      address?: string;
      districtId?: string;
      latitude?: number;
      longitude?: number;
      contactPhone?: string | null;
      dryFoodCapacityKg?: number | null;
      dryFoodStockKg?: number | null;
    }>();

    const existing = await prisma.reliefPoint.findUnique({
      where: { id },
    });

    if (!existing) {
      return c.json({ success: false, message: "Food point not found." }, 404);
    }

    const capacity =
      body.dryFoodCapacityKg !== undefined
        ? body.dryFoodCapacityKg
        : existing.dryFoodCapacityKg;

    const stock =
      body.dryFoodStockKg !== undefined
        ? body.dryFoodStockKg
        : existing.dryFoodStockKg;

    if (
      (capacity !== null &&
        capacity !== undefined &&
        (!Number.isInteger(capacity) || capacity < 0)) ||
      (stock !== null &&
        stock !== undefined &&
        (!Number.isInteger(stock) || stock < 0))
    ) {
      return c.json(
        {
          success: false,
          message: "Dry food quantities must be non-negative integers.",
        },
        400,
      );
    }

    if (
      capacity !== null &&
      capacity !== undefined &&
      stock !== null &&
      stock !== undefined &&
      stock > capacity
    ) {
      return c.json(
        { success: false, message: "Dry food stock cannot exceed capacity." },
        400,
      );
    }

    if (
      (body.latitude !== undefined &&
        (!Number.isFinite(body.latitude) ||
          body.latitude < -90 ||
          body.latitude > 90)) ||
      (body.longitude !== undefined &&
        (!Number.isFinite(body.longitude) ||
          body.longitude < -180 ||
          body.longitude > 180))
    ) {
      return c.json({ success: false, message: "Invalid coordinates." }, 400);
    }

    const foodPoint = await prisma.reliefPoint.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.nameBn !== undefined && {
          nameBn: body.nameBn?.trim() || null,
        }),
        ...(body.address !== undefined && { address: body.address.trim() }),
        ...(body.districtId !== undefined && {
          districtId: body.districtId.trim().toLowerCase(),
        }),
        ...(body.latitude !== undefined && { latitude: body.latitude }),
        ...(body.longitude !== undefined && { longitude: body.longitude }),
        ...(body.contactPhone !== undefined && {
          contactPhone: body.contactPhone?.trim() || null,
        }),
        ...(body.dryFoodCapacityKg !== undefined && {
          dryFoodCapacityKg: body.dryFoodCapacityKg,
        }),
        ...(body.dryFoodStockKg !== undefined && {
          dryFoodStockKg: body.dryFoodStockKg,
        }),
      },
      include: { inventory: true },
    });

    return c.json({
      success: true,
      message: "Food distribution point updated successfully.",
      data: foodPoint,
    });
  } catch (error) {
    console.error("Failed to update food point:", error);

    return c.json(
      { success: false, message: "Failed to update food point." },
      500,
    );
  }
});

// PATCH /api/admin/food/:id/status

adminFoodRoute.patch("/:id/status", async (c) => {
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

    const foodPoint = await prisma.reliefPoint.update({
      where: { id },
      data: { isActive: body.isActive },
    });

    return c.json({
      success: true,
      message: `Food point ${body.isActive ? "activated" : "deactivated"} successfully.`,
      data: foodPoint,
    });
  } catch (error) {
    console.error("Failed to update food point status:", error);

    return c.json(
      { success: false, message: "Failed to update food point status." },
      500,
    );
  }
});

// DELETE /api/admin/food/:id

adminFoodRoute.delete("/:id", async (c) => {
  if (!(await isAdmin(c))) {
    return c.json({ success: false, message: "Unauthorized." }, 401);
  }

  try {
    const { id } = c.req.param();

    await prisma.reliefPoint.delete({
      where: { id },
    });

    return c.json({
      success: true,
      message: "Food distribution point deleted successfully.",
    });
  } catch (error) {
    console.error("Failed to delete food point:", error);

    return c.json(
      { success: false, message: "Failed to delete food point." },
      500,
    );
  }
});

// POST /api/admin/food/:id/inventory

adminFoodRoute.post("/:id/inventory", async (c) => {
  if (!(await isAdmin(c))) {
    return c.json({ success: false, message: "Unauthorized." }, 401);
  }

  try {
    const { id } = c.req.param();
    const body = await c.req.json<InventoryInput>();

    const validationError = validateInventory(body);

    if (validationError) {
      return c.json({ success: false, message: validationError }, 400);
    }

    const point = await prisma.reliefPoint.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!point) {
      return c.json({ success: false, message: "Food point not found." }, 404);
    }

    const item = await prisma.reliefInventory.create({
      data: {
        reliefPointId: id,
        category: body.category as (typeof validCategories)[number],
        itemName: body.itemName!.trim(),
        itemNameBn: body.itemNameBn?.trim() || null,
        quantity: body.quantity!,
        unit: body.unit!.trim(),
      },
    });

    return c.json(
      {
        success: true,
        message: "Inventory item added successfully.",
        data: item,
      },
      201,
    );
  } catch (error) {
    console.error("Failed to add inventory item:", error);

    return c.json(
      { success: false, message: "Failed to add inventory item." },
      500,
    );
  }
});

// PUT /api/admin/food/:id/inventory/:itemId

adminFoodRoute.put("/:id/inventory/:itemId", async (c) => {
  if (!(await isAdmin(c))) {
    return c.json({ success: false, message: "Unauthorized." }, 401);
  }

  try {
    const { id, itemId } = c.req.param();
    const body = await c.req.json<InventoryInput>();

    const validationError = validateInventory(body);

    if (validationError) {
      return c.json({ success: false, message: validationError }, 400);
    }

    const existing = await prisma.reliefInventory.findFirst({
      where: {
        id: itemId,
        reliefPointId: id,
      },
    });

    if (!existing) {
      return c.json(
        { success: false, message: "Inventory item not found." },
        404,
      );
    }

    const item = await prisma.reliefInventory.update({
      where: { id: itemId },
      data: {
        category: body.category as (typeof validCategories)[number],
        itemName: body.itemName!.trim(),
        itemNameBn: body.itemNameBn?.trim() || null,
        quantity: body.quantity!,
        unit: body.unit!.trim(),
      },
    });

    return c.json({
      success: true,
      message: "Inventory item updated successfully.",
      data: item,
    });
  } catch (error) {
    console.error("Failed to update inventory item:", error);

    return c.json(
      { success: false, message: "Failed to update inventory item." },
      500,
    );
  }
});

// DELETE /api/admin/food/:id/inventory/:itemId

adminFoodRoute.delete("/:id/inventory/:itemId", async (c) => {
  if (!(await isAdmin(c))) {
    return c.json({ success: false, message: "Unauthorized." }, 401);
  }

  try {
    const { id, itemId } = c.req.param();

    const existing = await prisma.reliefInventory.findFirst({
      where: {
        id: itemId,
        reliefPointId: id,
      },
    });

    if (!existing) {
      return c.json(
        { success: false, message: "Inventory item not found." },
        404,
      );
    }

    await prisma.reliefInventory.delete({
      where: { id: itemId },
    });

    return c.json({
      success: true,
      message: "Inventory item deleted successfully.",
    });
  } catch (error) {
    console.error("Failed to delete inventory item:", error);

    return c.json(
      { success: false, message: "Failed to delete inventory item." },
      500,
    );
  }
});

export default adminFoodRoute;

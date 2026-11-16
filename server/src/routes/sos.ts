import { Hono } from "hono";
import { verify } from "hono/jwt";
import { prisma } from "../lib/prisma.js";

const sosRoute = new Hono();

const emergencyTypes = [
  "MEDICAL",
  "RESCUE",
  "FLOOD_TRAPPED",
  "FOOD_WATER",
  "ANIMAL_RESCUE",
  "OTHER",
] as const;

const sosStatuses = [
  "PENDING",
  "ACKNOWLEDGED",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "CANCELLED",
] as const;

type EmergencyType = (typeof emergencyTypes)[number];
type SOSStatus = (typeof sosStatuses)[number];

interface AuthenticatedResponder {
  id: string;
  role: "RESPONDER" | "ADMIN";
}

// Verify the JWT and confirm the user's current database role.
async function getResponder(c: any): Promise<AuthenticatedResponder | null> {
  try {
    const authorization = c.req.header("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return null;
    }

    const token = authorization.slice(7);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET is not configured.");
      return null;
    }

    const payload = await verify(token, secret);

    if (typeof payload.sub !== "string") {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user || (user.role !== "RESPONDER" && user.role !== "ADMIN")) {
      return null;
    }

    return {
      id: user.id,
      role: user.role,
    };
  } catch {
    return null;
  }
}

// POST /api/sos
// Public endpoint: residents do not need accounts.

sosRoute.post("/", async (c) => {
  try {
    const body = await c.req.json();

    const latitude = body.latitude;
    const longitude = body.longitude;

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
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
          message: "Valid GPS coordinates are required.",
        },
        400,
      );
    }

    const emergencyType = body.emergencyType
      ? String(body.emergencyType).toUpperCase()
      : "OTHER";

    if (!emergencyTypes.includes(emergencyType as EmergencyType)) {
      return c.json(
        {
          success: false,
          message: "Invalid emergency type.",
          allowedTypes: emergencyTypes,
        },
        400,
      );
    }

    const name = typeof body.name === "string" ? body.name.trim() : null;

    const phone = typeof body.phone === "string" ? body.phone.trim() : null;

    const description =
      typeof body.description === "string" ? body.description.trim() : null;

    const address =
      typeof body.address === "string" ? body.address.trim() : null;

    const districtId =
      typeof body.districtId === "string"
        ? body.districtId.trim().toLowerCase()
        : null;

    if (description && description.length > 1000) {
      return c.json(
        {
          success: false,
          message: "Description cannot exceed 1000 characters.",
        },
        400,
      );
    }

    if (name && name.length > 100) {
      return c.json(
        {
          success: false,
          message: "Name cannot exceed 100 characters.",
        },
        400,
      );
    }

    if (phone && phone.length > 30) {
      return c.json(
        {
          success: false,
          message: "Phone number cannot exceed 30 characters.",
        },
        400,
      );
    }

    const request = await prisma.sOSRequest.create({
      data: {
        latitude,
        longitude,
        emergencyType: emergencyType as EmergencyType,
        name,
        phone,
        description,
        address,
        districtId,
        status: "PENDING",
      },
      select: {
        id: true,
        emergencyType: true,
        latitude: true,
        longitude: true,
        districtId: true,
        status: true,
        createdAt: true,
      },
    });

    return c.json(
      {
        success: true,
        message: "Emergency request received successfully.",
        data: request,
      },
      201,
    );
  } catch (error) {
    console.error("Failed to submit SOS request:", error);

    return c.json(
      {
        success: false,
        message: "Failed to submit emergency request.",
      },
      500,
    );
  }
});

// GET /api/sos
// Protected: responders and admins.

sosRoute.get("/", async (c) => {
  try {
    const responder = await getResponder(c);

    if (!responder) {
      return c.json(
        {
          success: false,
          message: "Authentication required. Responder or admin access only.",
        },
        401,
      );
    }

    const status = c.req.query("status")?.toUpperCase();
    const districtId = c.req.query("districtId")?.toLowerCase();

    if (status && !sosStatuses.includes(status as SOSStatus)) {
      return c.json(
        {
          success: false,
          message: "Invalid request status.",
          allowedStatuses: sosStatuses,
        },
        400,
      );
    }

    const requests = await prisma.sOSRequest.findMany({
      where: {
        ...(status ? { status: status as SOSStatus } : {}),
        ...(districtId ? { districtId } : {}),
        ...(responder.role === "RESPONDER"
          ? {
              OR: [{ responderId: responder.id }, { status: "PENDING" }],
            }
          : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
      select: {
        id: true,
        name: true,
        phone: true,
        districtId: true,
        emergencyType: true,
        latitude: true,
        longitude: true,
        address: true,
        description: true,
        status: true,
        responderId: true,
        createdAt: true,
        updatedAt: true,
        resolvedAt: true,
      },
    });

    return c.json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error("Failed to retrieve SOS requests:", error);

    return c.json(
      {
        success: false,
        message: "Failed to retrieve emergency requests.",
      },
      500,
    );
  }
});

// GET /api/sos/:id
// Protected: responders and admins.

sosRoute.get("/:id", async (c) => {
  try {
    const responder = await getResponder(c);

    if (!responder) {
      return c.json(
        {
          success: false,
          message: "Authentication required.",
        },
        401,
      );
    }

    const { id } = c.req.param();

    const request = await prisma.sOSRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return c.json(
        {
          success: false,
          message: "SOS request not found.",
        },
        404,
      );
    }

    if (
      responder.role === "RESPONDER" &&
      request.responderId !== responder.id &&
      request.status !== "PENDING"
    ) {
      return c.json(
        {
          success: false,
          message: "You are not authorized to view this request.",
        },
        403,
      );
    }

    return c.json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error("Failed to retrieve SOS request:", error);

    return c.json(
      {
        success: false,
        message: "Failed to retrieve SOS request.",
      },
      500,
    );
  }
});

// PATCH /api/sos/:id/acknowledge
// Assigns the request to the logged-in responder.

sosRoute.patch("/:id/acknowledge", async (c) => {
  try {
    const responder = await getResponder(c);

    if (!responder) {
      return c.json(
        {
          success: false,
          message: "Authentication required.",
        },
        401,
      );
    }

    const { id } = c.req.param();

    const existing = await prisma.sOSRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      return c.json(
        {
          success: false,
          message: "SOS request not found.",
        },
        404,
      );
    }

    if (
      existing.status !== "PENDING" &&
      !(
        existing.status === "ACKNOWLEDGED" &&
        existing.responderId === responder.id
      )
    ) {
      return c.json(
        {
          success: false,
          message: "This request is no longer available for acknowledgement.",
        },
        409,
      );
    }

    if (
      existing.status === "ACKNOWLEDGED" &&
      existing.responderId === responder.id
    ) {
      return c.json({
        success: true,
        message: "You have already acknowledged this request.",
        data: existing,
      });
    }

    const result = await prisma.sOSRequest.updateMany({
      where: {
        id,
        status: "PENDING",
        responderId: null,
      },
      data: {
        status: "ACKNOWLEDGED",
        responderId: responder.id,
      },
    });

    if (result.count === 0) {
      return c.json(
        {
          success: false,
          message: "Another responder has already taken this request.",
        },
        409,
      );
    }

    const updated = await prisma.sOSRequest.findUnique({
      where: { id },
    });

    return c.json({
      success: true,
      message: "SOS request acknowledged successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("Failed to acknowledge SOS request:", error);

    return c.json(
      {
        success: false,
        message: "Failed to acknowledge SOS request.",
      },
      500,
    );
  }
});

// PATCH /api/sos/:id/status
// Allowed transitions: ASSIGNED, IN_PROGRESS, RESOLVED, CANCELLED.

sosRoute.patch("/:id/status", async (c) => {
  try {
    const responder = await getResponder(c);

    if (!responder) {
      return c.json(
        {
          success: false,
          message: "Authentication required.",
        },
        401,
      );
    }

    const { id } = c.req.param();
    const body = await c.req.json();
    const status = String(body.status ?? "").toUpperCase();

    const allowedUpdates = ["ASSIGNED", "IN_PROGRESS", "RESOLVED", "CANCELLED"];

    if (!allowedUpdates.includes(status)) {
      return c.json(
        {
          success: false,
          message: "Invalid status update.",
          allowedStatuses: allowedUpdates,
        },
        400,
      );
    }

    const existing = await prisma.sOSRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      return c.json(
        {
          success: false,
          message: "SOS request not found.",
        },
        404,
      );
    }

    if (
      responder.role === "RESPONDER" &&
      existing.responderId !== responder.id
    ) {
      return c.json(
        {
          success: false,
          message: "You can only update requests assigned to you.",
        },
        403,
      );
    }

    const allowedTransitions: Record<string, string[]> = {
      PENDING: ["ASSIGNED", "CANCELLED"],
      ACKNOWLEDGED: ["ASSIGNED", "IN_PROGRESS", "CANCELLED"],
      ASSIGNED: ["IN_PROGRESS", "CANCELLED"],
      IN_PROGRESS: ["RESOLVED", "CANCELLED"],
      RESOLVED: [],
      CANCELLED: [],
    };

    if (!allowedTransitions[existing.status].includes(status)) {
      return c.json(
        {
          success: false,
          message: `Cannot change status from ${existing.status} to ${status}.`,
        },
        409,
      );
    }

    const updated = await prisma.sOSRequest.update({
      where: { id },
      data: {
        status: status as SOSStatus,
        ...(status === "RESOLVED" ? { resolvedAt: new Date() } : {}),
        ...(status === "ASSIGNED" && !existing.responderId
          ? { responderId: responder.id }
          : {}),
      },
    });

    return c.json({
      success: true,
      message: `SOS request updated to ${status}.`,
      data: updated,
    });
  } catch (error) {
    console.error("Failed to update SOS status:", error);

    return c.json(
      {
        success: false,
        message: "Failed to update SOS request.",
      },
      500,
    );
  }
});

export default sosRoute;

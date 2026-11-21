import { Hono, type Context } from "hono";
import { verify } from "hono/jwt";
import { prisma } from "../../lib/prisma.js";

const adminAlertsRoute = new Hono();

const alertSeverities = [
  "INFO",
  "ADVISORY",
  "WATCH",
  "WARNING",
  "DANGER",
] as const;

const alertStatuses = ["DRAFT", "ACTIVE", "EXPIRED", "CANCELLED"] as const;

type AlertSeverityValue = (typeof alertSeverities)[number];
type AlertStatusValue = (typeof alertStatuses)[number];

interface AlertInput {
  title?: string;
  titleBn?: string | null;
  message?: string;
  messageBn?: string | null;
  severity?: AlertSeverityValue;
  status?: AlertStatusValue;
  districtIds?: string[];
  source?: string | null;
  sourceUrl?: string | null;
  issuedAt?: Date;
  expiresAt?: Date | null;
}

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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateAlertInput(
  body: unknown,
  partial = false,
): { valid: true; data: AlertInput } | { valid: false; message: string } {
  if (!isObject(body)) {
    return { valid: false, message: "Invalid alert data." };
  }

  const data: AlertInput = {};

  if (!partial || body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      return { valid: false, message: "Alert title is required." };
    }
    data.title = body.title.trim();
  }

  if (body.titleBn !== undefined) {
    if (body.titleBn !== null && typeof body.titleBn !== "string") {
      return { valid: false, message: "Invalid Bangla title." };
    }
    data.titleBn =
      typeof body.titleBn === "string" ? body.titleBn.trim() || null : null;
  }

  if (!partial || body.message !== undefined) {
    if (typeof body.message !== "string" || !body.message.trim()) {
      return { valid: false, message: "Alert message is required." };
    }
    data.message = body.message.trim();
  }

  if (body.messageBn !== undefined) {
    if (body.messageBn !== null && typeof body.messageBn !== "string") {
      return { valid: false, message: "Invalid Bangla message." };
    }
    data.messageBn =
      typeof body.messageBn === "string" ? body.messageBn.trim() || null : null;
  }

  if (!partial || body.severity !== undefined) {
    if (
      typeof body.severity !== "string" ||
      !alertSeverities.includes(body.severity as AlertSeverityValue)
    ) {
      return { valid: false, message: "Select a valid alert severity." };
    }
    data.severity = body.severity as AlertSeverityValue;
  }

  if (body.status !== undefined) {
    if (
      typeof body.status !== "string" ||
      !alertStatuses.includes(body.status as AlertStatusValue)
    ) {
      return { valid: false, message: "Select a valid alert status." };
    }
    data.status = body.status as AlertStatusValue;
  }

  if (!partial || body.districtIds !== undefined) {
    if (
      !Array.isArray(body.districtIds) ||
      body.districtIds.length === 0 ||
      !body.districtIds.every(
        (id) => typeof id === "string" && id.trim().length > 0,
      )
    ) {
      return {
        valid: false,
        message: "Select at least one district for this alert.",
      };
    }

    data.districtIds = [
      ...new Set(body.districtIds.map((id: string) => id.trim().toLowerCase())),
    ];
  }

  if (body.source !== undefined) {
    if (body.source !== null && typeof body.source !== "string") {
      return { valid: false, message: "Invalid alert source." };
    }
    data.source =
      typeof body.source === "string" ? body.source.trim() || null : null;
  }

  if (body.sourceUrl !== undefined) {
    if (body.sourceUrl !== null && typeof body.sourceUrl !== "string") {
      return { valid: false, message: "Invalid source URL." };
    }

    const sourceUrl =
      typeof body.sourceUrl === "string" ? body.sourceUrl.trim() : "";

    if (sourceUrl) {
      try {
        const parsedUrl = new URL(sourceUrl);
        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
          return {
            valid: false,
            message: "Source URL must use HTTP or HTTPS.",
          };
        }
      } catch {
        return { valid: false, message: "Enter a valid source URL." };
      }
    }

    data.sourceUrl = sourceUrl || null;
  }

  if (body.issuedAt !== undefined) {
    const date = new Date(String(body.issuedAt));

    if (Number.isNaN(date.getTime())) {
      return { valid: false, message: "Invalid issue date." };
    }

    data.issuedAt = date;
  }

  if (body.expiresAt !== undefined) {
    if (body.expiresAt === null || body.expiresAt === "") {
      data.expiresAt = null;
    } else {
      const date = new Date(String(body.expiresAt));

      if (Number.isNaN(date.getTime())) {
        return { valid: false, message: "Invalid expiry date." };
      }

      if (data.issuedAt && date <= data.issuedAt) {
        return {
          valid: false,
          message: "Expiry date must be later than the issue date.",
        };
      }

      data.expiresAt = date;
    }
  }

  return { valid: true, data };
}

// GET /api/admin/alerts
// Optional filters: ?districtId=bhola&status=ACTIVE&severity=DANGER
adminAlertsRoute.get("/", async (c) => {
  if (!(await isAdmin(c))) {
    return c.json({ success: false, message: "Unauthorized." }, 401);
  }

  try {
    const districtId = c.req.query("districtId")?.trim().toLowerCase();
    const status = c.req.query("status");
    const severity = c.req.query("severity");

    if (
      status &&
      status !== "all" &&
      !alertStatuses.includes(status as AlertStatusValue)
    ) {
      return c.json({ success: false, message: "Invalid status filter." }, 400);
    }

    if (severity && !alertSeverities.includes(severity as AlertSeverityValue)) {
      return c.json(
        { success: false, message: "Invalid severity filter." },
        400,
      );
    }

    const alerts = await prisma.disasterAlert.findMany({
      where: {
        ...(districtId ? { districtIds: { has: districtId } } : {}),
        ...(status && status !== "all"
          ? { status: status as AlertStatusValue }
          : {}),
        ...(severity ? { severity: severity as AlertSeverityValue } : {}),
      },
      orderBy: [{ issuedAt: "desc" }, { createdAt: "desc" }],
    });

    return c.json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (error) {
    console.error("Failed to fetch admin alerts:", error);
    return c.json(
      { success: false, message: "Failed to retrieve alerts." },
      500,
    );
  }
});

// POST /api/admin/alerts
adminAlertsRoute.post("/", async (c) => {
  if (!(await isAdmin(c))) {
    return c.json({ success: false, message: "Unauthorized." }, 401);
  }

  try {
    const body = await c.req.json();
    const validation = validateAlertInput(body);

    if (!validation.valid) {
      return c.json({ success: false, message: validation.message }, 400);
    }

    const alert = await prisma.disasterAlert.create({
      data: {
        title: validation.data.title!,
        titleBn: validation.data.titleBn,
        message: validation.data.message!,
        messageBn: validation.data.messageBn,
        severity: validation.data.severity!,
        status: validation.data.status ?? "DRAFT",
        districtIds: validation.data.districtIds!,
        source: validation.data.source,
        sourceUrl: validation.data.sourceUrl,
        issuedAt: validation.data.issuedAt,
        expiresAt: validation.data.expiresAt,
      },
    });

    return c.json(
      {
        success: true,
        message: "Alert created successfully.",
        data: alert,
      },
      201,
    );
  } catch (error) {
    console.error("Failed to create alert:", error);
    return c.json({ success: false, message: "Failed to create alert." }, 500);
  }
});

// PUT /api/admin/alerts/:id
adminAlertsRoute.put("/:id", async (c) => {
  if (!(await isAdmin(c))) {
    return c.json({ success: false, message: "Unauthorized." }, 401);
  }

  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const validation = validateAlertInput(body, true);

    if (!validation.valid) {
      return c.json({ success: false, message: validation.message }, 400);
    }

    const existing = await prisma.disasterAlert.findUnique({
      where: { id },
    });

    if (!existing) {
      return c.json({ success: false, message: "Alert not found." }, 404);
    }

    const issuedAt = validation.data.issuedAt ?? existing.issuedAt;
    const expiresAt =
      validation.data.expiresAt === undefined
        ? existing.expiresAt
        : validation.data.expiresAt;

    if (expiresAt && expiresAt <= issuedAt) {
      return c.json(
        {
          success: false,
          message: "Expiry date must be later than the issue date.",
        },
        400,
      );
    }

    const alert = await prisma.disasterAlert.update({
      where: { id },
      data: validation.data,
    });

    return c.json({
      success: true,
      message: "Alert updated successfully.",
      data: alert,
    });
  } catch (error) {
    console.error("Failed to update alert:", error);
    return c.json({ success: false, message: "Failed to update alert." }, 500);
  }
});

// PATCH /api/admin/alerts/:id/status
adminAlertsRoute.patch("/:id/status", async (c) => {
  if (!(await isAdmin(c))) {
    return c.json({ success: false, message: "Unauthorized." }, 401);
  }

  try {
    const id = c.req.param("id");
    const body = await c.req.json<{ status?: string }>();

    if (
      !body.status ||
      !alertStatuses.includes(body.status as AlertStatusValue)
    ) {
      return c.json({ success: false, message: "Invalid alert status." }, 400);
    }

    const existing = await prisma.disasterAlert.findUnique({
      where: { id },
    });

    if (!existing) {
      return c.json({ success: false, message: "Alert not found." }, 404);
    }

    const alert = await prisma.disasterAlert.update({
      where: { id },
      data: { status: body.status as AlertStatusValue },
    });

    return c.json({
      success: true,
      message: "Alert status updated.",
      data: alert,
    });
  } catch (error) {
    console.error("Failed to update alert status:", error);
    return c.json(
      { success: false, message: "Failed to update alert status." },
      500,
    );
  }
});

// DELETE /api/admin/alerts/:id
adminAlertsRoute.delete("/:id", async (c) => {
  if (!(await isAdmin(c))) {
    return c.json({ success: false, message: "Unauthorized." }, 401);
  }

  try {
    const id = c.req.param("id");

    const existing = await prisma.disasterAlert.findUnique({
      where: { id },
    });

    if (!existing) {
      return c.json({ success: false, message: "Alert not found." }, 404);
    }

    await prisma.disasterAlert.delete({
      where: { id },
    });

    return c.json({
      success: true,
      message: "Alert deleted successfully.",
    });
  } catch (error) {
    console.error("Failed to delete alert:", error);
    return c.json({ success: false, message: "Failed to delete alert." }, 500);
  }
});

export default adminAlertsRoute;

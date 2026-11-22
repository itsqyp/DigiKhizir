import { Hono } from "hono";
import { sign, verify } from "hono/jwt";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";

const authRoute = new Hono();

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return secret;
}

// POST /api/auth/login
authRoute.post("/login", async (c) => {
  try {
    const body = await c.req.json<{
      username?: string;
      password?: string;
    }>();

    const username = body.username?.trim().toLowerCase();
    const password = body.password;

    if (!username || !password) {
      return c.json(
        {
          success: false,
          message: "Username and password are required.",
        },
        400,
      );
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    // Only ADMIN accounts can use this dashboard login.
    if (
      !user ||
      !["ADMIN", "RESPONDER"].includes(user.role) ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      return c.json(
        { success: false, message: "Invalid username or password." },
        401,
      );
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 8 * 60 * 60;

    const token = await sign(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
        iat: now,
        exp: now + expiresIn,
      },
      getJwtSecret(),
      "HS256",
    );

    return c.json({
      success: true,
      message: "Login successful.",
      token,
      expiresIn,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);

    return c.json(
      {
        success: false,
        message: "An unexpected error occurred during login.",
      },
      500,
    );
  }
});

// PATCH /api/auth/change-password
authRoute.patch("/change-password", async (c) => {
  try {
    const authorization = c.req.header("Authorization");
    const token = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : null;

    if (!token) {
      return c.json(
        { success: false, message: "Authentication required." },
        401,
      );
    }

    const payload = await verify(token, getJwtSecret(), "HS256");

    if (payload.role !== "ADMIN" || typeof payload.sub !== "string") {
      return c.json({ success: false, message: "Unauthorized." }, 403);
    }

    const body = await c.req.json<{
      currentPassword?: string;
      newPassword?: string;
    }>();

    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return c.json(
        {
          success: false,
          message: "Both passwords are required.",
        },
        400,
      );
    }

    if (newPassword.length < 8) {
      return c.json(
        {
          success: false,
          message: "New password must be at least 8 characters.",
        },
        400,
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.role !== "ADMIN") {
      return c.json(
        { success: false, message: "Admin account not found." },
        404,
      );
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      return c.json(
        { success: false, message: "Current password is incorrect." },
        400,
      );
    }

    if (await bcrypt.compare(newPassword, user.passwordHash)) {
      return c.json(
        {
          success: false,
          message: "New password must be different from the current password.",
        },
        400,
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return c.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return c.json(
      {
        success: false,
        message: "Failed to change password.",
      },
      500,
    );
  }
});

export default authRoute;

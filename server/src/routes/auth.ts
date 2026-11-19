import { Hono } from "hono";
import { sign } from "hono/jwt";
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
      user.role !== "ADMIN" ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      return c.json(
        {
          success: false,
          message: "Invalid username or password.",
        },
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

export default authRoute;

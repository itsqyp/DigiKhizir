import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { prisma } from "./lib/prisma.js";

const app = new Hono();

app.get("/", (c) => {
  return c.json({
    status: "ok",
    message: "DigiKhizir API is running",
  });
});

app.get("/api/health", async (c) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return c.json({
      status: "ok",
      message: "DigiKhizir API and database are connected",
      database: "connected",
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    return c.json(
      {
        status: "error",
        message: "Database connection failed",
      },
      500,
    );
  }
});

const port = Number(process.env.PORT) || 3000;

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`DigiKhizir API running on http://localhost:${info.port}`);
  },
);

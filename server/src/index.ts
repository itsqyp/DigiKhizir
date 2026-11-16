import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { prisma } from "./lib/prisma.js";
import alertsRoute from "./routes/alerts.js";
import sheltersRoute from "./routes/shelters.js";
import foodRoute from "./routes/food.js";
import animalSheltersRoute from "./routes/animalShelters.js";
import sosRoute from "./routes/sos.js";
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

// Disaster alerts
app.route("/api/alerts", alertsRoute);
app.route("/api/shelters", sheltersRoute);
app.route("/api/food", foodRoute);
app.route("/api/animal-shelters", animalSheltersRoute);
app.route("/api/sos", sosRoute);
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

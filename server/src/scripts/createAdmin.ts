import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";

async function createAdmin() {
  const name = process.env.ADMIN_NAME?.trim();
  const username = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  const phone = process.env.ADMIN_PHONE?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !username || !phone || !password) {
    throw new Error(
      "ADMIN_NAME, ADMIN_USERNAME, ADMIN_PHONE and ADMIN_PASSWORD must be configured.",
    );
  }

  if (password.length < 12) {
    throw new Error("Admin password must be at least 12 characters long.");
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { username },
  });

  if (existingAdmin) {
    throw new Error("An account with this username already exists.");
  }

  const existingPhone = await prisma.user.findUnique({
    where: { phone },
  });

  if (existingPhone) {
    throw new Error("An account with this phone number already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.create({
    data: {
      name,
      username,
      phone,
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log("Admin account created successfully.");
  console.log(`Username: ${admin.username}`);
}

createAdmin()
  .catch((error) => {
    console.error("Could not create admin account:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

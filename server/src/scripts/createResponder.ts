import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";

async function main() {
  const name = process.argv[2];
  const username = process.argv[3]?.trim().toLowerCase();
  const phone = process.argv[4];
  const password = process.argv[5];

  if (!name || !username || !phone || !password) {
    console.error(
      'Usage: npm run create-responder -- "Responder Name" username phone password',
    );
    process.exitCode = 1;
    return;
  }

  if (password.length < 8) {
    console.error("Password must contain at least 8 characters.");
    process.exitCode = 1;
    return;
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { phone }],
    },
  });

  if (existingUser) {
    console.error("A user with this username or phone already exists.");
    process.exitCode = 1;
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const responder = await prisma.user.create({
    data: {
      name,
      username,
      phone,
      passwordHash,
      role: "RESPONDER",
    },
  });

  console.log("Responder account created successfully.");
  console.log("Name:", responder.name);
  console.log("Username:", responder.username);
  console.log("Role:", responder.role);
}

main()
  .catch((error) => {
    console.error("Failed to create responder:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

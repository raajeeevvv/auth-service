import "dotenv/config"; 

import app from "./app";
import { prisma } from "./lib/prisma"; // wherever your PrismaClient is exported from

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await prisma.$connect(); // optional — Prisma connects lazily anyway, but this fails fast if DB is down
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();

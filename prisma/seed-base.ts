// Runs on every Vercel deploy (see the "build" script) and via
// `npm run db:seed:base`. Creates the community, highlights, and categories
// if they're missing; never overwrites existing rows.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { seedBase } from "../src/lib/base-content";

const db = new PrismaClient();
seedBase(db)
  .then(() => console.log("Base content ready (community, highlights, categories)."))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

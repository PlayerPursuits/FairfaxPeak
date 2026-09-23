// DEMO seed: wipes the database and loads fictional accounts and listings.
// All businesses, people, and organizations are made up. Never run this
// against production. To add demo data to the live site, use the admin
// "Demo data" page, which adds it without deleting anything.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { loadDemoData } from "../src/lib/demo";

const db = new PrismaClient();
async function main() {
  const url = process.env.DATABASE_URL ?? "";
  const local = /@(localhost|127\.0\.0\.1|postgres)(:|\/)/.test(url);
  if ((!local || process.env.VERCEL) && !process.argv.includes("--force")) {
    console.error("Refusing to run the demo seed: it deletes all data and DATABASE_URL is not a local database.");
    console.error("Pass --force if you really mean it (e.g. for a staging database).");
    process.exit(1);
  }
  console.log("Resetting data…");
  await db.$transaction([
    db.offerClaim.deleteMany(),
    db.review.deleteMany(),
    db.offer.deleteMany(),
    db.businessImage.deleteMany(),
    db.business.deleteMany(),
    db.civicContact.deleteMany(),
    db.event.deleteMany(),
    db.resource.deleteMany(),
    db.civicOrg.deleteMany(),
    db.user.deleteMany(),
    db.category.deleteMany(),
    db.areaHighlight.deleteMany(),
    db.community.deleteMany(),
  ]);

  await loadDemoData(db, "password123");
  await db.user.create({
    data: { email: "admin@fairfaxpeak.example", name: "Site Admin", passwordHash: await bcrypt.hash("password123", 10), role: "ADMIN" },
  });

  console.log("Seeded Fairfax Peak. Demo logins (password: password123):");
  console.log("  Resident:  resident@example.com");
  console.log("  Business:  owner@trailheadcoffee.example  (active)  |  owner@newbakery.example (unpaid)");
  console.log("  Civic:     clerk@fairfaxpeak.example");
  console.log("  Admin:     admin@fairfaxpeak.example");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

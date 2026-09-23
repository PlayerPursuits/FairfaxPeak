// Manually send newsletters: `npm run newsletter -- daily` or `-- weekly`.
// Uses the same logic as the /api/cron/newsletter endpoint.
import "dotenv/config";

async function main() {
  const arg = (process.argv[2] ?? "daily").toUpperCase();
  if (arg !== "DAILY" && arg !== "WEEKLY") throw new Error("Usage: npm run newsletter -- daily|weekly");
  const { sendNewsletters } = await import("../src/lib/newsletter");
  console.log(await sendNewsletters(arg));
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);

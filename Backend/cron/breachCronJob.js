/**
 * breachCronJob.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Scheduled cron job (runs daily at 2 AM) that:
 *   1. Fetches all monitored emails from the database
 *   2. For each email, calls the XposedOrNot (XON) breach API — FREE, no key
 *   3. Compares the new list with the stored baseline using breach NAME
 *   4. If a new breach is found (name not in stored records):
 *        → Inserts the new breach record into BreachRecords table
 *        → (Placeholder) Sends an email alert  ← Phase 8 will wire Nodemailer
 * ─────────────────────────────────────────────────────────────────────────────
 */

const cron = require("node-cron");
const axios = require("axios");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ── Helper: fetch breaches from XposedOrNot API (free, no API key) ───────────
// XON response shape:
// { breachDetails: { BreachMetrics: { domain: [ {name, domain, year, records, datacategories}, ... ] } } }
async function fetchBreachesFromAPI(email) {
  try {
    const response = await axios.get(
      `${process.env.BREACH_API_URL}${encodeURIComponent(email)}`,
      {
        headers: {
          "user-agent": "BreachMonitoringSystem"
        },
        timeout: 10000,
      }
    );

    // Normalise XON response → array of objects with .Name (capitalised)
    // so the rest of the code (detectNewBreaches, DB insert) stays unchanged
    const raw = response.data?.breachDetails?.BreachMetrics?.domain ?? [];
    return raw.map((b) => ({
      Name: b.name,
      BreachDate: b.year ? `${b.year}-01-01` : null,
      Description: null,              // XON free tier omits full description
      DataClasses: b.datacategories ?? [],
    }));
  } catch (err) {
    if (err.response?.status === 404) {
      // 404 means "no breaches found for this email" — that is a valid state
      return [];
    }
    if (err.response?.status === 429) {
      console.warn(`[CronJob] Rate limited by XON for email: ${email}. Skipping this cycle.`);
      return null; // null signals a rate-limit skip (not an empty breach list)
    }
    throw err; // re-throw unexpected errors
  }
}

// ── Core comparison logic ─────────────────────────────────────────────────────
/**
 * detectNewBreaches(oldBreachNames, newBreaches)
 *
 * @param {Set<string>}  oldBreachNames – Set of breach names already in DB
 * @param {Array<Object>} newBreaches   – Fresh breach objects from the API
 * @returns {Array<Object>}             – Only breaches whose Name is NOT in oldBreachNames
 */
function detectNewBreaches(oldBreachNames, newBreaches) {
  return newBreaches.filter(
    (breach) => !oldBreachNames.has(breach.Name)
  );
}

// ── Process a single monitored email ─────────────────────────────────────────
async function processMonitoredEmail(monitoredRecord) {
  const { id: monitoredEmailId, monitoredEmail, user } = monitoredRecord;

  console.log(`[CronJob] Checking breaches for: ${monitoredEmail}`);

  // 1️⃣  Get existing breach names from the DB (our baseline)
  const existingRecords = await prisma.breachRecord.findMany({
    where: { monitoredEmailId },
    select: { breachName: true },
  });
  const oldBreachNames = new Set(existingRecords.map((r) => r.breachName));

  // 2️⃣  Fetch fresh breach data from the API
  const latestBreaches = await fetchBreachesFromAPI(monitoredEmail);

  if (latestBreaches === null) {
    // Rate limited — skip this email for now
    return { email: monitoredEmail, skipped: true, newBreaches: [] };
  }

  // 3️⃣  Comparison logic: find breach names not present in the old set
  const newBreaches = detectNewBreaches(oldBreachNames, latestBreaches);

  if (newBreaches.length === 0) {
    console.log(`[CronJob]   ✓ No new breaches found for ${monitoredEmail}`);
    return { email: monitoredEmail, skipped: false, newBreaches: [] };
  }

  console.log(
    `[CronJob]   ⚠  ${newBreaches.length} NEW breach(es) found for ${monitoredEmail}:`,
    newBreaches.map((b) => b.Name)
  );

  // 4️⃣  Insert new breaches into the database
  const insertedNames = [];
  for (const breach of newBreaches) {
    try {
      await prisma.breachRecord.create({
        data: {
          monitoredEmailId,
          breachName: breach.Name,
          breachDate: breach.BreachDate || null,
          description: breach.Description || null,
          dataClasses: breach.DataClasses
            ? breach.DataClasses.join(", ")
            : null,
        },
      });
      insertedNames.push(breach.Name);

      // 5️⃣  Send alert email (Phase 8 — Nodemailer integration)
      //     For now we log the intent; wire sendAlertEmail() here later.
      await sendAlertEmail({
        toEmail: user.email,
        monitoredEmail,
        breach,
      });
    } catch (insertErr) {
      // Unique constraint violation means another process already inserted it — skip
      if (insertErr.code === "P2002") {
        console.log(`[CronJob]   ↳ Already recorded: ${breach.Name} (race condition skipped)`);
      } else {
        console.error(`[CronJob]   ✗ Insert error for ${breach.Name}:`, insertErr.message);
      }
    }
  }

  return { email: monitoredEmail, skipped: false, newBreaches: insertedNames };
}

// ── Email alert placeholder (Phase 8 will fully implement this) ───────────────
async function sendAlertEmail({ toEmail, monitoredEmail, breach }) {
  // Phase 8 TODO: Replace this console.log with actual Nodemailer call.
  // Example Nodemailer snippet is in utils/mailer.js (to be created in Phase 8).
  console.log(`[CronJob] 📧 ALERT → To: ${toEmail} | Email monitored: ${monitoredEmail} | New breach: ${breach.Name} (${breach.BreachDate || "date unknown"})`);
}

// ── Main cron job handler ─────────────────────────────────────────────────────
async function runBreachCheckCron() {
  console.log("\n[CronJob] ══════════════════════════════════════════════════");
  console.log(`[CronJob]  Breach check started at ${new Date().toISOString()}`);
  console.log("[CronJob] ══════════════════════════════════════════════════");

  try {
    // Load all monitored email records, including the owning user's email for alerts
    const monitoredRecords = await prisma.monitoredEmail.findMany({
      include: { user: { select: { email: true, name: true } } },
    });

    if (monitoredRecords.length === 0) {
      console.log("[CronJob]  No monitored emails found. Exiting.");
      return;
    }

    console.log(`[CronJob]  Found ${monitoredRecords.length} monitored email(s).`);

    const results = [];

    // Process emails sequentially to respect XON rate limits (2 req/s, 100 req/day)
    for (const record of monitoredRecords) {
      const result = await processMonitoredEmail(record);
      results.push(result);

      // Rate-limit courtesy delay: XON allows 2 req/sec — 600ms is safe
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    // Summary
    const newBreachTotal = results.reduce(
      (sum, r) => sum + r.newBreaches.length,
      0
    );
    console.log(`\n[CronJob]  ── Summary ─────────────────────────────────`);
    console.log(`[CronJob]     Emails checked : ${monitoredRecords.length}`);
    console.log(`[CronJob]     New breaches   : ${newBreachTotal}`);
    results.forEach((r) => {
      if (r.newBreaches.length > 0) {
        console.log(`[CronJob]     └─ ${r.email}: ${r.newBreaches.join(", ")}`);
      }
    });
    console.log("[CronJob] ══════════════════════════════════════════════════\n");
  } catch (err) {
    console.error("[CronJob] FATAL error during cron run:", err.message);
  }
}

// ── Schedule: every day at 2:00 AM ───────────────────────────────────────────
function startCronJob() {
  console.log("[CronJob] Scheduler initialised — runs daily at 02:00 AM.");

  cron.schedule(
    "0 2 * * *",         // "At 02:00 every day"
    runBreachCheckCron,
    {
      scheduled: true,
      timezone: "Asia/Kolkata", // adjust to your server's timezone
    }
  );
}

// ── Export for use in server.js ───────────────────────────────────────────────
module.exports = { startCronJob, runBreachCheckCron };

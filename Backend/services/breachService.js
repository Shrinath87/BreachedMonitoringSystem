/**
 * breachService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Milestone 13 — Database operations for breach records.
 *
 *   • getStoredBreachNames(monitoredEmailId)  → Set<string>
 *   • insertNewBreaches(monitoredEmailId, fetchedBreaches) → inserted records[]
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Fetch all breach names already stored in the DB for a given monitored email.
 *
 * @param  {number}       monitoredEmailId – PK of the MonitoredEmails row
 * @returns {Promise<Set<string>>}         – Set of breach name strings
 */
async function getStoredBreachNames(monitoredEmailId) {
  const existingRecords = await prisma.breachRecord.findMany({
    where: { monitoredEmailId },
    select: { breachName: true },
  });
  return new Set(existingRecords.map((r) => r.breachName));
}

/**
 * Compare fetched breaches against what is already stored and insert ONLY
 * the ones whose Name is not yet in the database.
 *
 * @param  {number}        monitoredEmailId – PK of the MonitoredEmails row
 * @param  {Array<Object>} fetchedBreaches  – Normalised API objects
 *         Each object: { Name, BreachDate, Description, DataClasses }
 * @returns {Promise<Array<Object>>}        – Array of newly inserted breach records
 */
async function insertNewBreaches(monitoredEmailId, fetchedBreaches) {
  const oldBreachNames = await getStoredBreachNames(monitoredEmailId);

  // Filter to only breaches whose Name is NOT already stored
  const newBreaches = fetchedBreaches.filter(
    (breach) => !oldBreachNames.has(breach.Name)
  );

  if (newBreaches.length === 0) {
    return [];
  }

  const insertedRecords = [];

  for (const breach of newBreaches) {
    try {
      const record = await prisma.breachRecord.create({
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
      insertedRecords.push(record);
    } catch (insertErr) {
      // P2002 = unique constraint violation → another process already inserted it
      if (insertErr.code === "P2002") {
        console.log(
          `[BreachService] ↳ Already recorded: ${breach.Name} (race condition skipped)`
        );
      } else {
        console.error(
          `[BreachService] ✗ Insert error for ${breach.Name}:`,
          insertErr.message
        );
      }
    }
  }

  return insertedRecords;
}

export { getStoredBreachNames, insertNewBreaches };

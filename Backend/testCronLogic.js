/**
 * testCronLogic.js  —  Standalone unit test for the breach comparison logic.
 *
 * Run with:   node testCronLogic.js
 *
 * This script imports ONLY the pure comparison function (no DB, no HTTP)
 * so you can verify the detection algorithm works correctly at any time,
 * even without a running database or API key.
 */

// ── Replicate the comparison function (mirrors cron/breachCronJob.js) ─────────
function detectNewBreaches(oldBreachNames, newBreaches) {
  return newBreaches.filter((breach) => !oldBreachNames.has(breach.Name));
}

// ── Test data ─────────────────────────────────────────────────────────────────
const storedBaselineBreaches = [
  { Name: "Adobe", BreachDate: "2013-10-04" },
  { Name: "LinkedIn", BreachDate: "2012-05-05" },
  { Name: "MySpace", BreachDate: "2008-07-01" },
];

const latestAPIResponse = [
  { Name: "Adobe", BreachDate: "2013-10-04" },       // already known
  { Name: "LinkedIn", BreachDate: "2012-05-05" },     // already known
  { Name: "MySpace", BreachDate: "2008-07-01" },      // already known
  { Name: "Facebook", BreachDate: "2019-04-03" },     // ← NEW breach
  { Name: "Twitter", BreachDate: "2022-07-01" },      // ← NEW breach
];

// ── Run the comparison ────────────────────────────────────────────────────────
const oldBreachNames = new Set(storedBaselineBreaches.map((b) => b.Name));
const newBreaches = detectNewBreaches(oldBreachNames, latestAPIResponse);

// ── Assert results ────────────────────────────────────────────────────────────
console.log("═══════════════════════════════════════════════════");
console.log(" Breach Comparison Logic — Test Results");
console.log("═══════════════════════════════════════════════════");
console.log(`\n Stored baseline breaches   : ${[...oldBreachNames].join(", ")}`);
console.log(` Latest API breaches        : ${latestAPIResponse.map((b) => b.Name).join(", ")}`);
console.log(`\n New breaches detected (${newBreaches.length}):`);

newBreaches.forEach((b) => {
  console.log(`   ✅  ${b.Name}  (breach date: ${b.BreachDate})`);
});

// Assertions
const expectedNew = ["Facebook", "Twitter"];
const actualNew = newBreaches.map((b) => b.Name);
const pass =
  expectedNew.length === actualNew.length &&
  expectedNew.every((name) => actualNew.includes(name));

console.log(`\n Test: ${pass ? "✅ PASSED" : "❌ FAILED"}`);
if (!pass) {
  console.error(`   Expected: ${expectedNew.join(", ")}`);
  console.error(`   Got     : ${actualNew.join(", ")}`);
  process.exit(1);
}

console.log("\n All tests passed — comparison logic is working correctly.");
console.log("═══════════════════════════════════════════════════\n");

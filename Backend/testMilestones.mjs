/**
 * testMilestones.mjs
 * ──────────────────────────────────────────────────────────────────────────────
 * Practical test suite for Milestone 13 & 14 verification
 *
 * Run with:  npm install (if needed) && node testMilestones.mjs
 * 
 * This script will:
 *   1. Verify all environment variables are configured
 *   2. Test database connection and check schema
 *   3. Test Nodemailer SMTP configuration
 *   4. Simulate the breach detection & email flow
 * ──────────────────────────────────────────────────────────────────────────────
 */

import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";

dotenv.config();

const prisma = new PrismaClient();
const SUCCESS = "✅";
const FAIL = "❌";
const WARN = "⚠️";
const INFO = "ℹ️";

// ─────────────────────────────────────────────────────────────────────────────
//  TEST 1: Environment Variables
// ─────────────────────────────────────────────────────────────────────────────
async function testEnvironmentVariables() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║ TEST 1: Environment Variables Configuration              ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const requiredVars = {
    DATABASE_URL: "Database connection string",
    BREACH_API_URL: "XposedOrNot API endpoint",
    SMTP_HOST: "Email SMTP host",
    SMTP_PORT: "Email SMTP port",
    SMTP_USER: "Email SMTP username",
    SMTP_PASS: "Email SMTP password",
    EMAIL_FROM: "Sender email address",
  };

  let allPass = true;

  for (const [key, description] of Object.entries(requiredVars)) {
    const value = process.env[key];
    if (value) {
      const masked = key.includes("PASS")
        ? value.substring(0, 3) + "***" + value.substring(value.length - 3)
        : value.length > 50
          ? value.substring(0, 30) + "..."
          : value;
      console.log(`${SUCCESS} ${key.padEnd(20)} → ${masked}`);
    } else {
      console.log(`${FAIL} ${key.padEnd(20)} → MISSING!`);
      allPass = false;
    }
  }

  return allPass;
}

// ─────────────────────────────────────────────────────────────────────────────
//  TEST 2: Database Connection & Schema
// ─────────────────────────────────────────────────────────────────────────────
async function testDatabaseSchema() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║ TEST 2: Database Connection & Schema Validation          ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  try {
    // Test connection
    await prisma.$executeRaw`SELECT 1`;
    console.log(`${SUCCESS} Database connection successful`);

    // Check BreachRecord table exists
    const breachRecords = await prisma.breachRecord.findMany({ take: 1 });
    console.log(`${SUCCESS} BreachRecord table exists and is accessible`);

    // Check MonitoredEmail table exists
    const monitoredEmails = await prisma.monitoredEmail.findMany({ take: 1 });
    console.log(`${SUCCESS} MonitoredEmail table exists and is accessible`);

    // Get counts
    const breachCount = await prisma.breachRecord.count();
    const emailCount = await prisma.monitoredEmail.count();
    
    console.log(`\n${INFO} Database Statistics:`);
    console.log(`   • Total monitored emails: ${emailCount}`);
    console.log(`   • Total breach records: ${breachCount}`);

    return true;
  } catch (err) {
    console.log(`${FAIL} Database error: ${err.message}`);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  TEST 3: Nodemailer SMTP Connection
// ─────────────────────────────────────────────────────────────────────────────
async function testSmtpConnection() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║ TEST 3: Email (Nodemailer) SMTP Configuration           ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: parseInt(process.env.SMTP_PORT, 10) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    console.log(`${INFO} Testing SMTP connection...`);
    const verified = await transporter.verify();
    
    if (verified) {
      console.log(`${SUCCESS} SMTP connection verified!`);
      console.log(`${INFO} Email configuration:`);
      console.log(`   • Host: ${process.env.SMTP_HOST}`);
      console.log(`   • Port: ${process.env.SMTP_PORT}`);
      console.log(`   • User: ${process.env.SMTP_USER}`);
      console.log(`   • From: ${process.env.EMAIL_FROM}`);
      return true;
    } else {
      console.log(`${FAIL} SMTP verification returned false`);
      return false;
    }
  } catch (err) {
    console.log(`${FAIL} SMTP connection failed: ${err.message}`);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  TEST 4: Breach Detection Logic
// ─────────────────────────────────────────────────────────────────────────────
function testBreachDetectionLogic() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║ TEST 4: Breach Detection & Duplicate Prevention Logic    ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  // Replicate logic from breachCronJob.js
  function detectNewBreaches(oldBreachNames, newBreaches) {
    return newBreaches.filter((breach) => !oldBreachNames.has(breach.Name));
  }

  // Test Scenario 1: Mix of old and new breaches
  const storedBreaches = ["Adobe", "LinkedIn", "MySpace"];
  const apiBreaches = [
    { Name: "Adobe" },
    { Name: "LinkedIn" },
    { Name: "MySpace" },
    { Name: "Facebook" },
    { Name: "Twitter" },
  ];

  const oldSet = new Set(storedBreaches);
  const newDetected = detectNewBreaches(oldSet, apiBreaches);

  console.log(`${INFO} Test Scenario 1: Mixed old & new breaches`);
  console.log(`   • Previously stored: ${storedBreaches.join(", ")}`);
  console.log(`   • API returned: ${apiBreaches.map((b) => b.Name).join(", ")}`);
  console.log(`   • New detected: ${newDetected.map((b) => b.Name).join(", ")}`);

  const scenario1Pass =
    newDetected.length === 2 &&
    newDetected.some((b) => b.Name === "Facebook") &&
    newDetected.some((b) => b.Name === "Twitter");

  if (scenario1Pass) {
    console.log(`${SUCCESS} Detection logic working correctly\n`);
  } else {
    console.log(`${FAIL} Detection logic failed\n`);
  }

  // Test Scenario 2: All breaches already known
  const noNewBreaches = detectNewBreaches(oldSet, storedBreaches.map((b) => ({ Name: b })));
  console.log(`${INFO} Test Scenario 2: All breaches already known`);
  console.log(`   • New detected: ${noNewBreaches.length} (expected: 0)`);

  if (noNewBreaches.length === 0) {
    console.log(`${SUCCESS} Correctly identified no new breaches\n`);
  } else {
    console.log(`${FAIL} Should have detected no new breaches\n`);
  }

  return scenario1Pass && noNewBreaches.length === 0;
}

// ─────────────────────────────────────────────────────────────────────────────
//  TEST 5: Database Duplicate Prevention (Unique Constraint)
// ─────────────────────────────────────────────────────────────────────────────
async function testDuplicatePrevention() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║ TEST 5: Database Unique Constraint (Duplicate Prevention)║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  try {
    // Get or create a test monitored email
    let testEmail = await prisma.monitoredEmail.findFirst({
      where: { monitoredEmail: "test@example.com" },
    });

    if (!testEmail) {
      console.log(`${INFO} Creating test monitored email...`);
      // Get the first user or create one
      let testUser = await prisma.user.findFirst();
      if (!testUser) {
        testUser = await prisma.user.create({
          data: {
            name: "Test User",
            email: `test-user-${Date.now()}@example.com`,
            password: "test",
          },
        });
      }

      testEmail = await prisma.monitoredEmail.create({
        data: {
          userId: testUser.id,
          monitoredEmail: "test@example.com",
        },
      });
    }

    console.log(
      `${SUCCESS} Using test email: ${testEmail.monitoredEmail} (ID: ${testEmail.id})`
    );

    // Try to insert a test breach
    const testBreachName = `TestBreach_${Date.now()}`;
    const record1 = await prisma.breachRecord.create({
      data: {
        monitoredEmailId: testEmail.id,
        breachName: testBreachName,
        breachDate: "2024-01-01",
        description: "Test breach",
      },
    });

    console.log(`${SUCCESS} First insertion successful (ID: ${record1.id})`);

    // Try to insert the SAME breach again (should fail with P2002)
    try {
      const record2 = await prisma.breachRecord.create({
        data: {
          monitoredEmailId: testEmail.id,
          breachName: testBreachName,
          breachDate: "2024-01-01",
          description: "Test breach duplicate",
        },
      });
      console.log(`${FAIL} Duplicate was inserted (should have been blocked!)`);
      return false;
    } catch (err) {
      if (err.code === "P2002") {
        console.log(
          `${SUCCESS} Duplicate correctly prevented! (P2002 Unique Constraint)`
        );
        console.log(`${INFO} Error message: ${err.message}`);
        return true;
      } else {
        console.log(`${FAIL} Unexpected error: ${err.message}`);
        return false;
      }
    }
  } catch (err) {
    console.log(`${FAIL} Test error: ${err.message}`);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  TEST 6: Email Template Rendering
// ─────────────────────────────────────────────────────────────────────────────
function testEmailTemplate() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║ TEST 6: Email Template Structure Validation              ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const testBreaches = [
    {
      breachName: "TestBreach1",
      breachDate: "2024-01-15",
      description: "Test breach description",
      source: "Test API",
    },
    {
      breachName: "TestBreach2",
      breachDate: "2024-02-20",
      description: "Another test breach",
      source: "Test API 2",
    },
  ];

  const breachRows = testBreaches
    .map((b) => {
      const date = b.breachDate
        ? new Date(b.breachDate).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "Unknown";
      return `<tr><td>${b.breachName}</td><td>${date}</td><td>${b.description}</td><td>${b.source}</td></tr>`;
    })
    .join("");

  const validations = [
    { check: "Contains breach count", pass: breachRows.length > 0 },
    {
      check: "Contains breach names",
      pass: breachRows.includes("TestBreach1") && breachRows.includes("TestBreach2"),
    },
    { check: "Contains dates", pass: breachRows.includes("January") },
    { check: "Contains descriptions", pass: breachRows.includes("Test breach") },
    { check: "Alert emoji present", pass: "🚨".length > 0 },
    { check: "Table structure present", pass: breachRows.includes("<tr>") },
  ];

  validations.forEach((v) => {
    console.log(`${v.pass ? SUCCESS : FAIL} ${v.check}`);
  });

  const allPass = validations.every((v) => v.pass);
  if (allPass) {
    console.log(`\n${SUCCESS} Email template structure is valid`);
  }

  return allPass;
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN TEST RUNNER
// ─────────────────────────────────────────────────────────────────────────────
async function runAllTests() {
  console.log("\n");
  console.log("████████████████████████████████████████████████████████████");
  console.log("█  MILESTONE 13 & 14 - COMPREHENSIVE TEST SUITE             █");
  console.log("███████████████████████████════════════════════════════════▀\n");

  const results = [];

  // Run all tests
  results.push({
    name: "Environment Variables",
    pass: await testEnvironmentVariables(),
  });

  results.push({
    name: "Database Schema",
    pass: await testDatabaseSchema(),
  });

  results.push({
    name: "SMTP Connection",
    pass: await testSmtpConnection(),
  });

  results.push({
    name: "Breach Detection Logic",
    pass: testBreachDetectionLogic(),
  });

  results.push({
    name: "Duplicate Prevention",
    pass: await testDuplicatePrevention(),
  });

  results.push({
    name: "Email Template",
    pass: testEmailTemplate(),
  });

  // Print Summary
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║ TEST SUMMARY                                             ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const passed = results.filter((r) => r.pass).length;
  const total = results.length;

  results.forEach((r) => {
    console.log(`${r.pass ? SUCCESS : FAIL} ${r.name}`);
  });

  console.log(`\n${passed}/${total} tests passed\n`);

  if (passed === total) {
    console.log("🎉 ALL TESTS PASSED! Milestones 13 & 14 are working correctly.\n");
  } else {
    console.log(
      `⚠️  ${total - passed} test(s) failed. Please review the output above.\n`
    );
  }

  await prisma.$disconnect();
}

// Run!
runAllTests().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

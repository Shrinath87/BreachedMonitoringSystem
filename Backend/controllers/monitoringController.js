import { PrismaClient } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();

/**
 * POST /api/monitoring/enable
 * Body: { monitoredEmail: "victim@example.com" }
 *
 * Saves the email in MonitoredEmails table and takes a
 * baseline snapshot of all current breaches into BreachRecords.
 */
export const enableMonitoring = async (req, res) => {
  try {
    const userId = req.userId; // set by isAuth middleware
    const { monitoredEmail } = req.body;

    if (!monitoredEmail) {
      return res.status(400).json({ message: "monitoredEmail is required" });
    }

    // Upsert monitored email record
    let record = await prisma.monitoredEmail.upsert({
      where: { userId_monitoredEmail: { userId, monitoredEmail } },
      update: {}, // already exists, no update needed
      create: { userId, monitoredEmail },
    });

    // Fetch current breach data from XposedOrNot API (free, no API key required)
    let breaches = [];
    try {
      const apiResponse = await axios.get(
        `${process.env.BREACH_API_URL}${encodeURIComponent(monitoredEmail)}`,
        {
          headers: { "user-agent": "BreachMonitoringSystem" },
          timeout: 10000,
        }
      );
      // XON response: { breachDetails: { BreachMetrics: { domain: [...] } } }
      // Normalise to shape our DB insert expects
      const raw = apiResponse.data?.breachDetails?.BreachMetrics?.domain ?? [];
      breaches = raw.map((b) => ({
        Name:        b.name,
        BreachDate:  b.year ? `${b.year}-01-01` : null,
        Description: null,
        DataClasses: b.datacategories ?? [],
      }));
    } catch (apiErr) {
      if (apiErr.response?.status === 404) {
        // No breaches found — that's fine, still enable monitoring
        breaches = [];
      } else {
        throw apiErr;
      }
    }

    // Save baseline breach records (ignore duplicates via upsert)
    const savedBreaches = [];
    for (const breach of breaches) {
      const br = await prisma.breachRecord.upsert({
        where: {
          monitoredEmailId_breachName: {
            monitoredEmailId: record.id,
            breachName: breach.Name,
          },
        },
        update: {}, // already recorded, skip
        create: {
          monitoredEmailId: record.id,
          breachName: breach.Name,
          breachDate: breach.BreachDate || null,
          description: breach.Description || null,
          dataClasses: breach.DataClasses
            ? breach.DataClasses.join(", ")
            : null,
        },
      });
      savedBreaches.push(br.breachName);
    }

    return res.status(200).json({
      success: true,
      message: "Monitoring enabled successfully",
      monitoredEmail,
      baselineBreachCount: savedBreaches.length,
      baselineBreaches: savedBreaches,
    });
  } catch (error) {
    console.error("Enable monitoring error:", error.message);
    return res.status(500).json({ message: `Internal server error: ${error.message}` });
  }
};

/**
 * GET /api/monitoring/list
 * Returns all emails being monitored for the logged-in user.
 */
export const listMonitoredEmails = async (req, res) => {
  try {
    const userId = req.userId;

    const records = await prisma.monitoredEmail.findMany({
      where: { userId },
      select: {
        id: true,
        monitoredEmail: true,
        createdAt: true,
        _count: { select: { breachRecords: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, data: records });
  } catch (error) {
    console.error("List monitored emails error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * DELETE /api/monitoring/disable
 * Body: { monitoredEmail: "victim@example.com" }
 * Removes the monitored email and all its breach records.
 */
export const disableMonitoring = async (req, res) => {
  try {
    const userId = req.userId;
    const { monitoredEmail } = req.body;

    if (!monitoredEmail) {
      return res.status(400).json({ message: "monitoredEmail is required" });
    }

    const record = await prisma.monitoredEmail.findUnique({
      where: { userId_monitoredEmail: { userId, monitoredEmail } },
    });

    if (!record) {
      return res.status(404).json({ message: "Email not being monitored" });
    }

    // Cascade delete breach records first, then the monitored email
    await prisma.breachRecord.deleteMany({
      where: { monitoredEmailId: record.id },
    });
    await prisma.monitoredEmail.delete({ where: { id: record.id } });

    return res.status(200).json({
      success: true,
      message: `Monitoring disabled for ${monitoredEmail}`,
    });
  } catch (error) {
    console.error("Disable monitoring error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * GET /api/monitoring/breaches/:email
 * Returns stored breach records for the given monitored email.
 */
export const getStoredBreaches = async (req, res) => {
  try {
    const userId = req.userId;
    const { email } = req.params;

    const record = await prisma.monitoredEmail.findUnique({
      where: { userId_monitoredEmail: { userId, monitoredEmail: email } },
      include: {
        breachRecords: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!record) {
      return res.status(404).json({ message: "Email not being monitored" });
    }

    return res.status(200).json({
      success: true,
      monitoredEmail: email,
      breaches: record.breachRecords,
    });
  } catch (error) {
    console.error("Get stored breaches error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

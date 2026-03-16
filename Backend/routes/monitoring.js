const express = require("express");
const router = express.Router();
const { isAuth } = require("../Middleware/isAuth");
const {
  enableMonitoring,
  listMonitoredEmails,
  disableMonitoring,
  getStoredBreaches,
} = require("../controllers/monitoringController");

// All monitoring routes require authentication
router.use(isAuth);

// POST   /api/monitoring/enable      — enable monitoring + save baseline
router.post("/enable", enableMonitoring);

// GET    /api/monitoring/list        — list emails being monitored
router.get("/list", listMonitoredEmails);

// DELETE /api/monitoring/disable     — stop monitoring an email
router.delete("/disable", disableMonitoring);

// GET    /api/monitoring/breaches/:email  — view stored breach history
router.get("/breaches/:email", getStoredBreaches);

module.exports = router;

require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Please configure .env file.');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const monitoringRoutes = require('./routes/monitoring');
const { startCronJob } = require('./cron/breachCronJob');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/monitoring', monitoringRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Breach Monitoring System API is running' });
});

// ── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Start the daily cron job for breach monitoring
  startCronJob();
});

module.exports = app;

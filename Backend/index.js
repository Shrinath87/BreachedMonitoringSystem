import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

// ── Routes ────────────────────────────────────────────────────────────────────
import breachrouter from "./routes/breachroutes.js";
import authRouter from "./routes/auth.js";
import monitoringRouter from "./routes/monitoring.js";

// ── Middleware ─────────────────────────────────────────────────────────────────
import { isAuth } from "./Middleware/isAuth.js";

// ── Cron (Milestones 13 & 14) ─────────────────────────────────────────────────
import { startCronJob } from "./cron/breachCronJob.js";

dotenv.config(); // Load .env variables

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
   origin: ["http://localhost:3000", "http://localhost:5173"],
   credentials: true,
}));

// ── Register route groups ─────────────────────────────────────────────────────
app.use("/api/breach", breachrouter);
app.use("/api/auth", authRouter);
app.use("/api/monitoring", monitoringRouter);

app.get("/", (req, res) => {
    return res.status(200).json({ message: "It's working fine" });
});

app.get("/testmiddleware", isAuth, (req, res) => {
    return res.status(200).json({ message: "It's working fine" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);

    // Start the daily breach-check cron scheduler (Milestones 13 & 14)
    startCronJob();
});
import express from "express";
import dotenv from "dotenv";

dotenv.config(); // Load .env variables

const app = express();

app.get("/", (req, res) => {
    return res.status(200).json({ message: "It's working fine" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});
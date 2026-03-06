import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { isAuth } from "./Middleware/isAuth";
import cors from "cors"

dotenv.config(); // Load .env variables

const app = express();
app.use(express.json());
app.use(cookieParser()); 
app.use(cors({
   origin:"http://localhost:5173",
   credentials: true,
}))
app.get("/", (req, res) => {
    return res.status(200).json({ message: "It's working fine" });
});

app.get("/testmiddleware",isAuth, (req, res) => {
    return res.status(200).json({ message: "It's working fine" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});
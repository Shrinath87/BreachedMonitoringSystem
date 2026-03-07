import express from "express";
import { isAuth } from "../Middleware/isAuth.js";
import { checkBreach } from "../controllers/breachController.js";

const breachrouter = express.Router();

breachrouter.get("/get-breach/:email",  checkBreach);

export default breachrouter;


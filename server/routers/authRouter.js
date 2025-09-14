import express from "express";
import { authController } from "../controllers/authController.js";

const authRouter = express.Router();

authRouter.get("/google", authController.googleRedirect);
authRouter.get("/google/callback", authController.googleCallback);

export default authRouter;

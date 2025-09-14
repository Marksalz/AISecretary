import express from "express";
import authRouter from "./routers/authRouter.js";

const router = express.Router();

router.use("/auth", authRouter);

export default router;

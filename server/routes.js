import express from "express";
import authRouter from "./routers/authRouter.js";
import chatRouter from "./routers/chatRouter.js";

const router = express.Router();

router.use("/auth", authRouter);
router.use("/chat", chatRouter);

export default router;

import express from "express";
import authRouter from "./routers/authRouter.js";
import chatRouter from "./routers/chatRouter.js";
import meRouter from "./routers/meRouter.js";

const router = express.Router();

router.use("/auth", authRouter);
router.use("/chat", chatRouter);
router.use("/user", meRouter);

export default router;

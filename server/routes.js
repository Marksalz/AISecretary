import express from "express";
import authRouter from "./routers/authRouter.js";
import chatRouter from "./routers/chatRouter.js";
import eventsRouter from "./routers/eventsRouter.js";
const router = express.Router();

router.use("/auth", authRouter);
router.use("/chat", chatRouter);
router.use("/events", eventsRouter);

export default router;

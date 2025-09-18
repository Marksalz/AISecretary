import express from "express";
import authRouter from "./routers/authRouter.js";
import chatRouter from "./routers/chatRouter.js";
import meRouter from "./routers/meRouter.js";
import calendarRouter from "./routers/calendarRouter.js";

const router = express.Router();

router.use("/auth", authRouter);
router.use("/chat", chatRouter);
router.use("/user", meRouter);
router.use("/calendar", calendarRouter);

export default router;

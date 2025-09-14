import { Router } from "express";
import authRouter from "../routers/authRouter.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/chat", chatRoutes);

export default router;

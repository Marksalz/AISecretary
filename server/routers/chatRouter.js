import express from "express";
import { requireAuth } from "../middleware/middleware.js";
import { chatController } from "../controllers/chatController.js";

const chatRouter = express.Router();

chatRouter.post("/", requireAuth, chatController);

export default chatRouter;

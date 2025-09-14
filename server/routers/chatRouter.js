import express from "express";
import { chatController } from "../controllers/chatController.js";
import { requireAuth } from "../middleware/middleware.js";
import { handleChatMessage } from "../controllers/chatController.js";

const chatRouter = express.Router();

chatRouter.post("/", requireAuth, handleChatMessage(req, res));

export default chatRouter;

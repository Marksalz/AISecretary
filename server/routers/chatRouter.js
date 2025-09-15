import express from "express";
import { requireAuth } from "../middleware/middleware.js";
import { handleChatMessage } from "../controllers/chatController.js";

const chatRouter = express.Router();

chatRouter.post("/", requireAuth, handleChatMessage);

export default chatRouter;

import express from "express";
import { chatController } from "../controllers/chatController.js";
import { requireAuth } from "../middleware/middleware.js";

const chatRouter = express.Router();

// Map POST /chat to the controller
// Add auth middleware to POST /chat
chatRouter.post("/", requireAuth, chatController);

export default chatRouter;

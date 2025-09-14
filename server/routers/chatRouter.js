import express from "express";
import { chatController } from "../controllers/chatController.js";

const chatRouter = express.Router();

// Map POST /chat to the controller
chatRouter.post("/", chatController);

export default chatRouter;

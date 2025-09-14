import express from "express";
import ChatController from "../controllers/chatController.js";
import { validateMessage, validate } from "../utils/validation.js";

const chatRouter = express.Router();

// Map POST /chat to the controller with validation
chatRouter.post(
  "/",
  validateMessage,
  validate,
  ChatController.handleMessage
);

export default chatRouter;

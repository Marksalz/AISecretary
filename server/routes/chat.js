import express from "express";
import { chatController } from "../controllers/chatController.js";

const router = express.Router();

// Map POST /chat to the controller
router.post("/", chatController);

export default router;

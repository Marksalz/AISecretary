import express from "express";
import ChatController from "../controllers/chatController.js";

const router = express.Router();

// POST /chat
router.post("/", ChatController.handleMessage);

export default router;

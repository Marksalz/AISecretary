import express from 'express';
import { handleChatMessage } from '../controllers/chatController.js';

const router = express.Router();

// POST /chat - Send a message
router.post('/', (req, res) => {
  if (!req.body || !req.body.message) {
    return res.status(400).json({
      success: false,
      error: 'field messages is required'
    });
  }
  handleChatMessage(req, res);
});

export default router;

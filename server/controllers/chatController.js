import { handleMessage } from "../services/chat/chatService.js";

export async function chatController(req, res) {
  try {
    const { message } = req.body;

    if (!message) {
      return res
        .status(400)
        .json({ success: false, error: "Message required" });
    }

    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    if (!req.user.conversationHistory) {
      req.user.conversationHistory = [];
    }

    const response = await handleMessage(
      message,
      req.user.conversationHistory,
      req.user
    );

    const newMessage = {
      userMessage: message,
      botResponse: response.data,
      timestamp: new Date().toISOString(),
      requiresMoreInfo: response.requiresMoreInfo || false,
    };

    req.user.conversationHistory.push(newMessage);

    res.json(response);
  } catch (error) {
    console.error("ChatController error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

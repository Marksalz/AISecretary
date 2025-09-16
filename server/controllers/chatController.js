import { handleMessage } from "../services/chatServices.js";

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

    req.user.conversationHistory.push({
      userMessage: message,
      requiresMoreInfo: response.requiresMoreInfo || false,
    });

    res.json(response);
  } catch (error) {
    console.error("ChatController error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

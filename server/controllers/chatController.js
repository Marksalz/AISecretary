import { handleMessage } from "../services/chatServices.js";

let conversationHistory = [];

export async function chatController(req, res) {
  try {
    const { message } = req.body;

    if (!message) {
      return res
        .status(400)
        .json({ success: false, error: "Message required" });
    }

    // Pass req.user (set by JWT middleware) for Google Calendar integration
    const response = await handleMessage(
      message,
      conversationHistory,
      req.user
    );

    conversationHistory.push({
      userMessage: message,
      requiresMoreInfo: response.requiresMoreInfo || false,
    });

    res.json(response);
  } catch (error) {
    console.error("ChatController error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

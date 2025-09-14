import { askGemini } from "../services/chatServices.js";

/**
 * Handle POST /chat
 * Receives a message from the client and returns Gemini's response
 */
export const chatController = async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "No message provided" });
  }

  try {
    const botReply = await askGemini(message);
    res.json({ response: botReply });
  } catch (err) {
    console.error("Error in chatController:", err);
    res.status(500).json({ error: "Failed to get response from Gemini" });
  }
};

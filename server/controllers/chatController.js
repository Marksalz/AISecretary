import { addEventFromText, queryAgenda } from "../services/chatServices.js";

class ChatController {
  static async handleMessage(req, res) {
    const { message } = req.body;

    if (!message) return res.status(400).json({ error: "No message provided" });

    try {
      let responseText;

      const lower = message.toLowerCase();
      if (lower.startsWith("ajoute") || lower.startsWith("add")) {
        responseText = await addEventFromText(message);
      } else if (lower.startsWith("quand") || lower.startsWith("quel")) {
        const words = message.split(" ");
        const keyword = words[words.length - 1];
        responseText = await queryAgenda(keyword);
      } else {
        responseText =
          "Please start your message with 'Ajoute', 'Add', 'Quand' or 'Quel'.";
      }

      res.json({ response: responseText });
    } catch (err) {
      console.error("Error in ChatController:", err);
      res.status(500).json({ error: err.message });
    }
  }
}

export default ChatController;

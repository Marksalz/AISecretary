import { chatService } from "../services/chatServices.js";
import { addEvent } from "../utils/calendar.js";

class ChatController {
  /**
   * Handle incoming chat messages
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async handleMessage(req, res) {
    const { message } = req.body;

    try {
      let responseText;
      const trimmedMessage = message.trim();
      const lowerMessage = trimmedMessage.toLowerCase();

      // Route the message to the appropriate handler
      if (lowerMessage.startsWith("add")) {
        // Prepare the event data
        const eventData = await chatService.prepareEventData(trimmedMessage);
        
        // Add the event to the calendar
        await addEvent(
          eventData.title,
          eventData.start,
          eventData.end,
          eventData.description,
          eventData.location
        );
        
        // Format the success response
        responseText = chatService.formatEventForDisplay(eventData);
        
      } else if (lowerMessage.startsWith("when") || lowerMessage.startsWith("what")) {
        const keyword = trimmedMessage.split(" ").pop();
        responseText = await chatService.queryAgenda(keyword);
      } else {
        return res.status(400).json({
          success: false,
          error: "Invalid command. Please start your message with 'add', 'when' or 'what'."
        });
      }

      return res.status(200).json({ 
        success: true, 
        data: { response: responseText } 
      });

    } catch (error) {
      console.error("Error in ChatController:", error);
      
      // Default error response
      return res.status(500).json({
        success: false,
        error: error.message || "An unexpected error occurred. Please try again later.",
        ...(process.env.NODE_ENV === 'development' && { details: error.stack })
      });
    }
  }
}

export default ChatController;

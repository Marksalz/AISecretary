import { chatService } from "../services/chatServices.js";

class ChatController {
  /**
   * Handle incoming chat messages
   */
  static async handleMessage(req, res) {
    const { message } = req.body;

    try {
      const trimmedMessage = message.trim();
      const lowerMessage = trimmedMessage.toLowerCase();

      // Route the message to the appropriate handler
      if (lowerMessage.startsWith("add")) {
        // Prepare the event data without adding to calendar
        const eventData = await chatService.prepareEventData(trimmedMessage);
        
        return res.status(200).json({ 
          success: true, 
          data: { 
            message: "Event data prepared successfully",
            event: eventData
          }
        });
        
      } else {
        return res.status(400).json({
          success: false,
          error: "Invalid command. Please start your message with 'add' to create an event."
        });
      }

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

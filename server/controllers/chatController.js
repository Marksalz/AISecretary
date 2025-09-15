import { askGemini } from "../services/chatServices.js";

async function extractEventDetails(message) {
  const prompt = `Extract event details from this message in JSON format. Include these fields if mentioned:
  - title (string): The event title
  - start (ISO date string): Start time
  - end (ISO date string): End time
  - location (string): Event location
  - description (string): Event description

  Message: "${message}"
  
  Example response for "Add team meeting tomorrow at 2pm for 1 hour":
  {
    "title": "Team Meeting",
    "start": "2023-06-16T14:00:00+02:00",
    "end": "2023-06-16T15:00:00+02:00"
  }`;

  try {
    const response = await askGemini(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not extract event details");
    console.log(jsonMatch[0]);

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Error extracting event details:", error);
    throw new Error("Failed to extract event details");
  }
}

async function handleChatMessage(req, res) {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        error: "Message is required and must be a string.",
      });
    }

    const trimmedMessage = message.trim().toLowerCase();

    if (
      trimmedMessage.includes("add to calendar") ||
      trimmedMessage.startsWith("add ")
    ) {
      const eventDetails = await extractEventDetails(trimmedMessage);

      // Directly call the calendar event creation function
      try {
        const user = req.user;
        if (!user) {
          return res
            .status(401)
            .json({ success: false, error: "Unauthorized" });
        }
        const accessToken = user.googleAccessToken;
        const refreshToken = user.googleRefreshToken;
        if (!accessToken || !refreshToken) {
          return res
            .status(400)
            .json({
              success: false,
              error: "Google tokens not available on user token",
            });
        }

        // Import and call the helper function
        const { addEventToGoogleCalendar } = await import("./eventsHelper.js");
        const calendarResult = await addEventToGoogleCalendar(
          eventDetails,
          accessToken,
          refreshToken
        );

        return res.status(200).json({
          success: true,
          data: {
            type: "calendar_event",
            message: "Event added to your Google Calendar",
            calendar: calendarResult,
            event: eventDetails,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (err) {
        console.error("Error adding event to calendar:", err);
        return res
          .status(500)
          .json({
            success: false,
            error: err.message || "Failed to add event to calendar",
          });
      }
    }

    const aiResponse = await askGemini(trimmedMessage);

    return res.status(200).json({
      success: true,
      data: {
        type: "message",
        message: aiResponse,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in handleChatMessage:", error);
    return res.status(500).json({
      success: false,
      error:
        error.message || "An error occurred while processing your message.",
    });
  }
}

export { handleChatMessage };

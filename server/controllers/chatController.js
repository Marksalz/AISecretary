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

      try {
        // Forward the cookie header from the incoming request
        const cookieHeader = req.get("Cookie") || req.headers.cookie || "";
        const response = await fetch(`http://localhost:3000/events/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: cookieHeader,
          },
          body: JSON.stringify(eventDetails),
        });

        const calendarResult = await response
          .json()
          .catch(() => ({ error: "Invalid JSON from calendar service" }));

        if (!response.ok) {
          return res
            .status(response.status)
            .json({ success: false, error: calendarResult });
        }

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
        console.error("Error forwarding event to calendar endpoint:", err);
        return res
          .status(500)
          .json({ success: false, error: "Failed to add event to calendar" });
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

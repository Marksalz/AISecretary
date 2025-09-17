import { getEventsFromGoogleCalendar } from "../../../services/eventServices.js";
import { createChatResponse } from "../responseHandler.js";

export default async function readEvent(
  googleAccessToken,
  googleRefreshToken,
  timeMin,
  timeMax
) {
  try {
    const events = await getEventsFromGoogleCalendar(
      googleAccessToken,
      googleRefreshToken,
      timeMin,
      timeMax
    );

    if (!events || events.length === 0) {
      return {
        success: true,
        data: {
          type: "calendar_event_query",
          message: "No events found in the specified range.",
          events: [],
        },
      };
    }

    // Format all events for display (user-friendly)
    const formatDate = (dateStr) => {
      if (!dateStr) return "Unknown";
      const date = new Date(dateStr);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const formattedEvents = events.map((event, idx) => {
      const start =
        event.start?.dateTime || event.start?.date || "Unknown start time";
      const end = event.end?.dateTime || event.end?.date || "Unknown end time";
      const location = event.location ? `📍 ${event.location}` : "";
      return (
        `${idx + 1}. "${event.summary || "No Title"}"\n` +
        (location ? `${location}\n` : "") +
        `🗓️ ${formatDate(start)} - ${formatDate(end)}`
      );
    });

    const foundMsg =
      `Found ${events.length} event(s):\n\n` + formattedEvents.join("\n\n");

    return {
      success: true,
      data: {
        type: "calendar_event_query",
        message: foundMsg,
        events: events,
      },
    };
  } catch (err) {
    return createChatResponse("Failed to read events: " + err.message);
  }
}

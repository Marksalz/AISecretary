import {
  getEventsFromGoogleCalendar,
  deleteEventFromGoogleCalendar,
} from "../../../services/eventServices.js";
import { createChatResponse } from "../handlers/responseHandler.js";

export default async function deleteEvent(
  data,
  googleAccessToken,
  googleRefreshToken,
  keyword = null
) {
  try {
    // Require a title or keyword to search for the event
    if (!data.title && !keyword) {
      return createChatResponse(
        "Please specify the event title or keyword to delete."
      );
    }
    // Fetch events to find the matching one
    const events = await getEventsFromGoogleCalendar(
      googleAccessToken,
      googleRefreshToken,
      data.timeMin,
      data.timeMax
    );
    if (!events || events.length === 0) {
      return createChatResponse("No events found to delete.");
    }
    // Try to find the event by title or keyword
    const searchTerm = data.title || keyword;

    const eventToDelete = events.find(
      (event) =>
        event.summary &&
        event.summary.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (!eventToDelete) {
      return createChatResponse(
        `No event found with title containing "${searchTerm}".`
      );
    }
    await deleteEventFromGoogleCalendar(
      eventToDelete.id,
      googleAccessToken,
      googleRefreshToken
    );
    return {
      success: true,
      data: {
        type: "calendar_event_deleted",
        message: `Event "${eventToDelete.summary}" deleted successfully.`,
        eventId: eventToDelete.id,
      },
    };
  } catch (err) {
    return createChatResponse("Failed to delete event: " + err.message);
  }
}

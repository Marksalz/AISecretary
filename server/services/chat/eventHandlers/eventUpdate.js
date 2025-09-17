import {
  getEventsFromGoogleCalendar,
  updateEventInGoogleCalendar,
} from "../../../services/eventServices.js";
import { createChatResponse } from "../responseHandler.js";
import { askGemini } from "../../../ai/gemini.js";

export default async function updateEvent(
  data,
  googleAccessToken,
  googleRefreshToken,
  message,
  keyword = null
) {
  try {
    if (!data.title && !keyword) {
      return createChatResponse(
        "Please specify the event title or keyword to update."
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
      return createChatResponse("No events found to update.");
    }
    const searchTerm = data.title || keyword;
    const eventToUpdate = events.find(
      (event) =>
        event.summary &&
        event.summary.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (!eventToUpdate) {
      return createChatResponse(
        `No event found with title containing "${searchTerm}".`
      );
    }

    // Ask Gemini which fields to update, providing the full event and user message
    const updatePrompt = `You are updating a calendar event. Here is the current event as JSON:\n${JSON.stringify(
      {
        title: eventToUpdate.summary,
        start: eventToUpdate.start?.dateTime || eventToUpdate.start?.date,
        end: eventToUpdate.end?.dateTime || eventToUpdate.end?.date,
        location: eventToUpdate.location || null,
        description: eventToUpdate.description || null,
      },
      null,
      2
    )}\n\nUser wants to update: "${message}"\n\nReturn a JSON object with only the fields that should be changed and their new values. If a field should not be changed, do not include it in the object. Example: { "title": "New Title", "start": "..." }`;
    const geminiUpdate = await askGemini(updatePrompt);
    if (
      !geminiUpdate ||
      typeof geminiUpdate !== "object" ||
      geminiUpdate.error
    ) {
      return createChatResponse(
        "Sorry, I couldn't determine which fields to update. Please specify the changes."
      );
    }

    // Merge Gemini's updated fields into the event
    const updateDetails = {
      title:
        geminiUpdate.title !== undefined
          ? geminiUpdate.title
          : eventToUpdate.summary,
      start:
        geminiUpdate.start !== undefined
          ? geminiUpdate.start
          : eventToUpdate.start?.dateTime || eventToUpdate.start?.date,
      end:
        geminiUpdate.end !== undefined
          ? geminiUpdate.end
          : eventToUpdate.end?.dateTime || eventToUpdate.end?.date,
      location:
        geminiUpdate.location !== undefined
          ? geminiUpdate.location
          : eventToUpdate.location,
      description:
        geminiUpdate.description !== undefined
          ? geminiUpdate.description
          : eventToUpdate.description,
    };

    const updated = await updateEventInGoogleCalendar(
      eventToUpdate.id,
      updateDetails,
      googleAccessToken,
      googleRefreshToken
    );
    return {
      success: true,
      data: {
        type: "calendar_event_updated",
        message: "Event updated: " + updated.summary,
        event: updated,
      },
    };
  } catch (err) {
    return createChatResponse("Failed to update event: " + err.message);
  }
}

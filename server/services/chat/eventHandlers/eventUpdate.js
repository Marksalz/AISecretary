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
    const updatePrompt = `You are updating a calendar event.
Here is the current event as JSON:
${JSON.stringify(
  {
    title: eventToUpdate.summary,
    start: eventToUpdate.start?.dateTime || eventToUpdate.start?.date,
    end: eventToUpdate.end?.dateTime || eventToUpdate.end?.date,
    location: eventToUpdate.location || null,
    description: eventToUpdate.description || null,
  },
  null,
  2
)}

User wants to update: "${message}"

Rules:
- Output ONLY a JSON object, no extra text or code fences.
- Include only the fields that should change among: "title", "start", "end", "location", "description".
- For any dates/times, return ISO 8601 with the system's local timezone offset (e.g., 2025-09-18T09:00:00+03:00).
- If the user mentions a time without specifying start/end, assume it is the start time unless the end time is clearly indicated.

Examples:
{ "start": "2025-09-18T09:00:00+03:00" }
{ "title": "Sprint Planning" }
{ "location": "Room B, 3rd floor" }`;

    let geminiUpdate = await askGemini(updatePrompt);
    // If the model returned text, try to parse JSON out of it
    if (typeof geminiUpdate === "string") {
      let text = geminiUpdate
        .trim()
        .replace(/^```json/i, "")
        .replace(/^```/, "")
        .replace(/```$/, "")
        .trim();
      try {
        geminiUpdate = JSON.parse(text);
      } catch (e) {
        return createChatResponse(
          "Sorry, I couldn't determine which fields to update. Please specify the changes."
        );
      }
    }
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

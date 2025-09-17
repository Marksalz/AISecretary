import {
  normalize,
  isConfirmation,
  isCancellation,
} from "../../utils/messageUtils.js";
import { askGemini } from "../../ai/gemini.js";
import {
  handleEventRequest,
  confirmEvent,
  updatePendingEvent,
  getPendingEvent,
  cancelEvent,
} from "./eventHandlers/eventCreation.js";
import { handleEventQuery } from "./eventHandlers/eventQuery.js";
import {
  createPendingResponse,
  createChatResponse,
} from "./responseHandler.js";
import {
  getEventsFromGoogleCalendar,
  updateEventInGoogleCalendar,
  deleteEventFromGoogleCalendar,
  addEventToGoogleCalendar,
} from "../../services/eventServices.js";

export async function handleMessage(
  message,
  conversationHistory = [],
  user = {}
) {
  const pendingEvent = getPendingEvent();
  if (pendingEvent) {
    const normalizedMsg = normalize(message);
    if (isConfirmation(normalizedMsg)) {
      const res = await confirmEvent(user);
      return res;
    }
    if (isCancellation(normalizedMsg)) {
      return cancelEvent();
    }
    if (/location/i.test(normalizedMsg)) {
      const location = message.replace(/.*location\s*/i, "").trim();
      updatePendingEvent({ location });
      return createPendingResponse(
        `Updated location to "${location}". Confirm or cancel?`
      );
    }
    if (/title/i.test(normalizedMsg)) {
      const title = message.replace(/.*title\s*/i, "").trim();
      updatePendingEvent({ title });
      return createPendingResponse(
        `Updated title to "${title}". Confirm or cancel?`
      );
    }
    return createPendingResponse(
      `You are currently creating an event: "${pendingEvent.title}". Confirm or cancel?`
    );
  }

  // Use Gemini to extract intent and data
  let aiResponse;
  try {
    aiResponse = await askGemini(message, true); // now returns an object
    if (!aiResponse || aiResponse.error)
      throw new Error(aiResponse?.error || "No response");
  } catch (err) {
    return createChatResponse(
      "Sorry, I couldn't understand your request. Please try again."
    );
  }

  // Route to correct event service based on intent
  const { type, data, keyword } = aiResponse;

  if (type === "add") {
    // Add event directly
    try {
      const created = await addEventToGoogleCalendar(
        data,
        user.googleAccessToken,
        user.googleRefreshToken
      );
      return {
        success: true,
        data: {
          type: "calendar_event_added",
          message: `✅ Event "${created.summary}" has been added to your Google Calendar.`,
          event: created,
        },
      };
    } catch (err) {
      return createChatResponse("Failed to add event: " + err.message);
    }
  } else if (type === "read") {
    // Read events in the given time range
    try {
      const events = await getEventsFromGoogleCalendar(
        user.googleAccessToken,
        user.googleRefreshToken,
        data.timeMin,
        data.timeMax
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
        const end =
          event.end?.dateTime || event.end?.date || "Unknown end time";
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
  } else if (type === "update") {
    // Improved update: after finding the event, ask Gemini which fields to update, then update only those fields
    try {
      if (!data.title && !keyword) {
        return createChatResponse(
          "Please specify the event title or keyword to update."
        );
      }
      // Fetch events to find the matching one
      const events = await getEventsFromGoogleCalendar(
        user.googleAccessToken,
        user.googleRefreshToken,
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
        user.googleAccessToken,
        user.googleRefreshToken
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
  } else if (type === "delete") {
    // Delete event by searching for the event first to get its eventId
    try {
      // Require a title or keyword to search for the event
      if (!data.title && !keyword) {
        return createChatResponse(
          "Please specify the event title or keyword to delete."
        );
      }
      // Fetch events to find the matching one
      const events = await getEventsFromGoogleCalendar(
        user.googleAccessToken,
        user.googleRefreshToken,
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
        user.googleAccessToken,
        user.googleRefreshToken
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

  // Fallback: just chat
  return createChatResponse(
    "Sorry, I couldn't understand your request. Please try again."
  );
}

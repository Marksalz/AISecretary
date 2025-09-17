import {
  normalize,
  isConfirmation,
  isCancellation,
} from "../../utils/messageUtils.js";
import { askGemini } from "../../ai/gemini.js";
import {
  confirmEvent,
  updatePendingEvent,
  getPendingEvent,
  cancelEvent,
} from "./eventHandlers/eventCreation.js";
import {
  createPendingResponse,
  createChatResponse,
} from "./responseHandler.js";

import updateEvent from "./eventHandlers/eventUpdate.js";
import deleteEvent from "./eventHandlers/eventDelete.js";
import readEvent from "./eventHandlers/eventRead.js";
import createEvent from "./eventHandlers/eventCreate.js";

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
    return await createEvent(
      data,
      user.googleAccessToken,
      user.googleRefreshToken
    );
  } else if (type === "read") {
    // Read events in the given time range
    return await readEvent(
      user.googleAccessToken,
      user.googleRefreshToken,
      data.timeMin,
      data.timeMax
    );
  } else if (type === "update") {
    // Improved update: after finding the event, ask Gemini which fields to update, then update only those fields
    return await updateEvent(
      data,
      user.googleAccessToken,
      user.googleRefreshToken,
      message,
      keyword
    );
  } else if (type === "delete") {
    // Delete event by searching for the event first to get its eventId
    return await deleteEvent(
      data,
      user.googleAccessToken,
      user.googleRefreshToken,
      keyword
    );
  }

  // Fallback: just chat
  return createChatResponse(
    "Sorry, I couldn't understand your request. Please try again."
  );
}

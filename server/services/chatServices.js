import {
  normalize,
  isEventRequest,
  isEventQuery,
  isConfirmation,
  isCancellation,
} from "../utils/messageUtils.js";
import {
  handleEventRequest,
  handleEventQuery,
  confirmEvent,
} from "./eventHandler.js";
import { askGemini } from "../ai/gemini.js";

let pendingEvent = null;

export async function handleMessage(
  message,
  conversationHistory = [],
  user = {}
) {
  const normalizedMsg = normalize(message);

  if (pendingEvent) {
    if (isConfirmation(normalizedMsg)) {
      const res = await confirmEvent(pendingEvent, user);
      pendingEvent = null;
      return res;
    }

    if (isCancellation(normalizedMsg)) {
      const res = {
        success: true,
        data: {
          type: "calendar_event_cancelled",
          message: "❌ Event creation cancelled.",
          event: pendingEvent,
        },
      };
      pendingEvent = null;
      return res;
    }

    if (/location/i.test(normalizedMsg)) {
      pendingEvent.location = message.replace(/.*location\s*/i, "").trim();
      return _pendingResponse(
        `Updated location to "${pendingEvent.location}". Confirm or cancel?`
      );
    }
    if (/title/i.test(normalizedMsg)) {
      pendingEvent.title = message.replace(/.*title\s*/i, "").trim();
      return _pendingResponse(
        `Updated title to "${pendingEvent.title}". Confirm or cancel?`
      );
    }

    return _pendingResponse(
      `You are currently creating an event: "${pendingEvent.title}". Confirm or cancel?`
    );
  }

  if (isEventRequest(normalizedMsg)) {
    const res = await handleEventRequest(message, user);
    if (res.data?.event) pendingEvent = res.data.event;
    return res;
  }

  if (isEventQuery(normalizedMsg)) {
    return handleEventQuery();
  }

  const prompt = `You are a friendly AI assistant. Answer naturally.

User: "${message}"
AI:`;
  const answer = await askGemini(prompt);

  return {
    success: true,
    data: {
      type: "chat_response",
      message: answer,
    },
  };
}

function _pendingResponse(message) {
  return {
    success: true,
    requiresConfirmation: true,
    data: {
      type: "calendar_event_pending",
      message,
      event: pendingEvent,
    },
  };
}

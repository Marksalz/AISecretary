import { normalize, isEventRequest, isEventQuery, isConfirmation, isCancellation } from "../../utils/messageUtils.js";
import { askGemini } from "../../ai/gemini.js";
import { handleEventRequest, confirmEvent, updatePendingEvent, getPendingEvent, cancelEvent } from "./eventHandlers/eventCreation.js";
import { handleEventQuery } from "./eventHandlers/eventQuery.js";
import { createPendingResponse, createChatResponse } from "./responseHandler.js";

export async function handleMessage(message, conversationHistory = [], user = {}) {
  const normalizedMsg = normalize(message);
  const pendingEvent = getPendingEvent();

  if (pendingEvent) {
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

  if (isEventRequest(normalizedMsg)) {
    return handleEventRequest(message);
  }

  if (isEventQuery(normalizedMsg)) {
    return handleEventQuery();
  }

  const prompt = `You are a friendly AI assistant. Answer naturally.

User: "${message}"
AI:`;
  const answer = await askGemini(prompt);
  
  return createChatResponse(answer);
}

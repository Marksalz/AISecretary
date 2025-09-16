import { getPendingEvent } from "./eventHandlers/eventCreation.js";

export function createPendingResponse(message) {
  const pendingEvent = getPendingEvent();
  
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

export function createChatResponse(message) {
  return {
    success: true,
    data: {
      type: "chat_response",
      message,
    },
  };
}

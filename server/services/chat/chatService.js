import {
  normalize,
  isConfirmation,
  isCancellation,
} from "../../utils/messageUtils.js";
import { askGemini } from "../../ai/gemini.js";
import {
  detectTimeUpdate,
  detectTitleUpdate,
  detectLocationUpdate,
} from "../../ai/prompts.js";
import {
  confirmEvent,
  updatePendingEvent,
  getPendingEvent,
  cancelEvent,
  setPendingEvent,
  clearPendingEvent,
} from "./eventHandlers/eventConfirmation.js";
import {
  createPendingResponse,
  createChatResponse,
} from "./responseHandler.js";

import updateEvent from "./eventHandlers/eventUpdate.js";
import deleteEvent from "./eventHandlers/eventDelete.js";
import readEvent from "./eventHandlers/eventRead.js";
import createEvent from "./eventHandlers/eventCreate.js";

// Store pending action type (add, update, delete) and data
let pendingAction = null;
function setPendingAction(action) {
  pendingAction = action;
}
function getPendingAction() {
  return pendingAction;
}
function clearPendingAction() {
  pendingAction = null;
}

export async function handleMessage(
  message,
  conversationHistory = [],
  user = {}
) {
  const pendingEvent = getPendingEvent();
  const pendingActionObj = getPendingAction();
  let event;
  if (pendingEvent || pendingActionObj) {
    const normalizedMsg = normalize(message);

    if (isConfirmation(normalizedMsg)) {
      // Confirm the pending action
      if (pendingActionObj) {
        const {
          type,
          data,
          user: actionUser,
          keyword,
          updateDetails,
          eventId,
        } = pendingActionObj;
        clearPendingAction();
        if (type === "add") {
          // Confirm create
          const created = await createEvent(
            data,
            actionUser.googleAccessToken,
            actionUser.googleRefreshToken
          );
          clearPendingEvent();
          return created;
        } else if (type === "update") {
          // Confirm update
          // Actually perform the update now
          const updated = await updateEvent(
            data,
            actionUser.googleAccessToken,
            actionUser.googleRefreshToken,
            updateDetails.message,
            keyword
          );
          clearPendingEvent();
          return updated;
        } else if (type === "delete") {
          // Confirm delete
          // Actually perform the delete now
          const deleted = await deleteEvent(
            data,
            actionUser.googleAccessToken,
            actionUser.googleRefreshToken,
            keyword
          );
          clearPendingEvent();
          return deleted;
        }
      } else {
        // Fallback to event confirmation
        const res = await confirmEvent(user);
        return res;
      }
    }
    if (isCancellation(normalizedMsg)) {
      clearPendingAction();
      return cancelEvent();
    }
    // Heuristic triggers for update types
    const timeTrigger =
      /\b(start( time)?|begin(s|ning)?|end( time)?|finish(es|ing)?|earlier|later|at\s+\d{1,2}(:\d{2})?\s*(am|pm)?|today|tomorrow|tonight|noon|midnight|morning|afternoon|evening|night|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;
    const titleTrigger =
      /\b(title|rename|call it|name it|let's call it|change[^\n]*title|new title)\b/i;
    const locationTrigger =
      /\b(location|venue|room|office|address|place|meet at|meeting at|on (zoom|google meet|teams)|zoom|google meet|teams|change\s+(the\s+)?location\s+to|set\s+(the\s+)?location\s+to|move (it )?to|relocate)\b|https?:\/\//i;

    // Try time update via model
    if (timeTrigger.test(normalizedMsg)) {
      try {
        const res = await detectTimeUpdate(message);
        if (res && !res.error && res.time && res.type) {
          if (res.type === "start") {
            event = updatePendingEvent({ start: res.time });
            if (pendingActionObj) pendingActionObj.data = event;
            return createPendingResponse(
              `Updated start time to "${res.time}". Confirm or cancel?`
            );
          }
          if (res.type === "end") {
            event = updatePendingEvent({ end: res.time });
            if (pendingActionObj) pendingActionObj.data = event;
            return createPendingResponse(
              `Updated end time to "${res.time}". Confirm or cancel?`
            );
          }
        }
      } catch (_) {
        // fall through to other handlers
      }
    }

    // Try title update via model
    if (titleTrigger.test(normalizedMsg)) {
      try {
        const res = await detectTitleUpdate(message);
        if (res && !res.error && res.title) {
          event = updatePendingEvent({ title: res.title.trim() });
          if (pendingActionObj) pendingActionObj.data = event;
          return createPendingResponse(
            `Updated title to "${res.title}". Confirm or cancel?`
          );
        }
      } catch (_) {
        // ignore and continue
      }
    }

    // Try location update via model
    if (locationTrigger.test(normalizedMsg)) {
      try {
        const res = await detectLocationUpdate(message);

        console.log(`res: `, res);

        if (res && !res.error && res.location) {
          event = updatePendingEvent({ location: res.location.trim() });
          if (pendingActionObj) pendingActionObj.data = event;
          return createPendingResponse(
            `Updated location to "${res.location}". Confirm or cancel?`
          );
        }
      } catch (_) {
        // ignore and continue
      }
    }

    return createPendingResponse(
      `You are currently creating or modifying an event. Confirm or cancel?`
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
    // Store pending event and ask for confirmation
    setPendingEvent(data);
    setPendingAction({ type: "add", data, user });
    return createPendingResponse(
      `Do you want to add this event?\n\nTitle: ${
        data.title || "N/A"
      }\nStart: ${data.start || "N/A"}\nEnd: ${data.end || "N/A"}\nLocation: ${
        data.location || "N/A"
      }`
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
    // Store pending update and ask for confirmation
    setPendingEvent(data);
    setPendingAction({
      type: "update",
      data,
      user,
      keyword,
      updateDetails: { message },
    });
    return createPendingResponse(
      `Do you want to update the event "${
        data.title || keyword || "N/A"
      }"? Please confirm or cancel.`
    );
  } else if (type === "delete") {
    // Store pending delete and ask for confirmation
    setPendingEvent(data);
    setPendingAction({ type: "delete", data, user, keyword });
    return createPendingResponse(
      `Are you sure you want to delete the event "${
        data.title || keyword || "N/A"
      }"? Please confirm or cancel.`
    );
  } else if (type === "talk") {
    // Fallback: just chat like a person
    const prompt = `You are a friendly AI assistant for a chat application that also manages a user's calendar.\n- Always answer naturally and informally, as if chatting with a friend.\n- Keep responses short, clear, and engaging.\n\nUser: "${message}"\nAI:`;
    const answer = await askGemini(prompt);
    return {
      success: true,
      data: {
        type: "chat_response",
        message: answer?.message || answer,
      },
    };
  }
}

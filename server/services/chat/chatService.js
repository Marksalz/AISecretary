import {
  normalize,
  isConfirmation,
  isCancellation,
} from "../../utils/messageUtils.js";
import { askGemini } from "../../ai/gemini.js";
// detection helpers are now used within pendingFlowHandler
import {
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
import { handlePendingFlow } from "./pendingFlowHandler.js";
import { setPendingAction } from "./pendingAction.js";
import { getEventsFromGoogleCalendar } from "../eventServices.js";
import { isBusyAt } from "../../services/availability.js";

export async function handleMessage(
  message,
  conversationHistory = [],
  user = {}
) {
  // Delegate pending flow handling to a dedicated module
  const pendingHandled = await handlePendingFlow(message);
  if (pendingHandled) return pendingHandled;

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
    // Availability questions like "Am I available tomorrow at 3pm?"
    const availabilityCue = /\b(available|free|busy)\b/i.test(message);
    const hasMoment = data?.timeMin && data?.timeMax;
    let momentLike = false;
    if (hasMoment) {
      const tMin = new Date(data.timeMin).getTime();
      const tMax = new Date(data.timeMax).getTime();
      if (!Number.isNaN(tMin) && !Number.isNaN(tMax)) {
        momentLike = Math.abs(tMax - tMin) <= 5 * 60 * 1000; // <= 5 minutes window
      }
    }

    if (availabilityCue && momentLike) {
      try {
        const instantIso = data.timeMin || data.timeMax;
        const conflict = await isBusyAt(
          user.googleAccessToken,
          user.googleRefreshToken,
          instantIso
        );

        const fmtTime = (d) =>
          new Date(d).toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          });

        const instant = new Date(instantIso);
        if (conflict) {
          let s, e;
          if (conflict.start?.dateTime) s = new Date(conflict.start.dateTime);
          else if (conflict.start?.date)
            s = new Date(`${conflict.start.date}T00:00:00`);
          if (conflict.end?.dateTime) e = new Date(conflict.end.dateTime);
          else if (conflict.end?.date)
            e = new Date(`${conflict.end.date}T00:00:00`);
          const title = conflict.summary || "(no title)";
          return {
            success: true,
            data: {
              type: "calendar_availability",
              message: `You are busy at ${fmtTime(
                instant
              )}: "${title}" ${fmtTime(s)} - ${fmtTime(e)}`,
              events: [conflict],
            },
          };
        } else {
          return {
            success: true,
            data: {
              type: "calendar_availability",
              message: `You are available at ${fmtTime(instant)}.`,
              events: [],
            },
          };
        }
      } catch (err) {
        // Fallback to standard read if availability check fails
      }
    }

    // Default: read events in the given time range
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

import {
  normalize,
  isConfirmation,
  isCancellation,
} from "../../utils/messageUtils.js";
import {
  confirmEvent,
  updatePendingEvent,
  getPendingEvent,
  cancelEvent,
  clearPendingEvent,
} from "./eventHandlers/eventConfirmation.js";
import { createPendingResponse } from "./responseHandler.js";
import {
  detectTimeUpdate,
  detectTitleUpdate,
  detectLocationUpdate,
} from "../../ai/prompts.js";
import { getPendingAction, clearPendingAction } from "./pendingAction.js";
import createEvent from "./eventHandlers/eventCreate.js";
import updateEvent from "./eventHandlers/eventUpdate.js";
import deleteEvent from "./eventHandlers/eventDelete.js";
import { findConflicts } from "../availability.js";

export async function handlePendingFlow(message) {
  const pendingEvent = getPendingEvent();
  const pendingActionObj = getPendingAction();
  if (!pendingEvent && !pendingActionObj) return null; // not in pending flow

  const normalizedMsg = normalize(message);

  if (isConfirmation(normalizedMsg)) {
    if (!pendingActionObj) {
      return await confirmEvent();
    }
    const {
      type,
      data,
      user: actionUser,
      keyword,
      updateDetails,
    } = pendingActionObj;
    // Execute immediately (no defers)
    if (type === "add") {
      // Prevent overlapping events
      if (data?.start && data?.end) {
        const conflicts = await findConflicts(
          actionUser.googleAccessToken,
          actionUser.googleRefreshToken,
          data.start,
          data.end
        );
        if (conflicts.length > 0) {
          const first = conflicts[0];
          let s, e;
          if (first.start?.dateTime) s = new Date(first.start.dateTime);
          else if (first.start?.date)
            s = new Date(`${first.start.date}T00:00:00`);
          if (first.end?.dateTime) e = new Date(first.end.dateTime);
          else if (first.end?.date) e = new Date(`${first.end.date}T00:00:00`);
          const fmt = (d) =>
            new Date(d).toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            });
          const title = first.summary || "(no title)";
          return createPendingResponse(
            `That time overlaps with an existing event: "${title}" ${fmt(
              s
            )} - ${fmt(
              e
            )}. Please choose another time, or modify the start/end.`
          );
        }
      }
      const created = await createEvent(
        data,
        actionUser.googleAccessToken,
        actionUser.googleRefreshToken
      );
      clearPendingEvent();
      clearPendingAction();
      return created;
    } else if (type === "update") {
      const updated = await updateEvent(
        data,
        actionUser.googleAccessToken,
        actionUser.googleRefreshToken,
        updateDetails.message,
        keyword
      );
      clearPendingEvent();
      clearPendingAction();
      return updated;
    } else if (type === "delete") {
      const deleted = await deleteEvent(
        data,
        actionUser.googleAccessToken,
        actionUser.googleRefreshToken,
        keyword
      );
      clearPendingEvent();
      clearPendingAction();
      return deleted;
    }
    return await confirmEvent();
  }

  if (isCancellation(normalizedMsg)) {
    clearPendingAction();
    return cancelEvent();
  }

  // Triggers
  const timeTrigger =
    /\b(start( time)?|begin(s|ning)?|end( time)?|finish(es|ing)?|earlier|later|at\s+\d{1,2}(:\d{2})?\s*(am|pm)?|today|tomorrow|tonight|noon|midnight|morning|afternoon|evening|night|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;
  const titleTrigger =
    /\b(title|rename|call it|name it|let's call it|change[^\n]*title|new title)\b/i;
  const locationTrigger =
    /\b(location|venue|room|office|address|place|meet at|meeting at|on (zoom|google meet|teams)|zoom|google meet|teams|change\s+(the\s+)?location\s+to|set\s+(the\s+)?location\s+to|move (it )?to|relocate)\b|https?:\/\//i;

  // Try time update
  if (timeTrigger.test(normalizedMsg)) {
    try {
      const res = await detectTimeUpdate(message);
      if (res && !res.error && res.time && res.type) {
        let event;
        if (res.type === "start")
          event = updatePendingEvent({ start: res.time });
        if (res.type === "end") event = updatePendingEvent({ end: res.time });
        if (event) {
          if (pendingActionObj) pendingActionObj.data = event;
          return createPendingResponse(
            `Updated ${res.type} time to "${res.time}". Confirm or cancel?`
          );
        }
      }
    } catch {}
  }

  // Try title update
  if (titleTrigger.test(normalizedMsg)) {
    try {
      const res = await detectTitleUpdate(message);
      if (res && !res.error && res.title) {
        const event = updatePendingEvent({ title: res.title.trim() });
        if (pendingActionObj) pendingActionObj.data = event;
        return createPendingResponse(
          `Updated title to "${res.title}". Confirm or cancel?`
        );
      }
    } catch {}
  }

  // Try location update
  if (
    locationTrigger.test(normalizedMsg) ||
    /\bchange\s+(the\s+)?location\s+to\b/i.test(normalizedMsg)
  ) {
    try {
      const res = await detectLocationUpdate(message);
      if (res && !res.error && res.location) {
        const event = updatePendingEvent({ location: res.location.trim() });
        if (pendingActionObj) pendingActionObj.data = event;
        return createPendingResponse(
          `Updated location to "${res.location}". Confirm or cancel?`
        );
      }
    } catch {}
  }

  return createPendingResponse(
    `You are currently creating or modifying an event. Confirm or cancel?`
  );
}

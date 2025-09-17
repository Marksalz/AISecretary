import { addEventToGoogleCalendar } from "../../eventServices.js";

let pendingEvent = null;

// Get the current pending event (if any)
export function getPendingEvent() {
  return pendingEvent;
}

// Set the pending event (used when user starts add/update/delete flow)
export function setPendingEvent(event) {
  pendingEvent = event;
}

// Clear the pending event (after confirmation or cancellation)
export function clearPendingEvent() {
  pendingEvent = null;
}

// Confirm the pending event (called after user confirmation)
export function confirmEvent() {
  if (!pendingEvent) {
    throw new Error("No pending event to confirm");
  }
  const event = { ...pendingEvent };
  clearPendingEvent();
  return {
    success: true,
    data: {
      type: "calendar_event_confirmed",
      message: `✅ Event "${event.summary}" has been confirmed.`,
      event,
    },
  };
}

// Cancel the pending event (called after user cancellation)
export function cancelEvent() {
  const event = { ...pendingEvent };
  clearPendingEvent();
  return {
    success: true,
    data: {
      type: "calendar_event_cancelled",
      message: "❌ Calendar event cancelled.",
      event,
    },
  };
}

// Update fields of the pending event (e.g. title/location) before confirmation
export function updatePendingEvent(updates) {
  if (!pendingEvent) {
    throw new Error("No pending event to update");
  }
  pendingEvent = { ...pendingEvent, ...updates };
  console.log(`pending event: `, pendingEvent);

  return pendingEvent;
}

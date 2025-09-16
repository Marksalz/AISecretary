import { askGemini } from "../../../ai/gemini.js";
import { addEventToGoogleCalendar } from "../../eventServices.js";

let pendingEvent = null;

export function getPendingEvent() {
  return pendingEvent;
}

export function setPendingEvent(event) {
  pendingEvent = event;
}

export function clearPendingEvent() {
  pendingEvent = null;
}

export async function handleEventRequest(message) {
    const prompt = `
    You are an intelligent assistant that extracts event details from user messages. 
    
    Always return ONLY a valid JSON object with the following fields:
    - title (string, provide a sensible default if missing)
    - start (ISO date string, assume local timezone +03:00, estimate a reasonable time if not specified)
    - end (ISO date string, assume 1 hour duration if not specified)
    - location (string, use empty string if unknown)
    - description (string, use empty string if unknown)
    
    The current time is: ${new Date().toISOString()}
    
    Do NOT include any text outside of JSON. 
    Do NOT add explanations. 
    
    Examples: 
    
    Message: "Add team meeting tomorrow at 2pm for 1 hour"  
    Output: { 
      "title": "Team Meeting", 
      "start": "2025-09-16T14:00:00+03:00", 
      "end": "2025-09-16T15:00:00+03:00", 
      "location": "", 
      "description": "" 
    } 
    
    Message: "Book a dentist appointment next Wednesday"  
    Output: { 
      "title": "Dentist Appointment", 
      "start": "2025-09-17T10:00:00+03:00", 
      "end": "2025-09-17T11:00:00+03:00", 
      "location": "", 
      "description": "" 
    } 
    
    Message: "${message}"  
    Output:
    `;
  const extracted = await askGemini(prompt);
  let eventData = {};

  try {
    eventData = JSON.parse(extracted.trim());
  } catch (err) {
    console.error("❌ Failed to parse event JSON:", extracted, err);
    eventData = {};
  }

  setPendingEvent(eventData);

  return {
    success: true,
    requiresMoreInfo: true,
    data: {
      type: "calendar_event_request",
      message: `Do you want to add this event?\n
Title: ${eventData.title || "N/A"}
Start: ${eventData.start || "N/A"}
End: ${eventData.end || "N/A"}
Location: ${eventData.location || "N/A"}`,
      event: eventData,
    },
  };
}

export async function confirmEvent(user) {
  if (!pendingEvent) {
    throw new Error("No pending event to confirm");
  }

  const createdEvent = await addEventToGoogleCalendar(
    pendingEvent,
    user.googleAccessToken,
    user.googleRefreshToken
  );

  clearPendingEvent();

  return {
    success: true,
    data: {
      type: "calendar_event_confirmed",
      message: `✅ Event "${createdEvent.summary}" has been added to your Google Calendar.`,
      event: createdEvent,
    },
  };
}

export function cancelEvent() {
  const event = { ...pendingEvent };
  clearPendingEvent();
  
  return {
    success: true,
    data: {
      type: "calendar_event_cancelled",
      message: "❌ Event creation cancelled.",
      event,
    },
  };
}

export function updatePendingEvent(updates) {
  if (!pendingEvent) {
    throw new Error("No pending event to update");
  }
  pendingEvent = { ...pendingEvent, ...updates };
  return pendingEvent;
}

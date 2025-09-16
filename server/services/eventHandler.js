import { askGemini } from "../ai/gemini.js";
import { addEventToGoogleCalendar } from "./eventServices.js";

export async function handleEventRequest(message, user) {
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

export async function handleEventQuery() {
  // TODO: connect with Google Calendar API later
  return {
    success: true,
    data: {
      type: "calendar_event_query",
      message: "Here are your upcoming events (fake response for now).",
      events: [
        {
          title: "Team meeting",
          start: "2025-09-17T10:00:00Z",
          end: "2025-09-17T11:00:00Z",
          location: "Zoom",
        },
      ],
    },
  };
}

export async function confirmEvent(event, user) {
  try {
    const createdEvent = await addEventToGoogleCalendar(
      event,
      user.googleAccessToken,
      user.googleRefreshToken
    );

    return {
      success: true,
      data: {
        type: "calendar_event_confirmed",
        message: `✅ Event "${createdEvent.summary}" has been added to your Google Calendar.`,
        event: createdEvent,
      },
    };
  } catch (err) {
    return {
      success: false,
      data: {
        type: "calendar_event_error",
        message: `❌ Failed to add event: ${err.message}`,
        event,
      },
    };
  }
}

import { askGemini } from "../ai/gemini.js";
import { addEventToGoogleCalendar } from "./eventServices.js";

export async function handleEventRequest(message, user) {
  const prompt = `You are an intelligent assistant that extracts event details from user messages. 
  Always return ONLY a valid JSON object with the following fields: 
  - title (string, provide a sensible default if missing) 
  - start (ISO date string, assume local timezone +03:00, estimate a reasonable time if not specified) 
  - end (ISO date string, assume 1 hour duration if not specified) 
  - location (string, use empty string if unknown) 
  - description (string, use empty string if unknown) 
  The current time is: ${new Date().toISOString()} 
  Do NOT include any text outside of JSON. Do NOT add explanations. 
  Examples: Message: "Add team meeting tomorrow at 2pm for 1 hour" 
  Output: { 
  "title": "Team Meeting", 
  "start": "2025-09-16T14:00:00+03:00",
   "end": "2025-09-16T15:00:00+03:00",
    "location": "", 
    "description": "" } 
    Message: "Book a dentist appointment next Wednesday"
     Output: { 
     "title": "Dentist Appointment",
      "start": "2025-09-17T10:00:00+03:00",
       "end": "2025-09-17T11:00:00+03:00",
        "location": "", "description": "" }
         Message: "${message}" 
         Output:`;

  const extracted = await askGemini(prompt);
  let eventData;
  try {
    eventData = JSON.parse(extracted);
  } catch {
    eventData = {};
  }

  console.log(eventData);

  if (!eventData.title) {
    return {
      success: false,
      error: "Missing required field: title",
      requiresMoreInfo: true,
      promptFor: ["title"],
    };
  }

  if (!eventData.start || !eventData.end) {
    return {
      success: false,
      error: "Invalid or missing date/time",
      requiresMoreInfo: true,
      promptFor: ["start", "end"],
    };
  }

  // Google Calendar integration
  const { googleAccessToken: accessToken, googleRefreshToken: refreshToken } =
    user;
  let calendarResult = null;
  if (accessToken && refreshToken) {
    try {
      calendarResult = await addEventToGoogleCalendar(
        eventData,
        accessToken,
        refreshToken
      );
    } catch (calendarError) {
      return {
        success: false,
        error: `Google Calendar error: ${calendarError.message}`,
        data: { event: eventData },
      };
    }
  }

  return {
    success: true,
    data: {
      type: "calendar_event",
      message: calendarResult
        ? "Event added to Google Calendar!"
        : "Event created (Google Calendar not connected)",
      event: eventData,
      googleCalendar: calendarResult || null,
    },
  };
}

export async function handleEventQuery() {
  const simulatedEvents = [
    {
      title: "Team Meeting",
      start: "2025-09-15T10:00:00+03:00",
      end: "2025-09-15T11:00:00+03:00",
      location: "Zoom",
      description: "Discuss project progress",
    },
    {
      title: "Dentist Appointment",
      start: "2025-09-15T14:00:00+03:00",
      end: "2025-09-15T14:30:00+03:00",
      location: "Dental Clinic",
      description: "Routine check-up",
    },
  ];

  return {
    success: true,
    data: {
      type: "calendar_query",
      message: "Here are your events (simulated):",
      events: simulatedEvents,
    },
  };
}

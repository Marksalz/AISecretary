import * as chrono from "chrono-node";
import dotenv from "dotenv";
import { addEventToGoogleCalendar } from "./eventServices.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  throw new Error(
    "GEMINI_API_KEY manquante dans les variables d'environnement"
  );
}

// === Initialisation Gemini ===
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// === Fonction Gemini ===
async function askGemini(message) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const result = await model.generateContent(message);
    return result.response.text(); // texte généré
  } catch (error) {
    console.error(
      "Gemini communication error:",
      error.response?.data || error.message
    );
    return "Sorry, there was an error communicating with Gemini AI.";
  }
}

// === Détection messages ===
function isEventRequest(normalizedMsg) {
  return /(add|create|schedule|calendar|meeting|appointment|event|book|set up|arrange)/.test(
    normalizedMsg
  );
}

function isEventQuery(normalizedMsg) {
  return /(what do i have|show me|my agenda|today|tomorrow|when is|at what time|next meeting|upcoming events)/.test(
    normalizedMsg
  );
}

function normalize(message) {
  return message.trim().toLowerCase();
}

// === Gestion des messages ===
export async function handleMessage(
  message,
  conversationHistory = [],
  user = {}
) {
  const normalizedMsg = normalize(message);
  const isFollowUp = conversationHistory.some((msg) => msg.requiresMoreInfo);

  // --- Cas 1 : ajout d'événement ---
  if (isEventRequest(normalizedMsg) || isFollowUp) {
    try {
      const prompt = `You are an intelligent assistant that extracts event details from user messages.
Always return ONLY a valid JSON object with the following fields:
- title (string, provide a sensible default if missing)
- start (ISO date string, assume local timezone +03:00, estimate a reasonable time if not specified)
- end (ISO date string, assume 1 hour duration if not specified)
- location (string, use empty string if unknown)
- description (string, use empty string if unknown)

The current time is: ${new Date().toISOString()}

Do NOT include any text outside of JSON. Do NOT add explanations.

Examples:

Message: "Add team meeting tomorrow at 2pm for 1 hour"
Output:
{
  "title": "Team Meeting",
  "start": "2025-09-16T14:00:00+03:00",
  "end": "2025-09-16T15:00:00+03:00",
  "location": "",
  "description": ""
}

Message: "Book a dentist appointment next Wednesday"
Output:
{
  "title": "Dentist Appointment",
  "start": "2025-09-17T10:00:00+03:00",
  "end": "2025-09-17T11:00:00+03:00",
  "location": "",
  "description": ""
}

Message: "${message}"
Output:`;

      const extracted = await askGemini(prompt);
      let eventData;
      try {
        eventData = JSON.parse(extracted);
        console.log(eventData);
      } catch {
        eventData = {};
      }

      if (!eventData.title) {
        const aiPrompt = await askGemini(
          "Please provide the title of your event."
        );
        return {
          success: false,
          error: "Missing required field: title",
          requiresMoreInfo: true,
          promptFor: ["title"],
          aiMessage: aiPrompt,
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

      // --- Google Calendar Integration ---
      const accessToken = user.googleAccessToken;
      const refreshToken = user.googleRefreshToken;
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
    } catch (error) {
      console.error("Error processing calendar event:", error);
      return {
        success: false,
        error: error.message,
        requiresMoreInfo: true,
        promptFor: "event_details",
      };
    }
  }

  // --- Cas 2 : consultation d'événements (simulé) ---
  if (isEventQuery(normalizedMsg)) {
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

  // --- Cas 3 : fallback chat via Gemini ---
  try {
    const prompt = `You are a friendly AI assistant for a chat application that also manages a user's calendar.
- Always answer naturally and informally, as if chatting with a friend.
- Keep responses short, clear, and engaging.
- Do NOT explain grammar or give dictionary-like definitions.
- Do NOT include citations or links.

Examples:
User: "Salut, comment tu vas ?"
AI: "Ça va bien, et toi ?"

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
  } catch (error) {
    console.error("Error in Gemini fallback chat:", error);
    return {
      success: false,
      error: "Unable to generate response.",
    };
  }
}

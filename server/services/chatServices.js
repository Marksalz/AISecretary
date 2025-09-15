import axios from "axios";
import * as chrono from "chrono-node";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.PERPLEXITY_API_KEY) {
  throw new Error(
    "PERPLEXITY_API_KEY manquante dans les variables d'environnement"
  );
}

// === Fonction Perplexity ===
async function askPerplexity(message) {
  try {
    const response = await axios.post(
      "https://api.perplexity.ai/chat/completions",
      {
        model: "sonar",
        messages: [{ role: "user", content: message }],
      },
      { headers: { Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}` } }
    );

    const choice = response.data?.choices?.[0];
    if (choice && choice.message && choice.message.content) {
      return choice.message.content; // le texte généré
    }

    return "Sorry, I cannot generate a response right now.";
  } catch (error) {
    console.error(
      "Perplexity communication error:",
      error.response?.data || error.message
    );
    return "Sorry, there was an error communicating with Perplexity AI.";
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

// === Parsing horaires relatifs ===
function parseEventTimes(message) {
  const results = chrono.parse(message, new Date());
  if (results.length === 0) return {};
  const start = results[0].start.date();
  let end = start;

  if (results[0].end) {
    end = results[0].end.date();
  } else {
    const match = message.match(/for (\d+)\s*(hour|hours|minute|minutes)/i);
    if (match) {
      const value = parseInt(match[1], 10);
      if (/hour/i.test(match[2]))
        end = new Date(start.getTime() + value * 60 * 60 * 1000);
      else if (/minute/i.test(match[2]))
        end = new Date(start.getTime() + value * 60 * 1000);
    } else {
      end = new Date(start.getTime() + 60 * 60 * 1000);
    }
  }

  return { start: start.toISOString(), end: end.toISOString() };
}

// === Gestion des messages ===
export async function handleMessage(message, conversationHistory = []) {
  const normalizedMsg = normalize(message);
  const isFollowUp = conversationHistory.some((msg) => msg.requiresMoreInfo);

  // --- Cas 1 : ajout d'événement ---
  if (isEventRequest(normalizedMsg) || isFollowUp) {
    try {
      const prompt = `You are an intelligent assistant that extracts event details from user messages.
Always return a complete JSON object with the following fields:
- title (string, provide a sensible default if missing)
- start (ISO date string, estimate a reasonable time if not specified)
- end (ISO date string, estimate a reasonable duration if not specified)
- location (string, use empty string if unknown)
- description (string, use empty string if unknown)

Do NOT include any text outside of JSON. Do NOT add explanations.

Examples:
Message: "Add team meeting tomorrow at 2pm for 1 hour"
Output:
{
  "title": "Team Meeting",
  "start": "2025-09-15T14:00:00+03:00",
  "end": "2025-09-15T15:00:00+03:00",
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

      const extracted = await askPerplexity(prompt);
      let eventData;
      try {
        eventData = JSON.parse(extracted);
        console.log("try");
      } catch {
        eventData = {};
        console.log("catch");
      }

      const times = parseEventTimes(message);
      eventData.start = times.start;
      eventData.end = times.end;
      console.log(eventData);

      if (!eventData.title) {
        const aiPrompt = await askPerplexity(
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

      return {
        success: true,
        data: {
          type: "calendar_event",
          message: "Event successfully added (simulated)!",
          event: eventData,
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

  // --- Cas 3 : fallback chat via Perplexity ---
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

    const answer = await askPerplexity(prompt);
    return {
      success: true,
      data: {
        type: "chat_response",
        message: answer,
      },
    };
  } catch (error) {
    console.error("Error in Perplexity fallback chat:", error);
    return {
      success: false,
      error: "Unable to generate response.",
    };
  }
}

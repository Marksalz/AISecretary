import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  throw new Error(
    "GEMINI_API_KEY manquante dans les variables d'environnement"
  );
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function toLocalISOString(date) {
  const tzOffsetMinutes = -date.getTimezoneOffset(); // in minutes, e.g. 180 for UTC+3
  const sign = tzOffsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(tzOffsetMinutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");

  // "YYYY-MM-DDTHH:mm:ss"
  const iso = date.toISOString().slice(0, 19);

  return `${iso}${sign}${hh}:${mm}`;
}

const nowLocal = toLocalISOString(new Date());

// Main calendar prompt for intent recognition and JSON extraction
export const CALENDAR_PROMPT = `
You are an assistant that manages a calendar.
Your role is to understand the user's intent (add, delete, update, or read an event)
and return only a valid JSON object.

Context:
- The current datetime is ${toLocalISOString(
  new Date()
)}, the time zone is your system’s local time zone.
- When the user says 'today', always use this date.

Rules:
- Output only JSON, no extra text.
- Always return times in ISO 8601 format using the system’s local timezone offset
  (e.g., 2025-09-18T17:00:00+03:00 in Israel summer, or +02:00 in winter).
- The JSON must follow this structure. Do not add any backticks at the beginning or end and do not include the word 'json'. Just follow the example format:

For "add":
{
  "type": "add",
  "data": {
    "title": string | null,
    "start": string | null,        // ISO 8601 date-time with local offset
    "end": string | null,          // ISO 8601 date-time with local offset
    "location": string | null,
    "description": string | null
  }
}

For "read", "delete", or "update":
{
  "type": "read" | "delete" | "update",
  "keyword": string | null,        // single keyword from the request
  "data": {
    "timeMin": string | null,      // ISO 8601 range start with local offset
    "timeMax": string | null,      // ISO 8601 range end with local offset
    "eventId": string | null       // (for read: always include eventId if found)
  }
}

If the user is just making conversation or not asking about the calendar, return a JSON object: 
{
  "type": "talk",
  "keyword": null,        
  "data": null
}

- If a piece of information is not provided, set it to null.
- For "read", always provide timeMin and timeMax covering the requested interval.
- For "delete" and "update", provide both keyword and timeMin/timeMax if possible.
- For "read", always include the eventId if found (from your calendar search).

Examples:

User: "Add a meeting tomorrow at 3pm with Paul"  
Response:
{
  "type": "add",
  "data": {
    "title": "meeting with Paul",
    "start": "2025-09-17T15:00:00+03:00",
    "end": null,
    "location": null,
    "description": null
  }
}

User: "Delete my dentist appointment on Thursday"  
Response:
{
  "type": "delete",
  "keyword": "dentist",
  "data": {
    "timeMin": "2025-09-18T00:00:00+03:00",
    "timeMax": "2025-09-18T23:59:59+03:00",
    "eventId": "abc123"
  }
}

User: "What do I have next Monday?"  
Response:
{
  "type": "read",
  "keyword": null,
  "data": {
    "timeMin": "2025-09-22T00:00:00+03:00",
    "timeMax": "2025-09-22T23:59:59+03:00",
    "eventId": "def456"
  }
}

User: "Change my meeting with Sarah to Friday at 10am"  
Response:
{
  "type": "update",
  "keyword": "Sarah",
  "data": {
    "timeMin": "2025-09-19T00:00:00+03:00",
    "timeMax": "2025-09-19T23:59:59+03:00",
    "eventId": "ghi789"
  }
}

User: "How are you today?"  
Response:
{
  "type": "talk",
  "keyword": null,        
  "data": null
}
`;

export async function askGemini(message, useCalendarPrompt = false) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = useCalendarPrompt
      ? `${CALENDAR_PROMPT}\nUser: "${message}"\nResponse:`
      : message;
    const result = await model.generateContent(prompt);

    let text = result.response.text();
    if (!useCalendarPrompt) {
      return text;
    }
    // Remove code block markers and 'json' if present
    text = text
      .trim()
      .replace(/^```json/i, "")
      .replace(/^```/, "")
      .replace(/```$/, "")
      .trim();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse Gemini response as JSON:", text);
      return { error: "Failed to parse Gemini response as JSON." };
    }
  } catch (error) {
    console.error(
      "Gemini communication error:",
      error.response?.data || error.message
    );
    return { error: "Sorry, there was an error communicating with Gemini AI." };
  }
}

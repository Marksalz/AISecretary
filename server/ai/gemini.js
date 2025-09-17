import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  throw new Error(
    "GEMINI_API_KEY manquante dans les variables d'environnement"
  );
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Main calendar prompt for intent recognition and JSON extraction
export const CALENDAR_PROMPT = `
You are an assistant that manages a calendar.
Your role is to understand the user's intent (add, delete, update, or read an event)
and return only a valid JSON object.

Context:
- The current datetime is ${new Date().toISOString()} (today is ${new Date().toDateString()}).
- When the user says 'today', always use this date.


Rules:
- Output only JSON, no extra text.
- The JSON must follow this structure do not add any backticks in the begining and end and the word json just follow the example format:

For "add":
{
  "type": "add",
  "data": {
    "title": string | null,
    "start": string | null,        // ISO 8601 date-time if available
    "end": string | null,          // ISO 8601 date-time if available
    "location": string | null,
    "description": string | null
  }
}

For "read", "delete", or "update":
{
  "type": "read" | "delete" | "update",
  "keyword": string | null,        // single keyword from the request
  "data": {
    "timeMin": string | null,      // ISO 8601 range start
    "timeMax": string | null,      // ISO 8601 range end
    "eventId": string | null       // (for read: always include eventId if found)
  }
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
    "start": "2025-09-17T15:00:00Z",
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
    "timeMin": "2025-09-18T00:00:00Z",
    "timeMax": "2025-09-18T23:59:59Z",
    "eventId": "abc123"
  }
}

User: "What do I have next Monday?"  
Response:
{
  "type": "read",
  "keyword": null,
  "data": {
    "timeMin": "2025-09-22T00:00:00Z",
    "timeMax": "2025-09-22T23:59:59Z",
    "eventId": "def456"
  }
}

User: "Change my meeting with Sarah to Friday at 10am"  
Response:
{
  "type": "update",
  "keyword": "Sarah",
  "data": {
    "timeMin": "2025-09-19T00:00:00Z",
    "timeMax": "2025-09-19T23:59:59Z",
    "eventId": "ghi789"
  }
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

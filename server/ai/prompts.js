/**
 * Prompt builders and detection helpers for extracting update details from free-form user text.
 *
 * These functions return carefully crafted instructions for the LLM.
 * They enforce JSON-only responses and provide examples so we can parse safely.
 *
 * Conventions:
 * - Current datetime and timezone are included for temporal grounding.
 * - Output must be ONLY a JSON object without backticks or extra prose.
 * - ISO 8601 times should be in UTC with a trailing 'Z' when a concrete time is known.
 */
import { askGemini } from "./gemini.js";

/** Utility to format now and timezone notes consistently */
function temporalContext() {
  const nowIso = new Date().toISOString();
  // Keep consistent with CALENDAR_PROMPT which mentions UTC+3
  const tzNote = "UTC+3";
  return { nowIso, tzNote };
}

/**
 * Build a prompt to extract a time update from a user message.
 * Contract:
 * - Input: user message string
 * - Output (JSON-only): { "type": "start" | "end", "time": string }
 *   - "time": ISO 8601 in UTC (e.g., 2025-09-17T15:00:00Z) when determinable;
 *     otherwise a short natural-language guess (e.g., "later in the afternoon").
 */
export function buildTimeUpdatePrompt(message) {
  const { nowIso, tzNote } = temporalContext();
  return `You are a calendar time-update extraction assistant.
Your task is to detect whether the user is updating the start or the end time of an event,
and extract the new time.

Context:
- Current datetime: ${nowIso}
- Time zone: ${tzNote}
- If the user says "today", use today's date from the current datetime.
- If the user says "tomorrow", add one day relative to the current datetime.
- If the user provides a relative shift without a base (e.g., "30 minutes later"),
	return a concise natural-language best guess rather than fabricating a clock time.

Rules:
- Output only JSON, no extra text or code fences.
- If the user refers to the ending boundary ("end", "finish", "until"), type = "end";
	otherwise if they refer to the starting boundary ("start", "begin", "from"), type = "start".
- If ambiguous, prefer "start" unless "end" is clearly indicated.
- When a precise time can be resolved, return ISO 8601 in UTC with a trailing 'Z'.

Message: "${message}"

Respond ONLY as JSON:
{ "type": "start|end", "time": "<ISO-8601-or-natural-text>" }

Examples:
User: "Move the meeting start to 3pm today"
Response: { "type": "start", "time": "2025-09-17T15:00:00Z" }

User: "Make it end at 5:30 pm on Friday"
Response: { "type": "end", "time": "2025-09-19T17:30:00Z" }

User: "a bit earlier"
Response: { "type": "start", "time": "a bit earlier" }`;
}

/**
 * Build a prompt to extract a title update from a user message.
 * Contract:
 * - Input: user message string
 * - Output (JSON-only): { "title": string | null }
 *   - Set to null if no clear new title can be determined.
 */
export function buildTitleUpdatePrompt(message) {
  const { nowIso, tzNote } = temporalContext();
  return `You are a calendar title-update extraction assistant.
Your job is to detect if the user is updating the title (name/summary) of an event
and extract the new title text.

Context:
- Current datetime: ${nowIso}
- Time zone: ${tzNote}

Rules:
- Output only JSON, no extra text or code fences.
- Remove leading directive phrases like: "change the title to", "rename to",
	"call it", "name it", "let's call it", "title:".
- If the message isn't clearly specifying a new title, return { "title": null }.

Message: "${message}"

Respond ONLY as JSON:
{ "title": "<new-title>" | null }

Examples:
User: "Rename the meeting to Sprint Planning"
Response: { "title": "Sprint Planning" }

User: "Can we adjust the title?"
Response: { "title": null }`;
}

/**
 * Build a prompt to extract a location update from a user message.
 * Contract:
 * - Input: user message string
 * - Output (JSON-only): { "location": string | null }
 *   - Set to null if no clear new location can be determined.
 */
export function buildLocationUpdatePrompt(message) {
  const { nowIso, tzNote } = temporalContext();
  return `You are a calendar location-update extraction assistant.
Your job is to detect if the user is updating the event location and extract the new location.

Context:
- Current datetime: ${nowIso}
- Time zone: ${tzNote}

Rules:
- Output only JSON, no extra text or code fences.
- Accept addresses, room names, building names, URLs (for virtual), or city names as valid locations.
- Remove leading directive phrases like: "change the location to", "move it to",
	"set location to", "location:", "at" (when used as a preposition introducing the place).
- If unsure or no location is present, return { "location": null }.

Message: "${message}"

Respond ONLY as JSON:
{ "location": "<new-location>" | null }

Examples:
User: "Move it to Room B, 3rd floor"
Response: { "location": "Room B, 3rd floor" }

User: "Let's do it on Zoom: https://example.zoom.us/j/123"
Response: { "location": "https://example.zoom.us/j/123" }

User: "Wherever works"
Response: { "location": null }`;
}

/**
 * Helper: call Gemini with a prompt and parse JSON, tolerating code fences.
 * Returns { ok: true, data } on success; otherwise { ok: false, error, raw }.
 */
async function askAndParse(prompt) {
  const raw = await askGemini(prompt); // returns text for non-calendar prompts

  if (raw == null) return { ok: false, error: "Empty response", raw };
  let text = String(raw).trim();
  text = text
    .replace(/^```json/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();
  try {
    const data = JSON.parse(text);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: "Failed to parse JSON", raw: text };
  }
}

/**
 * Detect a time update from user text using the model.
 * @param {string} message
 * @returns {Promise<{type:'start'|'end', time:string}|{error:string}>}
 */
export async function detectTimeUpdate(message) {
  const prompt = buildTimeUpdatePrompt(message);
  const res = await askAndParse(prompt);
  if (!res.ok) return { error: res.error };
  return res.data;
}

/**
 * Detect a title update from user text using the model.
 * @param {string} message
 * @returns {Promise<{title:string|null}|{error:string}>}
 */
export async function detectTitleUpdate(message) {
  const prompt = buildTitleUpdatePrompt(message);
  const res = await askAndParse(prompt);
  if (!res.ok) return { error: res.error };
  return res.data;
}

/**
 * Detect a location update from user text using the model.
 * @param {string} message
 * @returns {Promise<{location:string|null}|{error:string}>}
 */
export async function detectLocationUpdate(message) {
  const prompt = buildLocationUpdatePrompt(message);
  const res = await askAndParse(prompt);
  if (!res.ok) return { error: res.error };
  return res.data;
}

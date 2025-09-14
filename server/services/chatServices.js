import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { addEvent, listEvents } from "../utils/calendar.js";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function askGemini(prompt) {
  try {
    const result = await model.generateContent(prompt);
    return typeof result.response.text === "function"
      ? result.response.text()
      : result.response.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch (err) {
    console.error("Error calling Gemini API:", err);
    throw new Error("Failed to get response from Gemini");
  }
}

export async function addEventFromText(text) {
  const prompt = `
Extract event info from this sentence:
"${text}"
Return JSON: title, start (ISO), end (ISO), description (optional)
`;

  try {
    const response = await askGemini(prompt);

    // Clean up Markdown or code blocks
    const clean = response.replace(/```json|```/g, "").trim();

    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON found in the response");

    const event = JSON.parse(match[0]);

    await addEvent(
      event.title,
      event.start,
      event.end,
      event.description || ""
    );
    return `Event "${event.title}" added successfully!`;
  } catch (err) {
    console.error("Error adding event:", err);
    return "Failed to add event. Make sure the input is correct.";
  }
}

export async function queryAgenda(keyword) {
  try {
    const events = await listEvents(keyword);

    if (!events.length) return `No events found for "${keyword}".`;

    let result = `Found ${events.length} event(s) matching "${keyword}":\n`;
    events.forEach((e) => {
      const start = new Date(e.start.dateTime || e.start.date).toLocaleString();
      result += `- ${e.summary} on ${start}\n`;
    });

    return result;
  } catch (err) {
    console.error("Error querying events:", err);
    return "Sorry, I could not fetch the events.";
  }
}

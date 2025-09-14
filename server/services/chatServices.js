import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Send a prompt to Gemini and get the response text.
 * @param {string} prompt - The message to send to Gemini
 * @returns {Promise<string>} - The text response from Gemini
 */
export async function askGemini(prompt) {
  try {
    const result = await model.generateContent(prompt);

    // Option 1: if response.text() is supported
    if (typeof result.response.text === "function") {
      return result.response.text();
    } else {
      // Option 2: extract text manually
      return result.response.candidates[0].content.parts[0].text;
    }
  } catch (err) {
    console.error("Error calling Gemini API:", err);
    throw new Error("Failed to get response from Gemini");
  }
}

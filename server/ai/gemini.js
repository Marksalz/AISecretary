import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  throw new Error(
    "GEMINI_API_KEY manquante dans les variables d'environnement"
  );
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function askGemini(message) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const result = await model.generateContent(message);
    return result.response.text();
  } catch (error) {
    console.error(
      "Gemini communication error:",
      error.response?.data || error.message
    );
    return "Sorry, there was an error communicating with Gemini AI.";
  }
}

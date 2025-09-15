import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  throw new Error(
    "GEMINI_API_KEY manquante dans les variables d'environnement"
  );
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 1000,
  },
});

async function askGemini(message) {
  if (!message || typeof message !== "string") {
    throw new Error("Invalid message");
  }

  try {
    const result = await model.generateContent(message);
    const response = result.response;

    if (!response) {
      throw new Error("No Gemini response");
    }

    if (typeof response.text === "function") {
      return (await response.text()).trim();
    } else if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
      return response.candidates[0].content.parts[0].text.trim();
    } else if (response.text) {
      return response.text.trim();
    }

    throw new Error("Unexpected response format");
  } catch (error) {
    console.error("Gemini error:", error);
    throw new Error(`Communication error with AI: ${error.message}`);
  }
}

export { askGemini };

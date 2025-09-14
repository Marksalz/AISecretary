// Import required libraries
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
  // Choose the Gemini model you want to use
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = "מה נשמע?"; // Hebrew: "How are you?"

  try {
    const result = await model.generateContent(prompt);

    // Option 1: if your version supports response.text()
    if (typeof result.response.text === "function") {
      console.log(result.response.text());
    } else {
      // Option 2: manually extract the text from the response
      const text = result.response.candidates[0].content.parts[0].text;
      console.log(text);
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
  }
}

run();

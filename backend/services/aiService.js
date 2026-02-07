import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generic AI service to handle completions.
 */
export const generateCompletion = async (systemPrompt, userPrompt) => {
  console.log("AI Service: Generating completion...");

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-3-pro-preview",
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const response = await result.response;
    const content = response.text();

    return {
      content: content,
      raw: response,
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

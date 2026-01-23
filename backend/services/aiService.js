import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI();

/**
 * Generic AI service to handle completions.
 * This is designed to be provider-agnostic.
 */
export const generateCompletion = async (prompt, options = {}) => {
  console.log('AI Service received prompt');

  try {
    const response = await client.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;

    return {
      content: content,
      raw: response
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw error;
  }
};

import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI();

/**
 * Generic AI service to handle completions.
 */
export const generateCompletion = async (systemPrompt, userPrompt, options = {}) => {
  console.log('AI Service: Generating completion...');

  try {
    const response = await client.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
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

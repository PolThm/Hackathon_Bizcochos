import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import dotenv from "dotenv";

dotenv.config();

/**
 * Model Factory: Returns a LangChain ChatModel based on provider and model name.
 */
export const getModel = (options = {}) => {
  const provider = options.provider || process.env.AI_PROVIDER || "google";
  const modelName = options.modelName || process.env.AI_MODEL;

  // Base configuration
  const config = {};

  if (provider === "openai") {
    config.modelName = modelName || "gpt-4o";
    config.apiKey = process.env.OPENAI_API_KEY;
  } else {
    config.model = modelName || "gemini-1.5-flash";
    config.apiKey = process.env.GEMINI_API_KEY;
  }

  // Handle Temperature: ONLY add it if explicitly requested and NOT a known strict model
  const temperature =
    options.temperature ??
    (process.env.AI_TEMPERATURE
      ? parseFloat(process.env.AI_TEMPERATURE)
      : undefined);

  // Logic to detect models that typically don't allow temperature adjustments (reasoning models)
  const isStrictModel =
    modelName &&
    (modelName.startsWith("o1") ||
      modelName.startsWith("o3") ||
      modelName.includes("nano") ||
      modelName.includes("reasoning"));

  if (temperature !== undefined && !isStrictModel) {
    config.temperature = temperature;
  }

  if (provider === "openai") {
    return new ChatOpenAI(config);
  }

  // Default to Google
  return new ChatGoogleGenerativeAI(config);
};

/**
 * Generic completion helper using the model factory.
 */
export const generateCompletion = async (
  systemPrompt,
  userPrompt,
  options = {},
) => {
  const model = getModel(options);

  try {
    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ]);

    return {
      content: response.content,
      raw: response,
    };
  } catch (error) {
    console.error(`AI Service (${model.constructor.name}) Error:`, error);
    throw error;
  }
};

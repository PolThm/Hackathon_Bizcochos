import { generateCompletion } from "./aiService.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPPORTED_LOCALES = ["en", "fr", "es"];

function getExercisesFilePath(locale) {
  const safeLocale = SUPPORTED_LOCALES.includes(locale) ? locale : "en";
  return path.join(
    __dirname,
    "..",
    "common",
    `all-exercises-${safeLocale}.json`,
  );
}

export const generateRoutineFromPrompt = async (prompt, locale = "en") => {
  const safeLocale = SUPPORTED_LOCALES.includes(locale) ? locale : "en";

  // Load exercises in English for the AI (consistent list for generation)
  const exercisesPathEn = path.join(
    __dirname,
    "..",
    "common",
    "all-exercises-en.json",
  );
  const fileContent = await fs.readFile(exercisesPathEn, "utf-8");
  const allExercises = JSON.parse(fileContent);

  // Extract only id, name and benefits for the AI
  const simplifiedExercises = allExercises.map((ex) => ({
    id: ex.id,
    name: ex.name,
    benefits: ex.benefits,
  }));

  const systemPrompt = `
You are a world-class fitness and mobility expert. Your task is to generate a professional workout routine based ONLY on the exercises provided in the list below.

Available exercises:
${JSON.stringify(simplifiedExercises, null, 2)}

Rules:
1. Use the "id" exactly as provided in the list for each exercise (do not include "name" in exercises, we will add it server-side).
2. Find and set a short and catchy name for the routine based on the request (30 characters maximum).
3. Find and set a short and catchy description for the routine that will explain why this routine is tailored to the request (150 characters maximum).
4. Estimate a realistic "duration" in seconds for each exercise based on its nature.
5. The output MUST be a valid JSON object.
6. Do not include any text before or after the JSON.

JSON Structure:
{
  "id": "unique-id",
  "name": "Routine Name",
  "description": "Routine Description",
  "exercises": [
    {
      "id": "exercise-id-from-list",
      "duration": number
    }
  ]
}
`;

  const userPrompt = `Generate a routine for this request: "${prompt}"`;

  console.log("Generating routine with separated System and User prompts");

  const aiResponse = await generateCompletion(systemPrompt, userPrompt);
  console.log("AI Response received");

  try {
    const routine = JSON.parse(aiResponse.content);

    // Load exercises in the requested locale to get translated names
    const localePath = getExercisesFilePath(safeLocale);
    const localeContent = await fs.readFile(localePath, "utf-8");
    const localeExercises = JSON.parse(localeContent);
    const idToName = Object.fromEntries(
      localeExercises.map((ex) => [ex.id, ex.name]),
    );

    // Add translated names to each exercise by id
    routine.exercises = (routine.exercises || []).map((ex) => ({
      id: ex.id,
      name: idToName[ex.id] ?? ex.name ?? "Unknown",
      duration: ex.duration,
    }));

    // Force breakDuration and preparationDuration to always be 5 seconds
    routine.breakDuration = 5;
    routine.preparationDuration = 5;

    return {
      status: "ok",
      data: routine,
    };
  } catch (error) {
    console.error("Failed to parse AI response as JSON:", error);
    return {
      status: "error",
      message: "Invalid AI response format",
    };
  }
};

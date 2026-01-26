import { generateCompletion } from "./aiService.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateRoutineFromPrompt = async (prompt) => {
  // Load exercises from common folder
  const exercisesPath = path.join(
    __dirname,
    "..",
    "common",
    "all-exercises-en.json",
  );
  const fileContent = await fs.readFile(exercisesPath, "utf-8");
  const allExercises = JSON.parse(fileContent);

  // Extract only name, benefits and id
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
1. Use the "id" and "name" exactly as provided in the list.
2. Estimate a realistic "duration" in seconds for each exercise based on its nature.
3. The output MUST be a valid JSON object.
4. Do not include any text before or after the JSON.

JSON Structure:
{
  "id": "unique-id",
  "name": "Routine Name",
  "exercises": [
    {
      "id": "exercise-id-from-list",
      "name": "Exercise Name",
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

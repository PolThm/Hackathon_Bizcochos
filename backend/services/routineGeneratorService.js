import { generateCompletion } from './aiService.js';
import fs from 'fs/promises';
import path from 'path';

export const generateRoutineFromPrompt = async (prompt) => {
  // Load exercises from common folder
  const exercisesPath = path.join(process.cwd(), '..', 'common', 'all-exercises-en.json');
  const fileContent = await fs.readFile(exercisesPath, 'utf-8');
  const allExercises = JSON.parse(fileContent);

  // Extract only name, benefits and id
  const simplifiedExercises = allExercises.map(ex => ({
    id: ex.id,
    name: ex.name,
    benefits: ex.benefits
  }));

  const fullPrompt = `
You are a fitness expert. Based on the following list of exercises, generate a routine for the user prompt.
Available exercises:
${JSON.stringify(simplifiedExercises, null, 2)}

User Prompt: "${prompt}"

Return ONLY a valid JSON object with the following structure:
{
  "id": "unique-id",
  "name": "Routine Name",
  "breakDuration": number,
  "preparationDuration": number,
  "exercises": [
    {
      "id": "exercise-id-from-list",
      "name": "Exercise Name",
      "duration": seconds
    }
  ]
}
Do not include any other text or explanation.
`;

  console.log('Generating routine from prompt with exercise context');
  
  const aiResponse = await generateCompletion(fullPrompt);
  console.log('AI Response:', aiResponse.content);

  try {
    const routine = JSON.parse(aiResponse.content);
    return { 
      status: 'ok',
      data: routine
    };
  } catch (error) {
    console.error('Failed to parse AI response as JSON:', error);
    return {
      status: 'error',
      message: 'Invalid AI response format'
    };
  }
};

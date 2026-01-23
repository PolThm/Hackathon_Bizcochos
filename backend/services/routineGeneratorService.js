import { generateCompletion } from './aiService.js';

export const generateRoutineFromPrompt = async (prompt) => {
  // Logic for generating the routine from a text prompt
  console.log('Generating routine from prompt:', prompt);
  
  const aiResponse = await generateCompletion(prompt);
  console.log('AI Response:', aiResponse.content);
  
  return { 
    status: 'ok',
    data: aiResponse.content
  };
};

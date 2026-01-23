/**
 * Generic AI service to handle completions.
 * This is designed to be provider-agnostic.
 */
export const generateCompletion = async (prompt, options = {}) => {
  // Currently simulating an AI response. 
  // In the future, this is where you would integrate OpenAI, Anthropic, Vercel AI SDK, etc.
  console.log('AI Service received prompt:', prompt);

  // Mocking an AI processing delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // For now, returning a mock response in the requested JSON format.
  const mockResponse = {
    "id": "generated-routine-123",
    "name": "Back Recovery Routine",
    "breakDuration": 10,
    "preparationDuration": 5,
    "exercises": [
      {
        "id": "d70415d950a2",
        "name": "Rag Doll",
        "duration": 30
      },
      {
        "id": "7e6077a58ec2",
        "name": "Upward Dog",
        "duration": 30
      }
    ]
  };

  return {
    content: JSON.stringify(mockResponse),
    raw: { provider: 'mock', usage: {} }
  };
};

import { getAgentResponse } from '../utils/gemini';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!process.env.API_KEY) {
    console.error('API key is not configured on the server for agent response.');
    return res.status(500).json({ error: 'Server configuration error: API key is missing.' });
  }

  try {
    const { context, chatHistoryWithPrompt, lang } = req.body;
    if (!context || !chatHistoryWithPrompt || !lang) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    const result = await getAgentResponse(context, chatHistoryWithPrompt, lang);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in /api/agent-response:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get agent response';
    const statusCode = (error as any).status === 429 ? 429 : 500;
    return res.status(statusCode).json({ error: errorMessage });
  }
}
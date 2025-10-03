import { getPromptWizardResponse } from '../utils/gemini';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!process.env.API_KEY) {
    console.error('API key is not configured on the server for prompt wizard.');
    return res.status(500).json({ error: 'Server configuration error: API key is missing.' });
  }

  try {
    const { history, lang } = req.body;
    if (!history || !lang) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    const result = await getPromptWizardResponse(history, lang);
    return res.status(200).send(result);
  } catch (error) {
    console.error('Error in /api/prompt-wizard:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get prompt wizard response';
    const statusCode = (error as any).status === 429 ? 429 : 500;
    return res.status(statusCode).json({ error: errorMessage });
  }
}
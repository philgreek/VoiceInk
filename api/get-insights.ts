import { getInsightsForText } from '../utils/gemini';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!process.env.API_KEY) {
    console.error('API key is not configured on the server for insights.');
    return res.status(500).json({ error: 'Server configuration error: API key is missing.' });
  }

  try {
    const { text, lang } = req.body;
    if (!text || !lang) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    const result = await getInsightsForText(text, lang);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in /api/get-insights:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get insights';
    const statusCode = (error as any).status === 429 ? 429 : 500;
    return res.status(statusCode).json({ error: errorMessage });
  }
}
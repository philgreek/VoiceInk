import { getSourceGuide } from '../utils/gemini';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { content, lang } = req.body;
    if (!content || !lang) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    const result = await getSourceGuide(content, lang);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in /api/source-guide:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get source guide';
    const statusCode = (error as any).status === 429 ? 429 : 500;
    return res.status(statusCode).json({ error: errorMessage });
  }
}

import { getDiarizedTranscription } from '../utils/gemini';
import { Language } from '../utils/translations';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!process.env.API_KEY) {
    console.error('API key is not configured on the server for diarization.');
    return res.status(500).json({ error: 'Server configuration error: API key is missing.' });
  }

  try {
    const { text, lang } = req.body as { text: string; lang: Language };
    if (!text || !lang) {
      return res.status(400).json({ error: 'Missing required parameters: text and lang' });
    }
    const result = await getDiarizedTranscription(text, lang);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in /api/diarize-transcription:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to diarize transcription';
    const statusCode = (error as any).status === 429 ? 429 : 500;
    return res.status(statusCode).json({ error: errorMessage });
  }
}
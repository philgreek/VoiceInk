import { 
    getEmotionAnalysis, 
    getTonalityAnalysis, 
    getStyledText, 
    getBrainstormIdeas, 
    getGrammarCheck 
} from '../utils/gemini';
import { StudioToolId, TextStyleId } from '../types';
import { Language } from '../utils/translations';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { toolId, context, lang, settings } = req.body as {
        toolId: StudioToolId,
        context: string,
        lang: Language,
        settings?: TextStyleId
    };

    if (!toolId || !context || !lang) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    let result: string;

    switch (toolId) {
      case 'emotionAnalysis':
        result = await getEmotionAnalysis(context, lang);
        break;
      case 'tonalityAnalysis':
        result = await getTonalityAnalysis(context, lang);
        break;
      case 'textStyle':
        if (!settings) return res.status(400).json({ error: 'Text style setting is required.' });
        result = await getStyledText(context, settings, lang);
        break;
      case 'brainstorm':
        result = await getBrainstormIdeas(context, lang);
        break;
      case 'grammarCheck':
        result = await getGrammarCheck(context, lang);
        break;
      default:
        return res.status(400).json({ error: `Tool '${toolId}' is not implemented on the server.` });
    }

    return res.status(200).json({ result });

  } catch (error) {
    console.error('Error in /api/studio-tool:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to trigger studio tool';
    const statusCode = (error as any).status === 429 ? 429 : 500;
    return res.status(statusCode).json({ error: errorMessage });
  }
}

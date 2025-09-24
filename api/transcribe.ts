import { GoogleGenAI } from "@google/genai";
import { Message } from '../types';

// This is a Vercel Serverless Function
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { audioData, mimeType } = req.body;

    if (!audioData || !mimeType) {
      return res.status(400).json({ error: 'Missing audio data or mime type' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured on the server' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const audioPart = {
      inlineData: {
        mimeType: mimeType,
        data: audioData,
      },
    };

    // Simplified prompt: Just transcribe the audio to plain text.
    const textPart = {
      text: `Accurately transcribe the audio recording into a single block of text. Do not add any speaker labels, timestamps, or formatting.`,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [audioPart, textPart] },
    });

    const transcription = response.text.trim();
    
    // Create a single message with the full transcription.
    const finalMessages: Message[] = [
      {
        id: `msg-${Date.now()}`,
        sender: 'interlocutor', // Default to 'interlocutor' as we can't determine the speaker.
        text: transcription,
        timestamp: 0,
      }
    ];

    return res.status(200).json(finalMessages);

  } catch (error) {
    console.error('Error in /api/transcribe:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to transcribe audio';
    return res.status(500).json({ error: errorMessage });
  }
}

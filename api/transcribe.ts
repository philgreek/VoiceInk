import { GoogleGenAI, Type } from "@google/genai";
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

    const textPart = {
      text: `
        Transcribe the audio recording.
        The output must be a valid JSON array of objects. Each object represents a segment of the conversation and must have three properties:
        1. "id": A unique string identifier for the message, like "msg-1719324823".
        2. "sender": A string, either "user" or "interlocutor". Identify and differentiate between speakers.
        3. "text": A string containing the transcribed text for that segment.
        Do not add any text or explanations outside of the JSON array.
      `,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [audioPart, textPart] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              sender: { type: Type.STRING },
              text: { type: Type.STRING },
            },
            required: ['id', 'sender', 'text'],
          },
        },
      },
    });

    const jsonText = response.text.trim();
    const transcribedMessages: Message[] = JSON.parse(jsonText);
    
    // Add dummy timestamps for now as we don't get them from the API
    const messagesWithTimestamps = transcribedMessages.map((msg, index) => ({
        ...msg,
        timestamp: index * 5 // Approximate timestamp
    }));

    return res.status(200).json(messagesWithTimestamps);

  } catch (error) {
    console.error('Error in /api/transcribe:', error);
    return res.status(500).json({ error: 'Failed to transcribe audio' });
  }
}

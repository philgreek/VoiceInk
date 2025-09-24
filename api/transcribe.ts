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
        Accurately transcribe the audio recording.
        The audio contains a conversation between one or more speakers.
        Your task is to segment the conversation by speaker and provide a transcription for each segment.
        The output must be a valid JSON array of objects. Each object represents a single continuous utterance from one speaker and must have two properties:
        1. "speaker": A generic string label for the speaker, like "SPEAKER_1", "SPEAKER_2", etc. Use these labels consistently for the same speaker.
        2. "text": A string containing the transcribed text for that segment.
        Do not add any text, explanations, or markdown formatting outside of the JSON array. The entire response should be the JSON array itself.
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
              speaker: { type: Type.STRING },
              text: { type: Type.STRING },
            },
            required: ['speaker', 'text'],
          },
        },
      },
    });

    const jsonText = response.text.trim();
    const rawMessages: { speaker: string; text: string }[] = JSON.parse(jsonText);
    
    // Post-process to fit the frontend's Message type
    const speakerMap = new Map<string, 'user' | 'interlocutor'>();
    let nextSpeakerRole: 'interlocutor' | 'user' = 'interlocutor';

    const messagesWithTimestamps: Message[] = rawMessages.map((rawMsg, index) => {
      if (!speakerMap.has(rawMsg.speaker)) {
        speakerMap.set(rawMsg.speaker, nextSpeakerRole);
        nextSpeakerRole = nextSpeakerRole === 'interlocutor' ? 'user' : 'interlocutor';
      }
      
      const sender = speakerMap.get(rawMsg.speaker)!;

      return {
        id: `msg-${Date.now()}-${index}`,
        sender,
        text: rawMsg.text,
        timestamp: index * 5, // Approximate timestamp
      };
    });

    return res.status(200).json(messagesWithTimestamps);

  } catch (error) {
    console.error('Error in /api/transcribe:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to transcribe audio';
    return res.status(500).json({ error: errorMessage });
  }
}

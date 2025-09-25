
import { GoogleGenAI } from "@google/genai";
import formidable from "formidable";
import fs from "fs";

// Vercel specific configuration to disable body parsing for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

const processFile = async (req: any): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
  const form = formidable();
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
      }
      resolve({ fields, files });
    });
  });
};

const transcribeAudio = async (apiKey: string, filePath: string, mimeType: string) => {
    const ai = new GoogleGenAI({ apiKey });
    const audioData = fs.readFileSync(filePath).toString("base64");

    const audioPart = { inlineData: { mimeType, data: audioData } };
    const textPart = { text: `Accurately transcribe the audio recording into a single block of text.` };
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [audioPart, textPart] },
    });

    const transcription = response.text.trim();
    return [{
        id: `msg-${Date.now()}`,
        sender: 'interlocutor',
        text: transcription,
        timestamp: 0,
    }];
};

const readTextFile = (filePath: string) => {
    return fs.readFileSync(filePath, 'utf-8');
};

const fetchUrlContent = async (url: string) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.statusText}`);
        }
        const html = await response.text();
        // Basic text extraction: strip HTML tags and get body content
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        const textContent = (bodyMatch ? bodyMatch[1] : html)
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s\s+/g, ' ')
            .trim();
        return textContent;
    } catch (error) {
        console.error("Error fetching URL content:", error);
        throw new Error("Could not fetch or process content from the URL.");
    }
};


export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = req.headers['x-api-key'];
  if (!apiKey || typeof apiKey !== 'string') {
    return res.status(401).json({ error: 'API key not configured on the server' });
  }

  try {
    const { fields, files } = await processFile(req);
    const type = Array.isArray(fields.type) ? fields.type[0] : fields.type;

    let content;

    if (type === 'audio' || type === 'file') {
        const file = Array.isArray(files.file) ? files.file[0] : files.file;
        if (!file) {
            return res.status(400).json({ error: 'File not provided' });
        }
        if (type === 'audio') {
            content = await transcribeAudio(apiKey, file.filepath, file.mimetype || 'application/octet-stream');
        } else { // text file
            content = readTextFile(file.filepath);
        }
    } else if (type === 'url') {
        const url = Array.isArray(fields.url) ? fields.url[0] : fields.url;
        if (!url) {
            return res.status(400).json({ error: 'URL not provided' });
        }
        content = await fetchUrlContent(url);
    } else {
        return res.status(400).json({ error: 'Invalid source type' });
    }

    return res.status(200).json({ content });

  } catch (error) {
    console.error('Error in /api/process-source:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process source';
    return res.status(500).json({ error: errorMessage });
  }
}
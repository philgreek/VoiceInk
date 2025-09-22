// FIX: The `GoogleGenerativeAI` export is deprecated. Use `GoogleGenAI` instead.
import { GoogleGenAI } from "@google/genai";
import { t, Language } from "./translations";

// FIX: Update type to `GoogleGenAI`.
let ai: GoogleGenAI | null = null;

const initAI = () => {
  if (!ai) {
    if (!process.env.API_KEY) {
        console.error("API_KEY is not set in environment variables.");
        alert("Gemini API key is not configured. Please contact support.");
        return null;
    }
    // FIX: The constructor for `GoogleGenAI` expects an object with an `apiKey` property.
    ai = new GoogleGenAI({apiKey: process.env.API_KEY});
  }
  return ai;
};

export const getProofreadText = async (text: string, lang: Language): Promise<string> => {
    const genAI = initAI();
    if (!genAI) throw new Error("AI not initialized");

    const prompt = `Proofread and correct the following conversation transcript for spelling, grammar, and punctuation. The language of the transcript is ${lang}. Only return the fully corrected text. Do not add any introductory phrases like "Here is the corrected text:".
    
    Transcript:
    ---
    ${text}
    ---
    `;

    try {
        // FIX: Use `ai.models.generateContent` which is the current API. The `getGenerativeModel` flow is deprecated.
        // The response from `generateContent` also has a `text` property to directly access the string response.
        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error calling Gemini API for proofreading:", error);
        throw new Error("Failed to get proofread text from AI.");
    }
};

export const getAIResponse = async (userPrompt: string, context: string, lang: Language): Promise<string> => {
    const genAI = initAI();
    if (!genAI) throw new Error("AI not initialized");
    
    const systemInstruction = `You are a helpful AI assistant analyzing a conversation transcript. The user will ask you a question about it. The language of the conversation is ${lang}. Provide a concise and helpful response.`;

    const prompt = `
        Conversation Transcript:
        ---
        ${context}
        ---

        User's question: "${userPrompt}"
    `;
    
    try {
        // FIX: Use `ai.models.generateContent` and pass `systemInstruction` in the `config` object.
        // The response from `generateContent` has a `text` property to directly access the string response.
        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error calling Gemini API for AI response:", error);
        throw new Error("Failed to get response from AI.");
    }
};

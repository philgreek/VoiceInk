
import { GoogleGenAI } from "@google/genai";
import { Language } from "./translations";

export const getProofreadText = async (apiKey: string, text: string, lang: Language): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Proofread and correct the following conversation transcript for spelling, grammar, and punctuation. The language of the transcript is ${lang}. Only return the fully corrected text. Do not add any introductory phrases like "Here is the corrected text:".
    
    Transcript:
    ---
    ${text}
    ---
    `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const responseText = response.text;
        if (typeof responseText !== 'string') {
            console.error("Gemini API returned a non-text response for proofreading:", response);
            throw new Error("Invalid response from AI. The response might have been blocked.");
        }
        return responseText.trim();

    } catch (error) {
        console.error("Error calling Gemini API for proofreading:", error);
        throw new Error("Failed to get proofread text from AI.");
    }
};

export const getAIResponse = async (apiKey: string, userPrompt: string, context: string, lang: Language): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey });
        const systemInstruction = `You are a helpful AI assistant analyzing a conversation transcript. The user will ask you a question about it. The language of the conversation is ${lang}. Provide a concise and helpful response.`;

        const prompt = `
            Conversation Transcript:
            ---
            ${context}
            ---

            User's question: "${userPrompt}"
        `;
        
        // FIX: Moved `systemInstruction` into a `config` object as per the Gemini API guidelines.
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
            },
        });
        
        const responseText = response.text;
        if (typeof responseText !== 'string') {
            console.error("Gemini API returned a non-text response for AI query:", response);
            throw new Error("Invalid response from AI. The response might have been blocked.");
        }
        return responseText.trim();

    } catch (error) {
        console.error("Error calling Gemini API for AI response:", error);
        throw new Error("Failed to get response from AI.");
    }
};

import { GoogleGenAI, Type } from "@google/genai";
import { Language } from "./translations";
import { ActionItem } from "../types";

const getAIClient = (apiKey: string) => new GoogleGenAI({ apiKey });

const handleAIError = (error: unknown, context: string): never => {
    console.error(`Error calling Gemini API for ${context}:`, error);
    throw new Error(`Failed to get ${context} from AI.`);
};

const safelyGetText = (response: any): string => {
    const text = response?.text;
    if (typeof text === 'string') {
        return text.trim();
    }
    console.error("Gemini API returned a non-text or invalid response:", response);
    throw new Error("Invalid response from AI. The response might have been blocked.");
};

export const getSummary = async (apiKey: string, text: string, lang: Language): Promise<string> => {
    try {
        const ai = getAIClient(apiKey);
        const prompt = `Generate a concise summary of the following conversation transcript. The language of the transcript is ${lang}. The summary should capture the main points and outcomes.

        Transcript:
        ---
        ${text}
        ---
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        
        return safelyGetText(response);
    } catch (error) {
        handleAIError(error, 'summary');
    }
};

export const getActionItems = async (apiKey: string, text: string, lang: Language): Promise<ActionItem[]> => {
    try {
        const ai = getAIClient(apiKey);
        const prompt = `Analyze the following conversation transcript in ${lang} and extract all specific action items, tasks, or follow-ups mentioned.

        Transcript:
        ---
        ${text}
        ---
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            task: {
                                type: Type.STRING,
                                description: "A specific action item or task to be completed."
                            },
                        },
                        required: ["task"],
                    },
                },
            }
        });
        
        const jsonText = safelyGetText(response);
        return JSON.parse(jsonText);
    } catch (error) {
        handleAIError(error, 'action items');
    }
};

export const getKeyTopics = async (apiKey: string, text: string, lang: Language): Promise<string[]> => {
    try {
        const ai = getAIClient(apiKey);
        const prompt = `Analyze the following conversation transcript in ${lang} and identify the main topics or themes discussed. Return a list of 3-5 key topics.

        Transcript:
        ---
        ${text}
        ---
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                 responseMimeType: "application/json",
                 responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING,
                        description: "A key topic or theme from the conversation."
                    },
                 },
            }
        });

        const jsonText = safelyGetText(response);
        return JSON.parse(jsonText);
    } catch (error) {
        handleAIError(error, 'key topics');
    }
};

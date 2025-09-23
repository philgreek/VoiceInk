
import { GoogleGenAI, Type } from "@google/genai";
import { Language, t } from "./translations";
import { ActionItem, TextStyle } from "../types";

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
        const prompt = `Generate a concise summary of the following conversation transcript. The language of the transcript is ${lang}. The summary should capture the main points and outcomes. Respond in ${lang}.

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
        const prompt = `Analyze the following conversation transcript in ${lang} and extract all specific action items, tasks, or follow-ups mentioned. Respond in ${lang}.

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
        const prompt = `Analyze the following conversation transcript in ${lang} and identify the main topics or themes discussed. Return a list of 3-5 key topics. Respond in ${lang}.

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

export const getProofreadAndStyledText = async (apiKey: string, text: string, style: TextStyle, lang: Language): Promise<string> => {
    try {
        const ai = getAIClient(apiKey);
        const styleName = t(`style${style.charAt(0).toUpperCase() + style.slice(1)}` as any, lang);
        
        const prompt = `You are an expert editor. Your task is to first thoroughly proofread the following text for any grammatical errors, spelling mistakes, and punctuation errors. 
        Then, rewrite and reformat the entire text to fit the '${styleName}' profile. 
        The final output should be a clean, polished, and well-structured version of the text in the requested style.
        The original language is ${lang}, and your response MUST be in ${lang}.
        
        Style Guide for '${styleName}':
        - **Default/Meeting/Dialogue:** Clean up the dialogue, correct mistakes, but keep the conversational flow. Ensure speaker labels are clear.
        - **Lecture:** Transform into a well-structured educational text. Use clear headings, paragraphs, and bullet points for key information. Maintain a formal, instructive tone.
        - **Interview:** Format as a classic Q&A. Clearly label questions (Q:) and answers (A:). Ensure the flow is logical.
        - **Consultation/Psychological/Legal:** Adopt a professional and formal tone. Structure the text logically, perhaps with sections for problem, analysis, and recommendation. Ensure clarity and precision.
        - **Podcast/Blog:** Make the text more engaging, narrative, and conversational. Break up long paragraphs. Use headings and possibly rhetorical questions to draw the reader in.
        - **Business:** Use a professional, concise, and direct tone. Focus on clarity and actionability. Structure with bullet points and clear takeaways.
        - **Literary:** Rewrite the text with a more descriptive, evocative, and narrative style. Pay attention to prose and flow.
        - **Scientific:** Use a formal, objective, and precise tone. Structure the text logically with clear sections if applicable. Use appropriate terminology.

        Transcript to process:
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
        handleAIError(error, 'proofreading and styling');
    }
};

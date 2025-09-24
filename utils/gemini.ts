

import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Language, t } from "./translations";
import { ActionItem, TextStyle, AIAgent, AIChatMessage, Entity } from "../types";

const getAIClient = (apiKey: string) => new GoogleGenAI({ apiKey });

const handleAIError = (error: unknown, context: string): never => {
    console.error(`Error calling Gemini API for ${context}:`, error);
    throw new Error(`Failed to get ${context} from AI.`);
};

// FIX: Update to use GenerateContentResponse and access text directly.
// The .text accessor will throw if the response is blocked or has no text,
// which is caught by the outer try/catch blocks.
const safelyGetText = (response: GenerateContentResponse): string => {
    return response.text.trim();
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

// FIX: Add explicit type for the API response.
        const response: GenerateContentResponse = await ai.models.generateContent({
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
        const prompt = `Analyze the following conversation transcript and extract all specific action items, tasks, or follow-ups mentioned. Respond in the same language as the transcript (${lang}).

        Transcript:
        ---
        ${text}
        ---
        `;

// FIX: Add explicit type for the API response.
        const response: GenerateContentResponse = await ai.models.generateContent({
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
        const prompt = `Analyze the following conversation transcript and identify the main topics or themes discussed. Return a list of 3-5 key topics. Respond in the same language as the transcript (${lang}).

        Transcript:
        ---
        ${text}
        ---
        `;

// FIX: Add explicit type for the API response.
        const response: GenerateContentResponse = await ai.models.generateContent({
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
        const styleName = t(`style${style.charAt(0).toUpperCase() + style.slice(1)}` as any, 'en'); // Use english key to avoid header error
        
        const prompt = `You are an expert editor. Your task is to first thoroughly proofread the following text for any grammatical errors, spelling mistakes, and punctuation errors. 
        Then, rewrite and reformat the entire text to fit the '${styleName}' profile. 
        The final output should be a clean, polished, and well-structured version of the text in the requested style.
        The original language is ${lang}, and your response MUST be in ${lang}.
        
        Style Guide for '${styleName}':
        - **Meeting/Dialogue:** Clean up the dialogue, correct mistakes, but keep the conversational flow. Ensure speaker labels are clear.
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

// FIX: Add explicit type for the API response.
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return safelyGetText(response);
    } catch (error) {
        handleAIError(error, 'proofreading and styling');
    }
};

const agentSystemInstructions: Record<AIAgent, string> = {
    legal: "You are a Legal Advisor. Analyze the text from a legal perspective. Identify potential risks, liabilities, contractual obligations, and legal implications. Provide precise, cautious, and professional advice. Do not provide definitive legal counsel, but highlight areas that may require legal attention.",
    psychologist: "You are a Psychologist and Supervisor. Analyze the conversation's emotional dynamics, communication patterns, and underlying psychological themes. Offer insights into the speakers' states of mind, potential conflicts, and relational dynamics. Use professional psychological terminology appropriately.",
    coach: "You are a Performance and Business Coach. Focus on goals, strategies, motivation, and actionable feedback. Identify opportunities for growth, skill development, and improved performance mentioned in the text. Your tone should be encouraging and forward-looking.",
    editor: "You are a professional Editor. Analyze the text for clarity, conciseness, structure, and style. Suggest improvements to the language and flow. Do not just correct grammar, but enhance the overall readability and impact of the text.",
    financial: "You are a Financial Analyst. Scrutinize the text for any financial data, budget discussions, investment opportunities, costs, revenues, and economic risks. Provide a concise analysis of the financial situation as described in the conversation.",
    tutor: "You are a Tutor. Analyze the conversation to identify knowledge gaps, misunderstandings, or areas where a speaker could improve their understanding. Explain complex topics simply and ask clarifying questions. Your goal is to educate and clarify.",
    speechwriter: "You are a Speechwriter. Your task is to transform the key ideas from the conversation into a compelling speech, presentation, or monologue. Focus on creating a strong narrative, clear structure, and persuasive language. Identify the core message and build a powerful argument around it."
};

export const getAgentResponse = async (apiKey: string, text: string, agents: AIAgent[], lang: Language, chatHistory: AIChatMessage[]): Promise<string> => {
    try {
        const ai = getAIClient(apiKey);
        
        const systemInstructions = agents
            .map(agent => agentSystemInstructions[agent])
            .join("\n\n");
            
        const fullSystemInstruction = `You are a multi-disciplinary AI expert. Your current active roles are: ${agents.join(', ')}.
        ${systemInstructions}
        You have been provided with a conversation transcript as the primary context. Answer the user's questions based on this transcript. Respond in ${lang}.`;
        
// FIX: Construct the full chat history and pass it to the 'contents' property.
// The previous implementation was incorrectly discarding the chat history.
        const contents: AIChatMessage[] = [
            { role: 'user', parts: [{ text: `Here is the conversation transcript for context:\n\n---\n${text}\n---` }] },
            { role: 'model', parts: [{ text: `Understood. I have reviewed the transcript. I am ready to answer your questions based on my active roles: ${agents.join(', ')}.` }] },
            ...chatHistory
        ];

// FIX: Add explicit type for the API response.
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
            config: {
                systemInstruction: fullSystemInstruction
            }
        });

        return safelyGetText(response);
    } catch (error) {
        handleAIError(error, 'AI agent chat');
    }
};

export const extractEntities = async (apiKey: string, text: string, lang: Language): Promise<Entity[]> => {
    try {
        const ai = getAIClient(apiKey);
        const prompt = `Analyze the following conversation transcript in ${lang} and extract key entities. Identify names of people, organizations, specific dates, locations, and monetary values.

        Transcript:
        ---
        ${text}
        ---
        `;

// FIX: Add explicit type for the API response.
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            text: {
                                type: Type.STRING,
                                description: "The exact entity text as it appears in the conversation."
                            },
                            type: {
                                type: Type.STRING,
                                enum: ['PERSON', 'ORGANIZATION', 'DATE', 'LOCATION', 'MONEY', 'OTHER'],
                                description: "The type of the entity."
                            }
                        },
                        required: ["text", "type"]
                    }
                }
            }
        });
        
        const jsonText = safelyGetText(response);
        return JSON.parse(jsonText);
    } catch (error) {
        handleAIError(error, 'entity extraction');
    }
};
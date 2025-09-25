
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Language, t } from "./translations";
import { ActionItem, TextStyle, AIAgentExpertise, AIAgentDomain, AIChatMessage, Entity, Source, Message } from "../types";

const getAIClient = (apiKey: string) => new GoogleGenAI({ apiKey });

const handleAIError = (error: unknown, context: string): never => {
    console.error(`Error calling Gemini API for ${context}:`, error);
    throw new Error(`Failed to get ${context} from AI.`);
};

const safelyGetText = (response: GenerateContentResponse): string => {
    return response.text.trim();
};

export const getSummary = async (apiKey: string, text: string, lang: Language): Promise<string> => {
    // This function can now take the full context from all sources
    try {
        const ai = getAIClient(apiKey);
        const prompt = `Generate a concise summary of the following content. The content may include multiple sources like transcripts, documents, and web pages. The language is ${lang}. The summary should capture the main points and outcomes from all provided sources. Respond in ${lang}.

        Content:
        ---
        ${text}
        ---
        `;

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
    // This function can now take the full context from all sources
    try {
        const ai = getAIClient(apiKey);
        const prompt = `Analyze the following content (which may include multiple sources) and extract all specific action items, tasks, or follow-ups mentioned. Respond in ${lang}. Your response must be a valid JSON array of objects.

        Content:
        ---
        ${text}
        ---
        `;

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
    // This function can now take the full context from all sources
    try {
        const ai = getAIClient(apiKey);
        const prompt = `Analyze the following content (which may include multiple sources) and identify the main topics or themes discussed. Return a list of 3-5 key topics. Respond in ${lang}. Your response must be a valid JSON array of strings.

        Content:
        ---
        ${text}
        ---
        `;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                 responseMimeType: "application/json",
                 responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING,
                        description: "A key topic or theme from the content."
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
    // This function primarily works on the main transcription, not all sources.
    try {
        const ai = getAIClient(apiKey);
        const styleName = t(`style${style.charAt(0).toUpperCase() + style.slice(1)}` as any, 'en');
        
        const prompt = `You are an expert editor. Your task is to first thoroughly proofread the following text for any grammatical errors, spelling mistakes, and punctuation errors. 
        Then, rewrite and reformat the entire text to fit the '${styleName}' profile. 
        The final output should be a clean, polished, and well-structured version of the text in the requested style.
        The original language is ${lang}, and your response MUST be in ${lang}.
        
        Transcript to process:
        ---
        ${text}
        ---
        `;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return safelyGetText(response);
    } catch (error) {
        handleAIError(error, 'proofreading and styling');
    }
};

const agentExpertiseInstructions: Record<AIAgentExpertise, string> = {
    // Definitions remain the same
    interviewer: "As an Interviewer, your goal is to assess the conversation. Identify the key questions asked and the quality of the answers. Note the speaker's communication skills, confidence, and knowledge. Point out strengths and weaknesses.",
    reporter: "As a Reporter, your goal is to find the story. Extract the most newsworthy facts, quotes, and events from the text. Structure your analysis like a news brief, focusing on the who, what, when, where, and why.",
    recruiter: "As a Recruiter, analyze the transcript from a hiring perspective. Evaluate the candidate's skills, experience, and cultural fit based on their responses. Identify red flags or positive signals.",
    sociologist: "As a Sociologist, examine the social dynamics within the conversation. Analyze power structures, social norms, group identity, and cultural references. Comment on how the speakers' interactions reflect broader social patterns.",
    screenwriter: "As a Screenwriter, look for dramatic potential. Identify the core conflict, character arcs, key plot points, and memorable lines of dialogue. Suggest how this conversation could be adapted into a scene.",
    translator: "As a Translator & Linguist, focus on the nuances of language. Analyze the use of idiom, slang, tone, and subtext. Identify potential translation challenges or cross-cultural communication issues.",
    marketing_analyst: "As a Marketing Analyst, analyze the conversation for customer insights. Identify pain points, needs, brand perceptions, and purchasing signals. Extract any data that could inform a marketing strategy.",
    tech_support: "As a Tech Support Specialist, your goal is to solve the problem. Identify the technical issue described, the steps taken to troubleshoot it, and the proposed solution. Structure the analysis as a support ticket summary.",
    business_analyst: "As a Business Analyst, focus on processes, requirements, and stakeholders. Identify business needs, potential improvements, and key performance indicators (KPIs) mentioned in the conversation.",
    financial_advisor: "As a Financial Advisor, scrutinize the text for any financial data, budget discussions, investment opportunities, costs, revenues, and economic risks. Provide a concise analysis of the financial situation.",
    project_manager: "As a Project Manager, identify project goals, timelines, resources, risks, and stakeholder responsibilities. Extract a list of action items and key decisions.",
    course_developer: "As a Course Developer, analyze the transcript for educational content. Identify key learning objectives, concepts, and examples. Suggest how this content could be structured into a lesson or course module.",
    academic_researcher: "As an Academic Researcher, analyze the text for a research hypothesis, evidence, and conclusions. Identify the core arguments, methodologies discussed, and contributions to a field of knowledge.",
    therapist: "As a Therapist/Counselor, analyze the conversation's emotional dynamics, communication patterns, and underlying psychological themes. Offer insights into the speakers' states of mind, potential conflicts, and relational dynamics. Use professional psychological terminology appropriately.",
    psychologist: "As a Psychologist and Supervisor. Analyze the conversation's emotional dynamics, communication patterns, and underlying psychological themes. Offer insights into the speakers' states of mind, potential conflicts, and relational dynamics. Use professional psychological terminology appropriately.",
    legal_assistant: "As a Legal Assistant/Paralegal, analyze the text from a legal perspective. Identify potential risks, liabilities, contractual obligations, and legal implications. Provide precise, cautious, and professional advice. Do not provide definitive legal counsel, but highlight areas that may require legal attention.",
    detective: "As a Detective/Analyst, look for inconsistencies, hidden meanings, and evidence. Analyze the statements for credibility, motive, and opportunity. Piece together a timeline of events based on the conversation.",
    chef_nutritionist: "As a Chef/Nutritionist, analyze the conversation for discussions about food, recipes, dietary habits, and health goals. Extract recipes, meal plans, or provide nutritional advice based on the text.",
    customer_manager: "As a Customer Relationship Manager, analyze the conversation to gauge customer satisfaction. Identify complaints, positive feedback, and opportunities to improve the customer experience.",
    coach: "As a Performance and Business Coach. Focus on goals, strategies, motivation, and actionable feedback. Identify opportunities for growth, skill development, and improved performance mentioned in the text. Your tone should be encouraging and forward-looking.",
    editor: "As a professional Editor. Analyze the text for clarity, conciseness, structure, and style. Suggest improvements to the language and flow. Do not just correct grammar, but enhance the overall readability and impact of the text.",
    tutor: "As a Tutor. Analyze the conversation to identify knowledge gaps, misunderstandings, or areas where a speaker could improve their understanding. Explain complex topics simply and ask clarifying questions. Your goal is to educate and clarify.",
    speechwriter: "As a Speechwriter. Your task is to transform the key ideas from the conversation into a compelling speech, presentation, or monologue. Focus on creating a strong narrative, clear structure, and persuasive language. Identify the core message and build a powerful argument around it."
};

export const getAgentResponse = async (apiKey: string, context: string, agents: { expertise: AIAgentExpertise[], domains: AIAgentDomain[] }, lang: Language, chatHistory: AIChatMessage[]): Promise<string> => {
    try {
        const ai = getAIClient(apiKey);
        
        const expertiseInstructions = agents.expertise
            .map(exp => agentExpertiseInstructions[exp] || '')
            .join("\n\n");
        
        const expertiseNames = agents.expertise.map(e => t(`agent${e.charAt(0).toUpperCase() + e.slice(1)}` as any, lang)).join(', ');
        const domainNames = agents.domains.map(d => t(`domain${d.charAt(0).toUpperCase() + d.slice(1)}` as any, lang)).join(', ');

        let fullSystemInstruction = `You are a multi-disciplinary AI expert. Your current active expert roles are: ${expertiseNames}.
        ${expertiseInstructions}
        You must apply this expertise strictly within the following domains: ${domainNames}.
        You have been provided with a set of source documents as the primary context. Answer the user's questions based ONLY on the provided sources, through the combined lens of your active roles and domains. If the answer is not in the sources, say that you cannot find the information in the provided context. Respond in ${lang}.`;

        const contents: AIChatMessage[] = [
            { role: 'user', parts: [{ text: `Here are the source documents for context:\n\n---\n${context}\n---` }] },
            { role: 'model', parts: [{ text: `Understood. I have reviewed all the provided sources. I am ready to answer your questions based on my active roles as a ${expertiseNames} specializing in ${domainNames}.` }] },
            ...chatHistory
        ];

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
    // This function primarily works on the main transcription, not all sources.
    try {
        const ai = getAIClient(apiKey);
        const prompt = `Analyze the following conversation transcript in ${lang} and extract key entities. Identify names of people, organizations, specific dates (like "tomorrow" or "next week" are also valid), locations, and monetary values.

        Transcript:
        ---
        ${text}
        ---
        `;

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

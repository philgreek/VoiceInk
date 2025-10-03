import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Language, t } from "./translations";
import { ActionItem, TextStyle, AIAgentExpertise, AIAgentDomain, AIChatMessage, Entity, Source, Message, SourceGuide, TextStyleId, Citation, Insight } from "../types";

const getAIClient = (apiKey: string) => new GoogleGenAI({ apiKey });

const handleAIError = (error: unknown, context: string): never => {
    console.error(`Error calling Gemini API for ${context}:`, error);
    // Re-throw the original error to allow status code inspection
    if (error instanceof Error) {
        throw error;
    }
    throw new Error(`Failed to get ${context} from AI.`);
};

const safelyGetText = (response: GenerateContentResponse): string => {
    try {
        const text = response.text;
        // The text property should always exist and be a string on a successful response.
        if (typeof text === 'string') {
            return text.trim();
        }
        // This path indicates an unusual but non-exception-throwing failure.
        console.warn("Could not extract text from Gemini response. The 'text' property was not a string.", { response });
        return '';
    } catch (e) {
        // This path indicates the .text getter threw an error, which is unexpected.
        console.error("Error accessing the .text property on the Gemini response.", { error: e, response });
        return '';
    }
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

export const getStyledText = async (apiKey: string, text: string, style: TextStyleId, lang: Language): Promise<string> => {
    try {
        const ai = getAIClient(apiKey);
        const styleName = t(`style${style.charAt(0).toUpperCase() + style.slice(1)}` as any, 'en');
        
        const prompt = `You are an expert editor. Rewrite the following text in a clear, polished, and well-structured '${styleName}' style. Correct any grammatical errors, spelling mistakes, and punctuation errors.
        The original language is ${lang}, and your response MUST be in ${lang}.
        
        Text to process:
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
        handleAIError(error, 'styling text');
    }
};

export const getAgentResponse = async (
    apiKey: string, 
    context: string, 
    chatHistoryWithPrompt: AIChatMessage[], 
    lang: Language
): Promise<{ answer: string; citations: { sourceName: string; fragment: string }[] }> => {
    try {
        const ai = getAIClient(apiKey);
        
        const systemInstruction = `You are an expert research assistant. Your task is to answer user queries based ONLY on the provided source documents.
        
        Follow these instructions precisely:
        1.  Analyze the user's query and the provided source documents.
        2.  Construct a concise answer to the query using only information found in the sources.
        3.  For every piece of information, statement, or data point you include in your answer, you MUST provide a numerical citation marker, like [1], [2], etc.
        4.  After the answer, provide a list of citations. Each citation must correspond to a marker in your answer and contain the source name and the exact text fragment (quote) from the document that supports that part of the answer.
        5.  If you cannot answer the question based on the provided sources, you must state that the information is not available in the documents. Do not use any external knowledge.
        6.  Your entire response MUST be a valid JSON object that adheres to the provided schema.
        7.  Respond in ${lang}.`;

        const fullContents: AIChatMessage[] = [];
        
        // Add context as the first user message if it exists
        if (context.trim()) {
            fullContents.push({ role: 'user', parts: [{ text: `Here are the source documents for context:\n\n---\n${context}\n---` }] });
            fullContents.push({ role: 'model', parts: [{ text: `Understood. I have reviewed all the provided sources. I am ready to answer questions based only on this context.` }] });
        }
        
        // Add the rest of the chat history and the current prompt
        fullContents.push(...chatHistoryWithPrompt);

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullContents,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        answer: {
                            type: Type.STRING,
                            description: "The concise, synthesized answer to the user's query, including numerical citation markers like [1], [2], etc."
                        },
                        citations: {
                            type: Type.ARRAY,
                            description: "A list of citation objects that support the answer.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    sourceName: {
                                        type: Type.STRING,
                                        description: "The name of the source document from which the fragment was taken."
                                    },
                                    fragment: {
                                        type: Type.STRING,
                                        description: "The exact quote or text fragment from the source document that backs up the information."
                                    }
                                },
                                required: ["sourceName", "fragment"]
                            }
                        }
                    },
                    required: ["answer", "citations"]
                }
            },
        });
        
        const jsonText = safelyGetText(response);
        return JSON.parse(jsonText);

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

export const getSourceGuide = async (apiKey: string, content: string, lang: Language): Promise<SourceGuide> => {
    try {
        const ai = getAIClient(apiKey);
        const prompt = `You are a research analyst. Analyze the following document and generate a structured 'Source Guide'. Your response must be in valid JSON format.
1.  **keyTopics**: Identify 3-5 main themes. For each theme, provide the main topic name and a list of 3-5 key theses that explain it.
2.  **keyTakeaways**: Provide a concise list of the 3-5 most important conclusions or overall arguments from the document.
3.  **keyPeople**: Extract the most important and frequently mentioned people, organizations, and key technical terms. Categorize each one as 'Person', 'Organization', or 'Term'.

Respond in ${lang}.

Document:
---
${content}
---
`;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        keyTopics: {
                            type: Type.ARRAY,
                            description: "A list of the main topics covered in the document.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    topic: {
                                        type: Type.STRING,
                                        description: "The name of the main topic."
                                    },
                                    theses: {
                                        type: Type.ARRAY,
                                        description: "A list of key theses or points related to the topic.",
                                        items: {
                                            type: Type.STRING
                                        }
                                    }
                                },
                                required: ["topic", "theses"]
                            }
                        },
                        keyTakeaways: {
                            type: Type.ARRAY,
                            description: "A list of the most important conclusions or takeaways from the document.",
                            items: {
                                type: Type.STRING
                            }
                        },
                        keyPeople: {
                            type: Type.ARRAY,
                            description: "A list of key people, organizations, or terms mentioned.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: {
                                        type: Type.STRING,
                                        description: "The name of the entity."
                                    },
                                    type: {
                                        type: Type.STRING,
                                        enum: ['Person', 'Organization', 'Term', 'Place', 'Date'],
                                        description: "The category of the entity."
                                    }
                                },
                                required: ["name", "type"]
                            }
                        }
                    },
                    required: ["keyTopics", "keyTakeaways", "keyPeople"]
                }
            }
        });
        
        const jsonText = safelyGetText(response);
        return JSON.parse(jsonText);
    } catch (error) {
        handleAIError(error, 'source guide');
    }
};


export const getDiscussionForTopic = async (apiKey: string, topic: string, context: string, lang: Language): Promise<string> => {
    try {
        const ai = getAIClient(apiKey);
        const prompt = `You are a research assistant. Your task is to create a structured summary about the topic "${topic}" based *only* on the provided source text. 
        Structure your response using markdown for headings and lists.
        Crucially, for every piece of information you take from the source text, you MUST include an inline citation pointing to the exact sentence or phrase you are referencing. Use the format {{cite: "the exact quote from the source text here"}}. Do not summarize without citing.
        Respond in ${lang}.

        Source Text:
        ---
        ${context}
        ---
        `;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        
        return safelyGetText(response);
    } catch (error) {
        handleAIError(error, 'discussion for topic');
    }
};

export const getEmotionAnalysis = async (apiKey: string, text: string, lang: Language): Promise<string> => {
    try {
        const ai = getAIClient(apiKey);
        const prompt = `You are an expert psychologist. Analyze the emotional content of the following text. Identify the primary emotions expressed by the speakers (e.g., joy, sadness, anger, surprise, fear, frustration). Provide a brief analysis of the overall emotional arc of the conversation. Find 3-5 key emotional shifts and provide quotes to illustrate them. Respond in ${lang}.

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
        handleAIError(error, 'emotion analysis');
    }
};

export const getTonalityAnalysis = async (apiKey: string, text: string, lang: Language): Promise<string> => {
    try {
        const ai = getAIClient(apiKey);
        const prompt = `You are an expert linguist. Analyze the tonality of the following text. Describe the overall tone of the conversation (e.g., formal, informal, friendly, tense, professional, humorous, sarcastic) and how it evolves. Provide specific examples from the text to support your analysis. Respond in ${lang}.

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
        handleAIError(error, 'tonality analysis');
    }
};

export const getBrainstormIdeas = async (apiKey: string, text: string, lang: Language): Promise<string> => {
    try {
        const ai = getAIClient(apiKey);
        const prompt = `You are a creative strategist. Based on the following text, generate a list of new ideas, alternative viewpoints, and related concepts. Think outside the box. Structure the response clearly. Respond in ${lang}.

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
        handleAIError(error, 'brainstorming');
    }
};

export const getGrammarCheck = async (apiKey: string, text: string, lang: Language): Promise<string> => {
    try {
        const ai = getAIClient(apiKey);
        const prompt = `You are an expert editor. Proofread the following text thoroughly. Correct all grammatical errors, spelling mistakes, and punctuation errors. Return only the corrected version of the text without any additional comments or explanations. The language is ${lang}.

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
        handleAIError(error, 'grammar check');
    }
};

export const getPromptWizardResponse = async (apiKey: string, history: AIChatMessage[], lang: Language): Promise<string> => {
    try {
        const ai = getAIClient(apiKey);
        const systemInstruction = `You are an AI assistant expert in creating and refining prompts for large language models. Your goal is to help the user craft the perfect prompt for their task. You can generate new prompts from scratch based on a user's goal, or you can take an existing prompt and improve it by making it more specific, adding context, defining the desired format, or suggesting alternative phrasings. Always be helpful and collaborative. Respond in ${lang}.`;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: history,
            config: {
                systemInstruction: systemInstruction,
            }
        });

        return safelyGetText(response);
    } catch (error) {
        handleAIError(error, 'prompt wizard');
    }
};

export const getInsightsForText = async (apiKey: string, text: string, lang: Language): Promise<Insight[]> => {
    try {
        const ai = getAIClient(apiKey);
        const prompt = `You are a research analyst. Analyze the following text. Your task is to extract key entities, terms, people, places, dates, or events. For each extracted term, provide a very brief, one-sentence definition or context. Respond in ${lang}.

        Text Content:
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
                            term: {
                                type: Type.STRING,
                                description: "The extracted term, name, place, event, or date."
                            },
                            definition: {
                                type: Type.STRING,
                                description: "A brief, one-sentence definition or context for the term."
                            }
                        },
                        required: ["term", "definition"]
                    }
                }
            }
        });
        
        const jsonText = safelyGetText(response);
        return JSON.parse(jsonText);
    } catch (error) {
        handleAIError(error, 'insights extraction');
    }
};
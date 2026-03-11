import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export type OSCARIntent =
    | 'analyze_deal'
    | 'filter_deals'
    | 'blast_deal'
    | 'open_escrow'
    | 'general_question'
    | 'unknown';

export interface ParsedIntent {
    intent: OSCARIntent;
    parameters: any;
    confidence: number;
}

const PARSER_SYSTEM_PROMPT = `
You are the OSCAR Intent Parser for the WholesaleOS real estate platform.
Your job is to analyze the user's natural language command and decide WHICH action they want to perform.

Choose ONE of the following intents:
1. analyze_deal: The user wants to underwrite, analyze, or score a specific deal.
    Parameters to extract: address (string)
2. filter_deals: The user wants to see a list of deals matching specific criteria.
    Parameters to extract: min_score (number), max_arv (number), area (string)
3. blast_deal: The user wants to send a deal to investors or buyers.
    Parameters to extract: target_group (string), address (string)
4. open_escrow: The user wants to initiate an escrow or closing workflow.
    Parameters to extract: address (string)
5. general_question: The user is asking a conversational question, not executing an action.

Output ONLY a valid JSON object matching this schema, with no markdown formatting:
{
  "intent": "...",
  "parameters": { ... },
  "confidence": 0.95
}
`;

export async function parseIntent(userMessage: string): Promise<ParsedIntent> {
    if (!genAI) {
        return { intent: 'general_question', parameters: {}, confidence: 1 };
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro", generationConfig: { responseMimeType: "application/json" } });
        const result = await model.generateContent(`${PARSER_SYSTEM_PROMPT}\n\nUser Command: "${userMessage}"`);

        const responseText = result.response.text();
        const parsed = JSON.parse(responseText);
        return parsed as ParsedIntent;
    } catch (error) {
        console.error("OSCAR Intent Parser Error:", error);
        // Fallback to conversational AI if parsing fails
        return { intent: 'general_question', parameters: {}, confidence: 0 };
    }
}

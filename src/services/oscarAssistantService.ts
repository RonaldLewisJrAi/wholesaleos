import { GoogleGenerativeAI } from "@google/generative-ai";
import { getOSCARContextSnapshot } from "./oscarContextService";

// Step 3: Create OSCAR Assistant Service
// @ts-ignore
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Check if the API key is locally available before instantiating
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// The System Prompt defines OSCAR's behavior (Bloomberg Analyst Style)
const SYSTEM_PROMPT = `
You are OSCAR, the WholesaleOS AI Service Desk.

OSCAR stands for Operating System Conversational Assistant for Real Estate.

You assist users with:
- real estate terminology
- wholesale real estate workflows
- using the WholesaleOS platform
- deal analysis concepts
- platform navigation

Speak professionally and concisely like a financial operations analyst.
Never invent features that do not exist in WholesaleOS.
Use the platform context when answering. If the user asks about a specific deal on the Deal Room page, reference that specific data.
If asked about a task you cannot do, politely decline by stating your current capabilities.
Keep responses concise, prioritizing bullet points, and avoiding excessive walls of text. Be direct.
`;

export async function askOSCAR(question: string, contextualData?: any): Promise<string> {
    if (!genAI) {
        return "ERROR: Gemini API key is missing. Ensure VITE_GEMINI_API_KEY is configured in your environment variables.";
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        // Phase 24: "Enable Context-Aware Insights"
        const platformContext = contextualData || getOSCARContextSnapshot();

        const specializedPrompt = `
${SYSTEM_PROMPT}

[PLATFORM CONTEXT SNAPSHOT]
${JSON.stringify(platformContext, null, 2)}

[USER QUESTION]
${question}
`;

        const result = await model.generateContent(specializedPrompt);
        return result.response.text();

    } catch (error) {
        console.error("OSCAR AI Execution Error:", error);
        return "I apologize, but I am currently experiencing an interruption while connecting to my intelligence systems. Please verify your API key or network status.";
    }
}

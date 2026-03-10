import { GoogleGenerativeAI } from "@google/generative-ai";
import { getOSARContextSnapshot } from "./osarContextService";

// Step 3: Create OSAR Assistant Service
const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;

// Check if the API key is locally available before instantiating
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// The System Prompt defines OSAR's behavior (Bloomberg Analyst Style)
const SYSTEM_PROMPT = `
You are OSAR, the WholesaleOS Service Desk.

You assist users with:
- real estate terminology
- wholesale real estate workflows
- using the WholesaleOS platform
- deal analysis concepts
- investor decision support

Speak professionally and concisely like a financial operations analyst.
Never invent features that do not exist in WholesaleOS.
Use the platform context when answering. If the user asks about a specific deal on the Deal Room page, reference that specific data.
If asked about a task you cannot do, politely decline by stating your current capabilities.
Keep responses concise, prioritizing bullet points, and avoiding excessive walls of text. Be direct.
`;

export async function askOSAR(question: string, contextualData?: any): Promise<string> {
    if (!genAI) {
        return "ERROR: Gemini API key is missing. Ensure VITE_GEMINI_API_KEY is configured in your environment variables.";
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        // Phase 24: "Enable Context-Aware Insights"
        const platformContext = contextualData || getOSARContextSnapshot();

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
        console.error("OSAR AI Execution Error:", error);
        return "I apologize, but I am currently experiencing an interruption while connecting to my intelligence systems. Please verify your API key or network status.";
    }
}

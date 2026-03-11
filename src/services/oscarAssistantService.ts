import { GoogleGenerativeAI } from "@google/generative-ai";
import { getOSCARContextSnapshot } from "./oscarContextService";
import { oscarKnowledge } from "../ai/oscarKnowledge";

// Step 3: Create OSCAR Assistant Service
// @ts-ignore
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Check if the API key is locally available before instantiating
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// The System Prompt defines OSCAR's behavior (Bloomberg Analyst Style)
const SYSTEM_PROMPT = `
You are OSCAR, the WholesaleOS AI Service Desk.

OSCAR stands for Operating System Conversational Assistant for Real Estate.

You help users with:

real estate terminology
wholesale real estate workflows
using the WholesaleOS platform
deal analysis concepts
platform navigation

Platform Knowledge:
${oscarKnowledge}

Use the platform context when answering questions.

Respond professionally like a real estate operations analyst.
`;

export async function askOSCAR(question: string, contextualData?: any): Promise<string> {
    if (!genAI) {
        return "ERROR: Gemini API key is missing. Ensure VITE_GEMINI_API_KEY is configured in your environment variables.";
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        // Phase 24: "Enable Context-Aware Insights"
        const context = contextualData || getOSCARContextSnapshot();
        const isBeginner = context?.guidance?.isBeginnerModeActive || localStorage.getItem('wholesale_os_beginner_mode') === 'true';

        const beginnerPromptExtension = isBeginner ? `
ACADEMY BEGINNER MODE ACTIVE:
The user is currently learning real estate wholesaling in the WholesaleOS Academy.
Explain concepts clearly, provide definitions for industry acronyms (like ARV, MAO, EMD), and offer supportive, step-by-step guidance.
` : '';

        const specializedPrompt = `
${SYSTEM_PROMPT}

${beginnerPromptExtension}

Platform Context:
${JSON.stringify(context, null, 2)}

User Question:
${question}
`;

        const result = await model.generateContent(specializedPrompt);
        return result.response.text();

    } catch (error) {
        console.error("OSCAR AI Execution Error:", error);
        return "I apologize, but I am currently experiencing an interruption while connecting to my intelligence systems. Please verify your API key or network status.";
    }
}

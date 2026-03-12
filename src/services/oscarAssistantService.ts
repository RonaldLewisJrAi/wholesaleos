import { getOSCARContextSnapshot } from "./oscarContextService";
import { submitOscarQuery } from "./ai/oscarAI";

export async function askOSCAR(question: string, contextualData?: any): Promise<string> {
    try {
        const context = contextualData || getOSCARContextSnapshot();
        const isBeginner = context?.guidance?.isBeginnerModeActive || localStorage.getItem('wholesale_os_beginner_mode') === 'true';

        let contextContext = "General Platform Help";
        if (isBeginner) {
            contextContext = `ACADEMY BEGINNER MODE ACTIVE:
The user is currently learning real estate wholesaling in the WholesaleOS Academy.
Explain concepts clearly, provide definitions for industry acronyms (like ARV, MAO, EMD), and offer supportive, step-by-step guidance.
Platform Context Snapshot: ${JSON.stringify(context)}`;
        }

        const response = await submitOscarQuery(question, contextContext);
        return response.text;

    } catch (error: any) {
        console.error("OSCAR AI Execution Error:", error);
        return error.message || "I apologize, but I am currently experiencing an interruption while connecting to my intelligence systems. Please verify your network status.";
    }
}

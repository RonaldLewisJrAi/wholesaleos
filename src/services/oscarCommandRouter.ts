import { parseIntent } from './oscarIntentParser';
import { executeAction, ActionExecutionResult } from './oscarActionExecutor';
import { askOSCAR } from './oscarAssistantService';

export interface RouterResponse {
    text: string;
    actionResult?: ActionExecutionResult;
    isCommand: boolean;
}

export async function routeOSCARCommand(userMessage: string, contextSnapshot?: any): Promise<RouterResponse> {
    // 1. Parse the Intent
    const parsedIntent = await parseIntent(userMessage);

    console.log("[OSCAR Command Router] Parsed Intent:", parsedIntent);

    // 2. Determine if this is an Action Command or General Conversation
    // A high confidence threshold prevents accidental actions from conversational questions.
    const isActionCommand =
        parsedIntent.intent !== 'general_question' &&
        parsedIntent.intent !== 'unknown' &&
        parsedIntent.confidence >= 0.7;

    if (isActionCommand) {
        // 3a. Execute the Action
        const actionResult = await executeAction(parsedIntent);

        return {
            text: actionResult.message,
            actionResult,
            isCommand: true
        };
    } else {
        // 3b. Route to standard conversational AI
        // (We assume we bypass router loop by calling a specialized ask method or standard prompt)
        const textResponse = await askOSCAR(userMessage, contextSnapshot);
        return {
            text: textResponse,
            isCommand: false
        };
    }
}

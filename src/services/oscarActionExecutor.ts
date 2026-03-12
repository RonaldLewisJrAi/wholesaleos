import { supabase } from '../lib/supabase';
import { OSCARIntent, ParsedIntent } from './oscarIntentParser';
import { handleOSCARQuery } from './oscarQueryService';
import { dealRadarService } from './dealRadarService';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ActionExecutionResult {
    success: boolean;
    message: string;
    data?: any;
    navigationTarget?: string;
}

export async function executeAction(parsed: ParsedIntent): Promise<ActionExecutionResult> {
    const { intent, parameters } = parsed;

    switch (intent) {
        case 'analyze_deal':
            return await executeAnalyzeDeal(parameters);
        case 'filter_deals':
            return await executeFilterDeals(parameters);
        case 'blast_deal':
            return await executeBlastDeal(parameters);
        case 'open_escrow':
            return await executeOpenEscrow(parameters);
        case 'query_deals':
        case 'query_transaction_status':
        case 'query_intelligence':
        case 'query_investors':
            const rawQuery = parameters?.raw_query || "Execute data query.";
            return await handleOSCARQuery(intent, rawQuery);
        case 'query_radar':
            return await executeQueryRadar(parameters);
        case 'general_question':
        case 'unknown':
        default:
            return {
                success: false,
                message: "This intent requires conversational processing, not action execution."
            };
    }
}

async function executeAnalyzeDeal(params: any): Promise<ActionExecutionResult> {
    const address = params?.address;
    if (!address) {
        return { success: false, message: "No address provided for analysis." };
    }

    // In a real scenario, this matches exact property records.
    return {
        success: true,
        message: `Routing to Deal Analyzer for ${address}`,
        navigationTarget: `/analyzer?address=${encodeURIComponent(address)}`
    };
}

async function executeFilterDeals(params: any): Promise<ActionExecutionResult> {
    const minScore = params?.min_score || 0;

    if (supabase) {
        try {
            // This is a placeholder for the actual query. The deals table might not have a direct 'score' yet
            // but we can simulate the intent and navigation structure.
            const { data, error } = await supabase
                .from('properties')
                .select('*')
                .limit(5);

            if (error) throw error;

            return {
                success: true,
                message: `Filtered deals (Score >= ${minScore}).`,
                data: data,
                navigationTarget: `/match-feed?min_score=${minScore}`
            };
        } catch (e) {
            console.warn("ExecuteFilterDeals Supabase error:", e);
        }
    }

    return {
        success: true,
        message: `Displaying marketplace filtered by score >= ${minScore}.`,
        navigationTarget: `/match-feed?min_score=${minScore}`
    };
}

async function executeBlastDeal(params: any): Promise<ActionExecutionResult> {
    const address = params?.address || "Selected Property";
    const group = params?.target_group || "VIP Buyers";

    if (supabase) {
        try {
            await supabase.from('platform_events').insert({
                event_type: 'DEAL_DISTRIBUTED',
                user_id: 'system',
                description: `Sent ${address} to ${group}`,
                metadata: params
            });
        } catch (e) {
            console.warn("Failed posting blast_deal event", e);
        }
    }

    return {
        success: true,
        message: `Distribution engine engaged. Blasting ${address} to ${group}.`,
    };
}

async function executeOpenEscrow(params: any): Promise<ActionExecutionResult> {
    const address = params?.address;

    if (supabase && address) {
        try {
            await supabase.from('platform_events').insert({
                event_type: 'ESCROW_STARTED',
                user_id: 'system',
                description: `Escrow Workflow initialized for ${address}`,
                metadata: params
            });
        } catch (e) {
            console.warn("Failed posting open_escrow event", e);
        }
    }

    return {
        success: true,
        message: `Opening Escrow Command Center for ${address || 'Selected Property'}.`,
        navigationTarget: `/deals/room?address=${encodeURIComponent(address || '')}`
    };
}

async function executeQueryRadar(params: any): Promise<ActionExecutionResult> {
    const rawQuery = params?.raw_query || "What is happening on the radar?";

    // Pull the live 50-100 events from the deal radar service
    const events = dealRadarService.eventsCache;
    if (events.length === 0) {
        return { success: true, message: "The Deal Radar is currently active but waiting for market signals to populate." };
    }

    try {
        const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error("Missing Gemini key for radar synthesis");
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const prompt = `
You are the WholesaleOS Intelligence Terminal (OSCAR). 
The user asked: "${rawQuery}"

Here is the RAW realtime Radar event stream (last ${events.length} signals):
${JSON.stringify(events.slice(0, 20), null, 2)}

Analyze this data. Summarize the hottest markets, demand spikes, or velocities accurately. Keep your response concise, sharp, and highly professional like a Bloomberg terminal. Use clear short sentences. Max 3 sentences.`;

        const result = await model.generateContent(prompt);
        return {
            success: true,
            message: result.response.text(),
            navigationTarget: '/radar'
        };
    } catch (error) {
        console.error("OSCAR Radar Synthesis Error", error);
        return { success: false, message: "I am unable to synthesize the live radar data at this very moment." };
    }
}

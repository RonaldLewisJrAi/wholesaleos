import { supabase } from '../../lib/supabase';

const API_BASE_URL = 'http://localhost:3001/api/ai';

const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
    };
};

/**
 * Radar Intelligence Market Insight Wrapper
 * Requests the backend BullMQ worker to analyze market events.
 */
export const requestRadarInsight = async (marketName, events) => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/radar-insight`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ market: marketName, recentEvents: events })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate market insight.');
        }

        return await response.json();
    } catch (error) {
        console.error("Radar Insight generation failed:", error);
        throw error;
    }
};

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
 * Deal Intelligence AI Wrapper
 * Sends Deal numbers to the backend Vertex engine and retrieves AI analysis.
 */
export const analyzeDealInsights = async (dealData) => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/analyze-deal`, {
            method: 'POST',
            headers,
            body: JSON.stringify(dealData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to analyze deal.');
        }

        return await response.json();
    } catch (error) {
        console.error("Deal Analysis Request Failed:", error);
        throw error;
    }
};

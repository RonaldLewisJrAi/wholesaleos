import { supabase } from '../../lib/supabase';

// Production Vercel relative path instead of localhost
const API_BASE_URL = '/api/ai';

const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
    };
};

/**
 * OSCAR Conversational API Wrapper
 * Submits questions and context to the Vercel backend Vertex engine.
 */
export const submitOscarQuery = async (message, contextContext = 'General Platform Help') => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/oscar`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ message, contextContext })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `OSCAR network failure: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("[OSCAR Service] Query Request Failed:", error);
        throw error; // Let the React component's specific try/catch handle the UI state
    }
};

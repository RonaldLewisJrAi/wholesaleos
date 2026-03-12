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
 * OSCAR Conversational API Wrapper
 * Submits questions and context to the backend Vertex engine.
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
            const errorData = await response.json();
            throw new Error(errorData.error || 'OSCAR network failure.');
        }

        return await response.json();
    } catch (error) {
        console.error("OSCAR Query Failed:", error);
        throw error;
    }
};

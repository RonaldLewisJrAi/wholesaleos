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
 * Document Intelligence Extraction API Wrapper
 * Submits raw OCR text to the backend for Vertex structuring.
 */
export const extractDocumentData = async (rawText, documentType) => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/extract-document`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ documentText: rawText, documentType })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Document extraction failed due to quota or engine error.');
        }

        return await response.json();
    } catch (error) {
        console.error("Document AI Extraction Error:", error);
        throw error;
    }
};

// src/services/propertyImportService.js

/**
 * Service to orchestrate the Universal Property Importer Engine execution.
 * Submits target URLs natively to backend Edge/Serverless functions.
 */

const getApiBaseUrl = () => {
    return import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
};

export const propertyImportService = {
    /**
     * Executes the Zillow ingestion pipeline over the backend proxy to evade WAF locking.
     * @param {string} url - The Zillow homedetails URL.
     * @returns {Promise<{property: Object, images: string[], backgroundImport: boolean}>}
     */
    async importZillowProperty(url, token = '') {
        try {
            const baseUrl = getApiBaseUrl();
            const fetchPromise = fetch(`${baseUrl}/api/properties/import-zillow`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({ url })
            });

            // Vercel Serverless hard timeout cap (10s) 
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Zillow Importer timed out unexpectedly.")), 15000)
            );

            const scrapeRes = await Promise.race([fetchPromise, timeoutPromise]);

            if (!scrapeRes.ok) {
                const errorData = await scrapeRes.json();
                throw new Error(errorData?.error || "Importer rejected the payload.");
            }

            const payload = await scrapeRes.json();
            return payload; // { property, images, backgroundImport }

        } catch (error) {
            console.error('[propertyImportService] Pipeline Failure:', error);
            throw error;
        }
    }
};

export default propertyImportService;

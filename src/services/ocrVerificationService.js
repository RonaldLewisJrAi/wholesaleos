import { GoogleGenerativeAI } from '@google/generative-ai';
import { ENV } from '../config/env';

const apiKey = ENV.GEMINI_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const ocrVerificationService = {
    /**
     * Examines a file blob using Gemini 1.5 Flash Vision capabilities to determine
     * if it contains standard real estate contract terminology.
     * @param {File} file 
     * @returns {Promise<{isValid: boolean, reason: string}>}
     */
    async verifyContractDocument(file) {
        if (!genAI) {
            console.warn("⚠️ Gemini API Key missing. Skipping OCR Pre-Verification.");
            return { isValid: true, reason: 'Skipped - No API Key' };
        }

        // Only process supported MIME types
        const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            // We pass unsupported types through to manual PENDING review, just in case
            return { isValid: true, reason: 'Unsupported MIME type - forwarding to manual review' };
        }

        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

            const fileData = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const b64 = reader.result.toString().split(',')[1];
                    resolve({
                        inlineData: {
                            data: b64,
                            mimeType: file.type
                        }
                    });
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const prompt = `Analyze this document. It is supposed to be a real estate Proof of Control document (e.g. Purchase Agreement, Option Contract, Assignment Agreement).
Check if it contains standard legal terms related to real estate transactions such as:
- "Purchase Agreement"
- "Seller"
- "Buyer"
- "Property Address"
- "Grantee"
- "Escrow"

If the document looks like a completely unrelated image (like a pizza menu, selfie, or random screenshot), or lacks standard contract structure, reject it.

Respond ONLY with a valid JSON object in this format: 
{"isValid": boolean, "reason": "Short explanation"}
Do not include markdown tags like \`\`\`json.`;

            const result = await model.generateContent([prompt, fileData]);
            const textResponse = result.response.text();

            const cleanText = textResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanText);

            return {
                isValid: !!parsed.isValid,
                reason: parsed.reason || 'Processed'
            };
        } catch (e) {
            console.error("OCR Verification failed (fallback to manual admin review):", e);
            // On API failure, default to True so it falls back to 'PENDING' manual admin queue
            return { isValid: true, reason: 'OCR Request limits or failure - forwarding to manual review' };
        }
    }
};

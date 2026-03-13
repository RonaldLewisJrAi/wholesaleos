import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseForeclosureData } from './foreclosureParser';

/**
 * Passes a document buffer to Gemini 1.5 Pro to extract raw text,
 * then hands it off to the foreclosureParser to structure the data.
 */
export async function processDocumentWithGemini(document: any) {
    console.log(`[OCR Processor] Analyzing document: ${document.filename}`);
    fetch('/api/telemetry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ channel: 'radar', level: 'info', message: 'Analyzing foreclosure document', metadata: { filename: document.filename, isMock: document.isMock } }) }).catch(() => { });

    // If mock, bypass the API call to save tokens during dev
    if (document.isMock) {
        return parseForeclosureData(document.buffer.toString('utf-8'));
    }

    try {
        const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error("Missing Gemini API Key");

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const prompt = `
            You are a real estate legal document scanner.
            Extract all text from the following document precisely as written.
        `;

        // In a real environment, we would convert PDF to images, or pass mime parts
        // For this prototype, we assume it's capable of text reading if it's text.
        const result = await model.generateContent([prompt, document.buffer.toString()]);
        const extractedText = result.response.text();

        return parseForeclosureData(extractedText);

    } catch (error: any) {
        console.error("[OCR Processor] Failed to process document via Gemini:", error);
        fetch('/api/telemetry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ channel: 'radar', level: 'error', message: 'Failed to process document via Gemini', metadata: { filename: document.filename, error: error.message } }) }).catch(() => { });
        return null;
    }
}

import { ENV } from './env';

/**
 * Feature Flag & Capability Toggles
 * Determines system functionality dynamically based on available configuration.
 * Used by the UI layers to gracefully degrade functionality if services are missing.
 */
export const FEATURES = {
    // Rendering & Components
    radarMap: !!ENV.MAPBOX_TOKEN,

    // Intelligence Layers
    aiAssistant: true, // Assuming Vertex serverless handles AI via session
    geminiVision: !!ENV.GEMINI_KEY, // Direct frontend SDK calls (e.g. OCR)

    // Automations
    radarEngine: true, // Internal DB scan loop
    skipTrace: true    // Simulated external endpoint
};

// MOCK DEPENDENCIES FOR PROTOTYPE / BROWSER COMPATIBILITY
// In a full node environment, this would import playwright.
// import { chromium } from 'playwright';

/**
 * Scans the provided source URL and downloads target documents.
 * Returns an array of file buffers or mock strings for the OCR step.
 */
export async function scanAndCollectDocuments(source: any): Promise<any[]> {
    console.log(`[SourceScanner] Navigating to ${source.url} (Mocking browser execution)`);

    // Safety delay constraint per specifications (2-10 seconds)
    const delay = Math.floor(Math.random() * (10000 - 2000 + 1) + 2000);
    await new Promise(resolve => setTimeout(resolve, delay));

    // For the prototype phase, we simulate extracting a document
    console.log(`[SourceScanner] Detected 1 notice document at ${source.url}`);

    const mockExtractedText = `
        NOTICE OF SUBSTITUTE TRUSTEE'S SALE
        Case No: 2026-CV-00124
        Parcel ID: 082-04-0-128.00
        Property Address: 1427 Maple Street, Springfield
        County: Davidson
        Auction Date: 2026-06-14
        Trustee: Default Services LLC
        Default Amount: $142,500
    `;

    return [
        {
            filename: `dealNotice_${new Date().toISOString().split('T')[0]}_caseMock.txt`,
            buffer: Buffer.from(mockExtractedText, 'utf-8'),
            isMock: true
        }
    ];
}

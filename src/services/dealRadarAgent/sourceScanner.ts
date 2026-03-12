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

    const mockDocuments = [
        {
            filename: `dealNotice_${new Date().toISOString().split('T')[0]}_caseMock1.txt`,
            buffer: Buffer.from(`
                NOTICE OF SUBSTITUTE TRUSTEE'S SALE
                Case No: 2026-CV-00124
                Parcel ID: 082-04-0-128.00
                Property Address: 1427 Maple Street, Springfield
                County: Davidson
                Auction Date: 2026-06-14
                Trustee: Default Services LLC
                Default Amount: $142,500
            `, 'utf-8'),
            isMock: true
        },
        {
            filename: `dealNotice_${new Date().toISOString().split('T')[0]}_caseMock2.txt`,
            buffer: Buffer.from(`
                NOTICE OF DEFAULT AND ELECTION TO SELL
                Case No: 2026-CV-00841
                Parcel ID: 110-02-B-042.00
                Property Address: 8900 Oak Avenue, Rivertown
                County: Davidson
                Auction Date: 2026-07-02
                Trustee: Regional Default Firm
                Default Amount: $280,000
            `, 'utf-8'),
            isMock: true
        },
        {
            filename: `dealNotice_${new Date().toISOString().split('T')[0]}_caseMock3.txt`,
            buffer: Buffer.from(`
                FORECLOSURE AUCTION SCHEDULED
                Case No: 2026-CV-00999
                Parcel ID: 045-12-C-888.00
                Property Address: 55 Pine Lane, Lakeside
                County: Davidson
                Auction Date: 2026-07-20
                Trustee: State Trustee Services
                Default Amount: $95,000
            `, 'utf-8'),
            isMock: true
        }
    ];

    console.log(`[SourceScanner] Detected ${mockDocuments.length} notice documents at ${source.url}`);
    return mockDocuments;
}

/**
 * Parses raw OCR text into the structured Foreclosure Lead schema.
 */
export function parseForeclosureData(rawText: string) {
    console.log(`[Foreclosure Parser] Extracting structured fields from text...`);

    // Default structure matching our Supabase schema
    const data = {
        parcel_id: '',
        address: '',
        county: '',
        city: '',
        case_number: '',
        auction_date: '',
        notice_type: 'Unknown',
        source_doc: 'Discovered via Scan'
    };

    // Use RegEx to parse specific keywords
    const parcelMatch = rawText.match(/(?:Parcel ID|APN|Tax ID)[\s:]*([a-zA-Z0-9-\.]+)/i);
    if (parcelMatch) data.parcel_id = parcelMatch[1].trim();

    const addressMatch = rawText.match(/(?:Property Address)[\s:]*([^,\n]+)/i);
    if (addressMatch) data.address = addressMatch[1].trim();

    const countyMatch = rawText.match(/(?:County)[\s:]*([A-Za-z\s]+)/i);
    if (countyMatch) data.county = countyMatch[1].trim();

    const caseMatch = rawText.match(/(?:Case No|Case Number|File Number)[\s:]*([A-Za-z0-9-]+)/i);
    if (caseMatch) data.case_number = caseMatch[1].trim();

    const dateMatch = rawText.match(/(?:Auction Date|Sale Date)[\s:]*([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4})/i);
    if (dateMatch) {
        // Naive standardization to YYYY-MM-DD
        data.auction_date = new Date(dateMatch[1]).toISOString().split('T')[0];
    } else {
        // Fallback default for prototype
        data.auction_date = new Date().toISOString().split('T')[0];
    }

    if (rawText.toLowerCase().includes('substitute trustee')) {
        data.notice_type = 'Substitute Trustee Sale';
    } else if (rawText.toLowerCase().includes('notice of default')) {
        data.notice_type = 'Notice of Default';
    } else if (rawText.toLowerCase().includes('tax delinquency')) {
        data.notice_type = 'Tax Delinquency';
    }

    if (!data.parcel_id) {
        // Fallback generator for missing IDs to prevent Supabase constraint errors
        data.parcel_id = `UNK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }

    return data;
}

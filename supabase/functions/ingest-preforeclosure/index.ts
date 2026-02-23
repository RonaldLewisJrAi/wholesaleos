// Follow this setup guide to integrate the Edge Function into the Supabase project
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Parse the incoming JSON payload from the Python Playwright Scraper
        const leads = await req.json();

        if (!Array.isArray(leads) || leads.length === 0) {
            return new Response(JSON.stringify({ error: "Invalid payload format. Expected an array of leads." }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        // Initialize the Supabase Client
        // Ensure you have SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set as Edge Function Secrets
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        const processedContacts = [];

        for (const lead of leads) {
            // Transform the OCR Extracted Data into Wholesale OS CRM Contact Format

            // 1. We identify the lead type (Preforeclosure indicator)
            const typeString = `Lead (Preforeclosure - ${lead.county || 'Unknown'} Co)`;

            // 2. We extract the city from the legal description (basic heuristic for TN)
            let city = "Unknown";
            if (lead.legal_description) {
                const parts = lead.legal_description.split(',');
                if (parts.length > 0) {
                    city = parts[parts.length - 1].trim(); // Usually the last item in localized TN descriptions is the City.
                }
            }

            const crmContact = {
                // UPSERT Match Vector: Name AND Location to avoid duplication
                name: lead.borrower_name,
                location: `${city}, TN`,

                // Wholesale OS specific tagging
                type: typeString,
                tags: ['Preforeclosure', lead.instrument_type, 'Court Records'],

                // Missing data defaults
                email: 'Skip Trace Required',
                phone: 'Skip Trace Required',
                tier: 'Pending',

                // Pipeline Intelligence Mapping
                arv: lead.original_loan_amount * 1.5, // Rough placeholder ARV assumption based on loan
                mortgage_balance: lead.original_loan_amount,
                distress_score: 95, // Max distress automatically
                motivation_level: 5,
                timeline_to_sell: '0-30 days', // Foreclosure auctions move fast
                last_contact_date: new Date().toISOString().split('T')[0]
            };

            // Upsert Logic (On Conflict) - Assuming 'name' and 'location' combination is unique or we just append for now
            const { data, error } = await supabase
                .from('crm_contacts')
                .insert([crmContact])
                // Note: To truly UPSERT, you would need a unique constraint on crm_contacts. 
                // Using .insert() for safe staging testing.
                .select();

            if (error) {
                console.error(`Error inserting lead ${lead.borrower_name}:`, error);
                throw error;
            }

            if (data) processedContacts.push(data[0]);
        }

        return new Response(JSON.stringify({
            success: true,
            message: `Successfully ingested ${processedContacts.length} preforeclosure leads from Rutherford County.`,
            data: processedContacts
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error("Webhook processing error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});

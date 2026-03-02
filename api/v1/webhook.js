import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { organization_id, source, lead_data, api_key } = req.body;

        // 1. Basic Validation
        if (!organization_id || !lead_data || !api_key) {
            return res.status(400).json({ error: 'Missing required payload parameters: organization_id, api_key, lead_data' });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 2. Validate API Key and Organization
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('id, account_status')
            .eq('id', organization_id)
            .single();

        if (orgError || !org) {
            return res.status(401).json({ error: 'Invalid Organization ID' });
        }

        // TODO: In a production environment, validate the `api_key` against a stored hashed key for the organization.
        if (org.account_status !== 'active') {
            return res.status(403).json({ error: 'Organization account is not active.' });
        }

        // 3. Structure Lead Payload for DB Insertion
        const insertPayload = {
            organization_id: org.id,
            first_name: lead_data.first_name || 'Unknown',
            last_name: lead_data.last_name || 'Lead',
            phone: lead_data.phone || null,
            email: lead_data.email || null,
            property_address: lead_data.property_address || null,
            status: 'New',
            source: source || 'API Webhook',
            arv: lead_data.arv || 0,
            estimated_repairs: lead_data.estimated_repairs || 0
        };

        // 4. Insert Lead (Database triggers will handle MAO calculation and auto-assignment)
        const { data: insertedLead, error: insertError } = await supabase
            .from('leads')
            .insert([insertPayload])
            .select()
            .single();

        if (insertError) {
            console.error("Webhook Insert Error:", insertError);
            return res.status(500).json({ error: 'Failed to insert lead into database', details: insertError.message });
        }

        // 5. Return success with the calculated data (which triggers populate upon returning)
        return res.status(201).json({
            message: 'Lead successfully ingested',
            lead_id: insertedLead.id,
            status: insertedLead.status,
            calculated_mao: insertedLead.mao,
            assigned_to: insertedLead.assigned_to
        });

    } catch (err) {
        console.error('Webhook processing error:', err);
        return res.status(500).json({ error: 'Internal Server Error processing webhook' });
    }
}

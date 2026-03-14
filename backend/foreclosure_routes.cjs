const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
// GET /api/dealRadar/foreclosure-leads
router.get('/', async (req, res) => {
    try {
        const { county, minScore, sortBy, sortOrder } = req.query;

        let query = supabase.from('foreclosure_signals').select('*');

        if (county) {
            query = query.eq('county', county);
        }

        if (minScore) {
            query = query.gte('deal_score', parseInt(minScore));
        }

        const sortColumn = sortBy || 'created_at';
        const ascending = sortOrder === 'asc';
        query = query.order(sortColumn, { ascending });

        const { data, error } = await query;

        if (error) throw error;

        return res.status(200).json({ success: true, data });

    } catch (error) {
        console.error('Error fetching foreclosure leads:', error);
        return res.status(500).json({ success: false, error: 'Database query failed' });
    }
});

// POST /api/dealRadar/foreclosure-leads
router.post('/', async (req, res) => {
    try {
        const leadData = req.body;

        if (!leadData || !leadData.parcel_id) {
            return res.status(400).json({ success: false, error: 'Missing required parcel_id' });
        }

        // Upsert based on parcel_id to prevent duplicates
        const { data, error } = await supabase
            .from('foreclosure_signals')
            .upsert([leadData], { onConflict: 'parcel_id' })
            .select();

        if (error) throw error;

        return res.status(201).json({ success: true, data: data[0] });

    } catch (error) {
        console.error('Error inserting foreclosure lead:', error);
        return res.status(500).json({ success: false, error: 'Database insertion failed' });
    }
});

module.exports = router;

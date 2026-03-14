import { createClient } from "@supabase/supabase-js";
import { Queue } from "bullmq";
import crypto from "crypto";

const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const zillowImageQueue = new Queue("zillow-image-ingestion", {
    connection: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
        password: process.env.REDIS_PASSWORD
    }
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Zillow URL required.' });

    if (!url.includes('zillow.com/homedetails')) {
        return res.status(400).json({ error: 'Invalid Zillow URL. Please provide a valid homedetails link.' });
    }

    const zpidMatch = url.match(/(\d+)_zpid/);
    const zpid = zpidMatch ? zpidMatch[1] : null;

    if (!zpid) {
        return res.status(400).json({ error: 'Invalid Zillow URL. Could not extract ZPID.' });
    }

    try {
        console.log(`[Zillow API] Fetching structured HTML for ZPID: ${zpid}`);

        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept": "text/html,application/xhtml+xml",
                "Connection": "keep-alive"
            }
        });

        const html = await response.text();

        // 6. Protect Against Zillow Page Changes (Anti-Bot Detection)
        if (!html.includes("__NEXT_DATA__")) {
            throw new Error("Zillow anti-bot page detected. __NEXT_DATA__ missing.");
        }

        const jsonMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
        if (!jsonMatch) {
            throw new Error("Could not extract JSON from __NEXT_DATA__ block.");
        }

        const nextData = JSON.parse(jsonMatch[1]);
        const pageProps = nextData?.props?.pageProps;
        let propertyData = null;

        // 1. JSON Fallback Paths
        if (pageProps?.componentProps?.gdpClientCache) {
            const cache = pageProps.componentProps.gdpClientCache;
            const propertyKey = Object.keys(cache).find(key => key.includes('PropertyState'));
            if (propertyKey) propertyData = cache[propertyKey].property;
        }

        if (!propertyData) {
            propertyData = pageProps?.property || pageProps?.listing;
        }

        if (!propertyData) {
            throw new Error("Could not route to valid property data object in JSON.");
        }

        // 3. Deduplicate Images 
        const rawPhotos = propertyData.hugePhotos || propertyData.photos || propertyData.media?.photos || [];
        const mappedUrls = rawPhotos.map(p => p.url).filter(Boolean);
        const uniqueImages = [...new Set(mappedUrls)];

        // 4. Prevent Worker Image Flooding
        const MAX_IMAGES = 25;
        const photos = uniqueImages.slice(0, MAX_IMAGES);
        const immediatePhotos = photos.slice(0, 5);
        const backgroundPhotos = photos.slice(5);

        const extracted = {
            id: crypto.randomUUID(), // Temporary ID for frontend mock parsing, replaced by DB later
            address: propertyData.address ? `${propertyData.address.streetAddress}, ${propertyData.address.city}, ${propertyData.address.state} ${propertyData.address.zipcode}` : 'Unknown Address',
            arv: propertyData.price ? `$${propertyData.price.toLocaleString()}` : 'Pending',
            beds: propertyData.bedrooms || null,
            baths: propertyData.bathrooms || null,
            sqft: propertyData.livingArea || null,
            description: propertyData.description || '',
            zpid: zpid,
            source: 'zillow',
            source_url: url
        };

        // 5. Download and Upload Initial 5 Images
        const uploadedImmediateImages = [];

        await Promise.all(immediatePhotos.map(async (imgUrl, index) => {
            try {
                const imgRes = await fetch(imgUrl);
                if (!imgRes.ok) return;
                const buffer = await imgRes.arrayBuffer();
                const fileName = `${zpid}/image-${index}.jpg`; // Folder-based storage path

                const { error: storageError } = await supabaseAdmin.storage
                    .from("property-images")
                    .upload(fileName, buffer, { contentType: "image/jpeg", upsert: true });

                if (!storageError) {
                    const { data: publicData } = supabaseAdmin.storage
                        .from("property-images")
                        .getPublicUrl(fileName);
                    uploadedImmediateImages.push({ url: publicData.publicUrl, index });
                }
            } catch (e) {
                console.warn("Immediate image upload failed:", e.message);
            }
        }));

        extracted.image = uploadedImmediateImages.length > 0 ? uploadedImmediateImages[0].url : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';

        // Storing basic property metadata immediately avoids orphan images
        const { data: dbProperty, error: dbError } = await supabaseAdmin
            .from('properties')
            .insert([{
                address: extracted.address.split(',')[0],
                city: propertyData.address?.city,
                state: propertyData.address?.state,
                zip: propertyData.address?.zipcode,
                status: 'Lead',
                source: 'zillow',
                source_url: url,
                zpid: zpid,
                beds: extracted.beds,
                baths: extracted.baths,
                sqft: extracted.sqft,
                description: extracted.description,
                import_status: backgroundPhotos.length > 0 ? 'processing' : 'complete'
            }])
            .select('*')
            .single();

        let propertyId = extracted.id;

        if (!dbError && dbProperty) {
            propertyId = dbProperty.id;
            extracted.id = propertyId;

            // Insert the first 5 images into database
            if (uploadedImmediateImages.length > 0) {
                await supabaseAdmin.from('property_images').insert(
                    uploadedImmediateImages.map(img => ({
                        property_id: propertyId,
                        image_url: img.url,
                        order_index: img.index
                    }))
                );
            }
        } else {
            console.error("[Zillow API] Database Insertion Failed:", dbError);
        }

        // Fire background worker for remaining images
        if (backgroundPhotos.length > 0 && propertyId) {
            await zillowImageQueue.add('download-images', {
                propertyId: propertyId,
                zpid: zpid,
                imageUrls: backgroundPhotos,
                startIndex: immediatePhotos.length
            });
        }

        // 7. Structured API Response
        return res.status(200).json({
            property: extracted,
            images: uploadedImmediateImages.map(i => i.url),
            backgroundImport: backgroundPhotos.length > 0
        });

    } catch (error) {
        console.error('[Zillow API] High-fidelity extraction failed:', error.message);
        return res.status(500).json({ error: error.message || 'Failed to extract real Zillow metrics.' });
    }
}

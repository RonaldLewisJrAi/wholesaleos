import { Worker } from "bullmq";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseAdmin = createClient(
    (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL) as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export const zillowImageWorker = new Worker(
    "zillow-image-ingestion",
    async (job) => {
        const { propertyId, zpid, imageUrls, startIndex = 5 } = job.data;
        console.log(`[ZillowImageWorker] Processing ${imageUrls.length} background images for ZPID: ${zpid}`);

        for (let i = 0; i < imageUrls.length; i++) {
            const index = startIndex + i;
            const url = imageUrls[i];
            const fileName = `${zpid}/image-${index}.jpg`;

            try {
                // 1. Download Buffer
                const res = await fetch(url);
                if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
                const buffer = await res.arrayBuffer();

                // 2. Upload to Supabase Storage
                const { error: storageError } = await supabaseAdmin.storage
                    .from("property-images")
                    .upload(fileName, buffer, {
                        contentType: "image/jpeg",
                        upsert: true
                    });

                if (storageError) throw storageError;

                const { data: publicData } = supabaseAdmin.storage
                    .from("property-images")
                    .getPublicUrl(fileName);

                // 3. Insert Database Record
                const { error: dbError } = await supabaseAdmin
                    .from("property_images")
                    .insert({
                        property_id: propertyId,
                        image_url: publicData.publicUrl,
                        order_index: index
                    });

                if (dbError) throw dbError;

                console.log(`[ZillowImageWorker] Success -> ${fileName}`);

                // Throttle slightly to prevent anti-bot IP blocks from Zillow CDN
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                console.error(`[ZillowImageWorker] Failed to process image ${index} for ${zpid}:`, errorMessage);
            }
        }

        // 4. Mark Import as Complete in Database
        if (propertyId) {
            const { error: completeErr } = await supabaseAdmin
                .from("properties")
                .update({ import_status: "complete" })
                .eq("id", propertyId);

            if (completeErr) {
                console.error(`[ZillowImageWorker] Failed to mark property ${propertyId} as complete:`, completeErr.message);
            } else {
                console.log(`[ZillowImageWorker] Marked import_status 'complete' for ZPID: ${zpid}`);
            }
        }
    },
    {
        connection: {
            host: process.env.REDIS_HOST || "localhost",
            port: parseInt(process.env.REDIS_PORT || "6379"),
            password: process.env.REDIS_PASSWORD
        },
        concurrency: 2 // Keep concurrency low to prevent hammering Zillow's CDN
    }
);

zillowImageWorker.on("completed", (job) => {
    console.log(`[ZillowImageWorker] Completed background ingestion for ZPID: ${job.data?.zpid}`);
});

zillowImageWorker.on("failed", (job, err: any) => {
    console.error(`[ZillowImageWorker] Critical failure on job ${job?.id}: ${err?.message || err}`);
});

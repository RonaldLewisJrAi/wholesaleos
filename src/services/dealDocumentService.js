import { supabase } from '../lib/supabase';
import { ocrVerificationService } from './ocrVerificationService';

/**
 * Deal Document Verification Service (Phase 17)
 */
export const dealDocumentService = {
    /**
     * Uploads a file to Supabase Storage and creates a record in `deal_documents`
     * @param {string} dealId - The parent deal ID
     * @param {string} userId - The active uploading wholesaler ID
     * @param {File} file - The physical JS File object
     * @param {string} documentType - 'PURCHASE_AGREEMENT', 'OPTION_CONTRACT', etc
     */
    async uploadDealDocument(dealId, userId, file, documentType = 'PURCHASE_AGREEMENT') {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${dealId}/${crypto.randomUUID()}.${fileExt}`;
            const filePath = `${fileName}`;

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('deal-documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('deal-documents')
                .getPublicUrl(filePath);

            // 1.5. OCR Pre-Verification
            let calculatedStatus = 'PENDING';

            console.log("🔍 Scanning document with Gemini OCR Vision Engine...");
            const ocrResult = await ocrVerificationService.verifyContractDocument(file);

            if (!ocrResult.isValid) {
                console.warn("🛑 OCR Pre-Verification Rejected Document:", ocrResult.reason);
                calculatedStatus = 'REJECTED';
            } else {
                console.log("✅ OCR Pre-Verification Cleared. Sending to Admin Queue.");
            }

            // 2. Insert into Database
            const { data: docRecord, error: dbError } = await supabase
                .from('deal_documents')
                .insert({
                    deal_id: dealId,
                    document_type: documentType,
                    file_url: publicUrl,
                    uploaded_by: userId,
                    status: calculatedStatus,
                    verified_by: calculatedStatus === 'REJECTED' ? 'SYSTEM_OCR' : null
                })
                .select()
                .single();

            if (dbError) throw dbError;

            // 3. Log Upload Event
            await supabase.from('platform_events').insert({
                event_type: 'PROOF_OF_CONTROL_UPLOADED',
                user_id: userId,
                deal_id: dealId,
                event_data: {
                    document_type: documentType,
                    document_id: docRecord.id,
                    ocr_status: calculatedStatus,
                    ocr_reason: !ocrResult.isValid ? ocrResult.reason : null
                }
            });

            return { success: true, document: docRecord };
        } catch (error) {
            console.error('Error uploading deal document:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Fetches all registered documents for a specific deal.
     */
    async getDealDocuments(dealId) {
        try {
            const { data, error } = await supabase
                .from('deal_documents')
                .select(`
                    id, 
                    document_type, 
                    file_url, 
                    status, 
                    created_at,
                    uploaded_by,
                    verified_by
                `)
                .eq('deal_id', dealId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, documents: data || [] };
        } catch (error) {
            console.error('Error fetching deal documents:', error);
            return { success: false, documents: [] };
        }
    },

    /**
     * Super Admin exclusively verifies a document, updating Trust Score via SQL triggers.
     */
    async verifyDealDocument(documentId, adminId, dealId, wholesalerId) {
        try {
            const { error } = await supabase
                .from('deal_documents')
                .update({ status: 'VERIFIED', verified_by: adminId })
                .eq('id', documentId);

            if (error) throw error;

            // Log Verification Event -> Triggers +5 Trust Score
            await supabase.from('platform_events').insert({
                event_type: 'PROOF_OF_CONTROL_VERIFIED',
                user_id: wholesalerId,
                deal_id: dealId,
                event_data: { document_id: documentId, verified_by: adminId }
            });

            return { success: true };
        } catch (error) {
            console.error('Error verifying document:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Super Admin rejects a document, penalizing Trust Score via SQL triggers.
     */
    async rejectDealDocument(documentId, adminId, dealId, wholesalerId) {
        try {
            const { error } = await supabase
                .from('deal_documents')
                .update({ status: 'REJECTED', verified_by: adminId })
                .eq('id', documentId);

            if (error) throw error;

            // Log Rejection Event -> Triggers -15 Trust Score
            await supabase.from('platform_events').insert({
                event_type: 'PROOF_OF_CONTROL_REJECTED',
                user_id: wholesalerId,
                deal_id: dealId,
                event_data: { document_id: documentId, rejected_by: adminId }
            });

            return { success: true };
        } catch (error) {
            console.error('Error rejecting document:', error);
            return { success: false, error: error.message };
        }
    }
};

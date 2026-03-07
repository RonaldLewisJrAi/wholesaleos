// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// ==============================================================================
// EDGE FUNCTION: PROCESS NOTIFICATIONS
// Description: Triggered asynchronously when a row is inserted into `notifications`.
// Orchestrates multi-channel delivery (Email via SendGrid, SMS via Twilio, etc)
// without blocking the main database thread.
// ==============================================================================

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload = await req.json();
    const notificationId = payload.notification_id;

    if (!notificationId) {
      return new Response(JSON.stringify({ error: "Missing notification_id" }), { status: 400 });
    }

    console.log(`[Notification Engine] Processing Dispatch for ID: ${notificationId}`);

    // 1. Fetch Notification Details
    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .select(`
                *,
                auth_users:user_id (email, raw_user_meta_data)
            `)
      .eq('id', notificationId)
      .single();

    if (notifError || !notification) {
      throw new Error(`Failed to locate notification record ${notificationId}`);
    }

    // 2. Routing Logic based on TYPE
    const eventType = notification.type;
    const targetEmail = notification.auth_users?.email;
    const targetPhone = notification.auth_users?.raw_user_meta_data?.phone; // Assumes phone is stored here or in profiles

    let dispatchLog = `Routed ${eventType} via: `;

    // ===============================================================
    // MOCK INTEGRATION BLOCK (SendGrid / Twilio place holders)
    // ===============================================================

    switch (eventType) {
      case 'NEW_DEAL_MATCH':
        // e.g. await sendSendGridEmail(targetEmail, "New Marketplace Deal Matches Your Buy Box!");
        // e.g. await sendTwilioSms(targetPhone, "A new deal hitting your expected ROI just landed in the Wholesale-OS Marketplace. Log in to check.");
        dispatchLog += 'EMAIL, SMS';
        break;
      case 'OFFER_RECEIVED':
        // e.g. await sendSendGridEmail(targetEmail, "You received a new offer on your property.");
        dispatchLog += 'EMAIL';
        break;
      case 'DEPOSIT_CONFIRMED':
        // e.g. await sendSendGridEmail(targetEmail, "Stripe Connect Confirmed your Earnest Money Deposit.");
        dispatchLog += 'EMAIL, IN-APP';
        break;
      case 'CLOSING_CONFIRMED':
        // e.g. await sendSendGridEmail(targetEmail, "Title has verified the closing of your recent deal! Your Trust Score increased.");
        dispatchLog += 'EMAIL, IN-APP';
        break;
      default:
        dispatchLog += 'IN-APP ONLY';
    }

    // ===============================================================

    console.log(`[Notification Engine] Success: ${dispatchLog} to User ${notification.user_id}`);

    return new Response(JSON.stringify({
      message: "Notification Dispatched.",
      log: dispatchLog
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });

  } catch (error) {
    console.error("Notification Engine Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
});

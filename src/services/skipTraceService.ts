import { supabase } from '../lib/supabase';

// Helper to interact with the protected backend skiptrace endpoint
export async function skipTraceOwner(propertyId: string, address: string, city: string, state: string, zip: string, ownerName?: string) {
    try {
        const { data: { session } } = await supabase!.auth.getSession();

        if (!session) {
            throw new Error('You must be logged in to skip trace.');
        }

        const response = await fetch('/api/skiptrace', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
                userId: session.user.id,
                propertyId,
                address,
                city,
                state,
                zip,
                ownerName
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Skip trace failed.');
        }

        return data;

    } catch (error: any) {
        console.error('Skip Trace Execution Error:', error);
        return { error: true, message: error.message || 'Skip trace failed due to a network or service error.' };
    }
}

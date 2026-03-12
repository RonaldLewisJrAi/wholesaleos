import { supabase } from '../lib/supabase';

export type RadarSignalType =
    | 'DEAL_POSTED'
    | 'PRIORITY_DEAL_BLAST'
    | 'INVESTOR_MATCH'
    | 'INVESTOR_ACTIVITY_SPIKE'
    | 'DEAL_RESERVED'
    | 'ESCROW_CONFIRMED'
    | 'VERIFIED_CLOSED';

export interface RadarEvent {
    id: string;
    event_type: RadarSignalType;
    user_id?: string;
    deal_id?: string;
    event_data: {
        city?: string;
        state?: string;
        assignment_fee?: number;
        [key: string]: any;
    };
    created_at: string;
}

export interface RadarSignal {
    id: string;
    type: RadarSignalType;
    lat: number;
    lng: number;
    city: string;
    state: string;
    timestamp: string;
    value?: number;
    meta?: any;
}

// Map major cities to approximate coordinates to visualize quickly. 
// A real production app would use a Geocoding API if true lat/lng wasn't stored.
const CITY_COORDS: Record<string, [number, number]> = {
    'Dallas': [32.7767, -96.7970],
    'Atlanta': [33.7490, -84.3880],
    'Phoenix': [33.4484, -112.0740],
    'Tampa': [27.9506, -82.4572],
    'Miami': [25.7617, -80.1918],
    'Houston': [29.7604, -95.3698],
    'Austin': [30.2672, -97.7431],
    'Orlando': [28.5383, -81.3792],
    'Nashville': [36.1627, -86.7816],
    'Charlotte': [35.2271, -80.8431],
    'Chicago': [41.8781, -87.6298],
    'Las Vegas': [36.1699, -115.1398]
};

// Fallback logic to pseudo-randomize a coordinate for unknown cities based on state
const STATE_COORDS: Record<string, [number, number]> = {
    'TX': [31.9686, -99.9018],
    'FL': [27.6648, -81.5158],
    'AZ': [34.0489, -111.0937],
    'GA': [32.1656, -82.9001],
    'TN': [35.5175, -86.5804]
};

export const dealRadarService = {
    // Array to hold running chronological events mapped nicely
    eventsCache: [] as RadarEvent[],
    listeners: [] as ((events: RadarEvent[]) => void)[],

    getCoordinates(city?: string, state?: string): [number, number] {
        if (city && CITY_COORDS[city]) return CITY_COORDS[city];
        if (state && STATE_COORDS[state]) {
            // Jitter around state center
            const [lat, lng] = STATE_COORDS[state];
            return [lat + (Math.random() - 0.5) * 2, lng + (Math.random() - 0.5) * 2];
        }
        // Default to somewhere central US
        return [39.8283 + (Math.random() - 0.5) * 10, -98.5795 + (Math.random() - 0.5) * 20];
    },

    async loadInitialEvents() {
        if (!supabase) return [];

        try {
            const { data, error } = await supabase
                .from('platform_events')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            this.eventsCache = data as RadarEvent[];
            this.notifyListeners();
            return this.eventsCache;
        } catch (e) {
            console.error('Failed to load initial radar events', e);
            return [];
        }
    },

    subscribeToRadar(callback: (events: RadarEvent[]) => void) {
        this.listeners.push(callback);

        // Initial load trigger
        if (this.eventsCache.length === 0) {
            this.loadInitialEvents();
        } else {
            callback(this.eventsCache);
        }

        if (!supabase) return { unsubscribe: () => { } };

        // Subscribe to real-time insertions on platform_events
        const subscription = supabase.channel('radar-stream')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'platform_events' }, (payload) => {
                const newEvent = payload.new as RadarEvent;
                this.eventsCache = [newEvent, ...this.eventsCache].slice(0, 100); // Keep last 100
                this.notifyListeners();
            })
            .subscribe();

        return {
            unsubscribe: () => {
                this.listeners = this.listeners.filter(cb => cb !== callback);
                if (this.listeners.length === 0) {
                    supabase.removeChannel(subscription);
                }
            }
        };
    },

    notifyListeners() {
        this.listeners.forEach(cb => cb(this.eventsCache));
    },

    computeRadarSignals(events: RadarEvent[]): RadarSignal[] {
        return events.map(ev => {
            const city = ev.event_data?.city || 'Unknown';
            const state = ev.event_data?.state || 'US';
            const [lat, lng] = this.getCoordinates(city, state);

            return {
                id: ev.id,
                type: ev.event_type,
                lat,
                lng,
                city,
                state,
                timestamp: ev.created_at,
                value: ev.event_data?.assignment_fee,
                meta: ev.event_data
            };
        });
    },

    async pushDemoEvent(type: RadarSignalType, city: string, state: string, details: any = {}) {
        if (!supabase) return;
        const payload = {
            event_type: type,
            event_data: { city, state, ...details }
        };
        await supabase.from('platform_events').insert([payload]);
    }
};

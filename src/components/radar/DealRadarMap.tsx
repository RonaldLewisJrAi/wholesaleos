import React, { useEffect, useState, useMemo } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { dealRadarService, RadarSignal, RadarSignalType } from '../../services/dealRadarService';
import { Activity, Map as MapIcon, Maximize2, X, Zap, Target, DollarSign, Clock, CheckCircle, TrendingUp } from 'lucide-react';

const MAPBOX_TOKEN = (import.meta as any).env.VITE_MAPBOX_TOKEN;

const SignalNode = ({ type, onClick }: { type: RadarSignalType, onClick: () => void }) => {
    // Determine cluster color semantics
    let colorClass = 'bg-blue-500 shadow-blue-500/50';
    let ringClass = 'border-blue-400';

    switch (type) {
        case 'VERIFIED_CLOSED':
            colorClass = 'bg-emerald-500 shadow-emerald-500/50';
            ringClass = 'border-emerald-400';
            break;
        case 'PRIORITY_DEAL_BLAST':
            colorClass = 'bg-amber-500 shadow-amber-500/50';
            ringClass = 'border-amber-400';
            break;
        case 'INVESTOR_ACTIVITY_SPIKE':
            colorClass = 'bg-purple-500 shadow-purple-500/50';
            ringClass = 'border-purple-400';
            break;
        case 'DEAL_RESERVED':
            colorClass = 'bg-indigo-500 shadow-indigo-500/50';
            ringClass = 'border-indigo-400';
            break;
    }

    return (
        <div
            className="relative flex items-center justify-center cursor-pointer group w-[40px] h-[40px]"
            onClick={onClick}
        >
            <div className={`absolute w-full h-full rounded-full ${colorClass} opacity-20 animate-ping`} />
            <div className={`w-4 h-4 rounded-full ${colorClass} border-2 ${ringClass} shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-transform group-hover:scale-150 relative z-10`} />
        </div>
    );
};

export const DealRadarMap = () => {
    const [signals, setSignals] = useState<RadarSignal[]>([]);
    const [viewState, setViewState] = useState({
        longitude: -98.5795,
        latitude: 39.8283,
        zoom: 3.5,
        pitch: 45,
        bearing: 0
    });
    const [selectedSignal, setSelectedSignal] = useState<RadarSignal | null>(null);

    useEffect(() => {
        const sub = dealRadarService.subscribeToRadar((events) => {
            setSignals(dealRadarService.computeRadarSignals(events));
        });
        return () => sub.unsubscribe();
    }, []);

    // Memoize the map rendering to prevent deep React re-renders unless signals change heavily
    const mapMarkers = useMemo(() => signals.map(sig => (
        <Marker
            key={sig.id}
            longitude={sig.lng}
            latitude={sig.lat}
            anchor="center"
        >
            <SignalNode type={sig.type} onClick={() => setSelectedSignal(sig)} />
        </Marker>
    )), [signals]);

    if (!MAPBOX_TOKEN) {
        return (
            <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-[var(--bg-secondary)] border border-red-500/30 rounded-xl p-8 text-center animate-fade-in glass-panel">
                <div className="w-16 h-16 bg-red-500/10 text-red-400 flex items-center justify-center rounded-full mb-4 shrink-0 shadow-lg">
                    <MapIcon size={32} />
                </div>
                <h2 className="text-xl font-bold mb-2 text-white font-mono tracking-widest">MAPBOX CONFIGURATION REQUIRED</h2>
                <p className="max-w-md text-gray-400 mb-6 leading-relaxed">
                    The WholesaleOS Intelligence Terminal utilizes Mapbox GL JS for high-performance 60fps data visualizations.
                    <br /><br />
                    Please add your secure Token to the environment variables:
                    <code className="block mt-4 p-3 bg-[var(--bg-tertiary)] border border-red-500/20 text-red-300 rounded text-sm text-left font-mono">
                        VITE_MAPBOX_TOKEN=pk.your_token_here
                    </code>
                </p>
                <div className="flex gap-2 text-xs font-mono text-gray-500 uppercase tracking-widest">
                    <Activity size={14} className="text-emerald-500 animate-pulse" /> Telemetry signals are still recording in the background.
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full min-h-[600px] rounded-xl overflow-hidden glass-panel border border-blue-900/40 shadow-2xl">
            {/* Header Overlay */}
            <div className="absolute top-4 left-4 z-10 pointer-events-none fade-in">
                <div className="bg-[var(--bg-secondary)]/90 backdrop-blur-md px-4 py-2 rounded-lg border border-blue-500/30 flex items-center gap-3 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                    <div className="relative flex">
                        <Activity size={20} className="text-blue-500" />
                        <span className="absolute top-0 right-0 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                    </div>
                    <div>
                        <h2 className="font-bold font-mono tracking-widest text-sm text-white uppercase">Terminal Radar</h2>
                        <div className="text-[10px] text-gray-400 font-mono tracking-wide">{signals.length} Live Signals Tracking</div>
                    </div>
                </div>
            </div>

            <Map
                {...viewState}
                onMove={(evt: any) => setViewState(evt.viewState)}
                mapStyle="mapbox://styles/mapbox/dark-v11"
                mapboxAccessToken={MAPBOX_TOKEN}
                style={{ width: '100%', height: '100%' }}
            >
                <FullscreenControl position="top-right" />
                <NavigationControl position="top-right" showCompass={false} />

                {mapMarkers}

                {selectedSignal && (
                    <Popup
                        longitude={selectedSignal.lng}
                        latitude={selectedSignal.lat}
                        anchor="bottom"
                        onClose={() => setSelectedSignal(null)}
                        closeOnClick={false}
                        className="radar-popup"
                        maxWidth="300px"
                    >
                        <div className="bg-[var(--bg-secondary)] text-white p-4 rounded-lg border border-blue-500/50 shadow-2xl relative min-w-[200px]">
                            <button title="Close" onClick={() => setSelectedSignal(null)} className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors">
                                <X size={14} />
                            </button>

                            <div className="text-[10px] uppercase font-mono tracking-widest text-blue-400 border-b border-blue-900/50 pb-2 mb-3">
                                {selectedSignal.type.replace(/_/g, ' ')}
                            </div>

                            <div className="text-sm font-bold truncate mb-1">
                                {selectedSignal.city}, {selectedSignal.state}
                            </div>

                            <div className="text-xs text-gray-400 font-mono flex items-center gap-1 mb-3">
                                <Clock size={12} /> {new Date(selectedSignal.timestamp).toLocaleTimeString()}
                            </div>

                            {selectedSignal.value && (
                                <div className="mt-3 pt-3 border-t border-blue-900/30 flex items-center justify-between">
                                    <span className="text-xs text-gray-500 font-mono">Capital Escrow</span>
                                    <span className="text-emerald-400 font-bold font-mono flex items-center text-sm shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                        <DollarSign size={14} />{selectedSignal.value.toLocaleString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </Popup>
                )}
            </Map>
        </div>
    );
};

import React, { useState, useMemo, useEffect } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, Source, Layer, LayerProps } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Layers, MapPin, Zap, AlertTriangle, ShieldCheck, Target, Lock, Activity } from 'lucide-react';
import './IntelligenceMap.css';
import { useSubscription } from '../../contexts/useSubscription';

const MAPBOX_TOKEN = (import.meta as any).env.VITE_MAPBOX_TOKEN;

// Default USA View
const INITIAL_VIEW_STATE = {
    longitude: -98.5795,
    latitude: 39.8283,
    zoom: 3.5,
    pitch: 0,
    bearing: 0
};

// Heatmap Layer Configuration for Liquidity
const heatmapLayer: LayerProps = {
    id: 'liquidity-heat',
    type: 'heatmap',
    paint: {
        // Increase the heatmap weight based on the liquidityScore property
        'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'liquidityScore'],
            0, 0,
            100, 1
        ],
        // Increase the heatmap color weight weight by zoom level
        // heatmap-intensity is a multiplier on top of heatmap-weight
        'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 1,
            9, 3
        ],
        // Color ramp from transparent emerald to amber to solid red
        'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(16, 185, 129, 0)',      // Emerald transparent
            0.2, 'rgba(16, 185, 129, 0.3)',    // Emerald 
            0.4, 'rgba(59, 130, 246, 0.5)',    // Blue
            0.6, 'rgba(245, 158, 11, 0.7)',    // Amber
            0.8, 'rgba(239, 68, 68, 0.85)',    // Red
            1, 'rgba(220, 38, 38, 0.95)'       // Deep Red
        ],
        // Adjust the heatmap radius by zoom level
        'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 8,
            9, 35
        ],
        // Transition from heatmap to circle layer by zoom level
        'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            7, 0.7,
            12, 0.1
        ],
    }
};

type LayerConfig = {
    id: string;
    label: string;
    icon: React.ElementType;
    color: string;
    requiredTier: 'BASIC' | 'PRO' | 'SUPER';
};

const MAP_LAYERS: LayerConfig[] = [
    { id: 'showDeals', label: 'Active Deals', icon: MapPin, color: 'text-blue-500', requiredTier: 'BASIC' },
    { id: 'showForeclosures', label: 'Foreclosure Radar', icon: AlertTriangle, color: 'text-amber-500', requiredTier: 'BASIC' },
    { id: 'showLiquidity', label: 'Liquidity Heatmap', icon: Zap, color: 'text-rose-500', requiredTier: 'PRO' },
    { id: 'showDemand', label: 'Investor Demand', icon: Target, color: 'text-purple-500', requiredTier: 'SUPER' },
    { id: 'showClosings', label: 'Verified Closings', icon: ShieldCheck, color: 'text-emerald-500', requiredTier: 'SUPER' }
];

export const IntelligenceMap = ({ initialLayers = {} }) => {
    // 1. Context & State
    const { subscriptionTier, subscriptionStatus } = useSubscription();

    const currentTierIndex = () => {
        if (!subscriptionTier || subscriptionStatus === 'DEMO') return 0; // BASIC
        if (subscriptionTier === 'PRO') return 1;
        if (subscriptionTier === 'SUPER' || subscriptionTier === 'ENTERPRISE') return 2;
        return 0;
    };

    const isLayerUnlocked = (requiredTier: string) => {
        const reqIdx = requiredTier === 'BASIC' ? 0 : requiredTier === 'PRO' ? 1 : 2;
        return currentTierIndex() >= reqIdx;
    };

    const [activeLayers, setActiveLayers] = useState({
        showDeals: isLayerUnlocked('BASIC') ? (initialLayers.showDeals ?? true) : false,
        showForeclosures: isLayerUnlocked('BASIC') ? (initialLayers.showForeclosures ?? false) : false,
        showLiquidity: isLayerUnlocked('PRO') ? (initialLayers.showLiquidity ?? false) : false,
        showDemand: isLayerUnlocked('SUPER') ? (initialLayers.showDemand ?? false) : false,
        showClosings: isLayerUnlocked('SUPER') ? (initialLayers.showClosings ?? false) : false,
    });

    const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
    const [selectedFeature, setSelectedFeature] = useState<any>(null);

    // 2. Data Simulation (Until backend tables are fully wired for all 5 layers)
    const mockDeals = useMemo(() => [
        { id: 'd1', lat: 32.7767, lng: -96.7970, address: "Dallas TX Deals", amount: "$15,000", type: 'deal' },
        { id: 'd2', lat: 35.2271, lng: -80.8431, address: "Charlotte NC Deals", amount: "$22,000", type: 'deal' },
        { id: 'd3', lat: 33.7490, lng: -84.3880, address: "Atlanta GA Deals", amount: "$18,500", type: 'deal' },
        { id: 'd4', lat: 39.7392, lng: -104.9903, address: "Denver CO Deals", amount: "$35,000", type: 'deal' },
    ], []);

    const mockForeclosures = useMemo(() => [
        { id: 'f1', lat: 32.8567, lng: -96.8970, address: "144 Oak St, TX", type: 'foreclosure', auctionDate: 'Next Tuesday' },
        { id: 'f2', lat: 35.3271, lng: -80.9431, address: "899 Pine Ln, NC", type: 'foreclosure', auctionDate: 'In 14 Days' },
        { id: 'f3', lat: 29.7604, lng: -95.3698, address: "Houston Pre-foreclosure", type: 'foreclosure', auctionDate: 'TBD' },
    ], []);

    const mockDemand = useMemo(() => [
        { id: 'dm1', lat: 30.2672, lng: -97.7431, address: "Austin Investor Pool", type: 'demand', reqs: "SFR, Light Rehab" },
        { id: 'dm2', lat: 41.8781, lng: -87.6298, address: "Chicago Buyers", type: 'demand', reqs: "Multi-Family 2-4 Units" },
    ], []);

    const mockClosings = useMemo(() => [
        { id: 'c1', lat: 32.6767, lng: -96.6970, address: "Mesquite Closing", type: 'closing', date: "Yesterday", volume: 1 },
        { id: 'c2', lat: 36.1627, lng: -86.7816, address: "Nashville Closing", type: 'closing', date: "3 Days Ago", volume: 4 },
    ], []);

    // Liquidity GEOJSON format required by Mapbox Heatmap Layer
    const mockLiquidityGeoJSON = useMemo(() => {
        const features = [];
        // Generate random heat clusters across prime MSAs to simulate buyer activity
        const msas = [
            [-96.7970, 32.7767], // Dallas
            [-84.3880, 33.7490], // Atlanta
            [-80.8431, 35.2271], // Charlotte
            [-112.0740, 33.4484], // Phoenix
            [-81.3792, 28.5383], // Orlando
            [-86.7816, 36.1627]  // Nashville
        ];

        msas.forEach(msa => {
            // Drop 50-100 random points around the MSA with varying intensities
            const points = 50 + Math.floor(Math.random() * 50);
            for (let i = 0; i < points; i++) {
                // Random offset within ~30 miles
                const lng = msa[0] + (Math.random() - 0.5) * 0.8;
                const lat = msa[1] + (Math.random() - 0.5) * 0.8;
                const score = Math.floor(50 + Math.random() * 50); // 50-100 score

                features.push({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [lng, lat] },
                    properties: { liquidityScore: score }
                });
            }
        });

        return {
            type: 'FeatureCollection',
            features: features
        };
    }, []);

    // 3. Handlers
    const toggleLayer = (layerId: string, requiredTier: string) => {
        if (!isLayerUnlocked(requiredTier)) return; // Prevents UI hacking

        setActiveLayers(prev => ({
            ...prev,
            [layerId]: !prev[layerId]
        }));
    };

    if (!MAPBOX_TOKEN) {
        return (
            <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-[var(--bg-secondary)] border border-red-500/30 rounded-xl p-8 text-center glass-panel">
                <MapPin size={48} className="text-red-400 mb-4 opacity-50" />
                <h2 className="text-xl font-bold font-mono tracking-widest text-red-500">MAPBOX CONFIGURATION REQUIRED</h2>
                <p className="text-gray-400 mt-2 max-w-md">The Intelligence Map Layer requires a valid Mapbox token to render GIS Data.</p>
            </div>
        );
    }

    return (
        <div className="intelligence-map-container rounded-xl overflow-hidden glass-panel border border-blue-900/30 shadow-[0_0_30px_rgba(0,0,0,0.5)]">

            {/* Global Map Status Header */}
            <div className="absolute top-4 left-4 z-10 pointer-events-none drop-shadow-xl">
                <div className="glass-panel bg-[rgba(11,15,25,0.8)] backdrop-blur-md px-4 py-2 rounded-lg border border-blue-500/30 flex items-center gap-3">
                    <div className="relative flex">
                        <Activity size={20} className="text-blue-500" />
                        <span className="absolute top-0 right-0 w-2 h-2 bg-blue-400 rounded-full animate-ping" />
                    </div>
                    <div>
                        <h2 className="font-bold font-mono tracking-widest text-sm text-white uppercase">Intelligence Grid</h2>
                        <div className="text-[10px] text-gray-400 font-mono tracking-wide">Multi-Layer Synchronized</div>
                    </div>
                </div>
            </div>

            {/* Layer Control Panel */}
            <div className="map-layers-panel">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[rgba(255,255,255,0.1)]">
                    <Layers size={18} className="text-blue-400" />
                    <h3 className="font-bold text-sm tracking-wider uppercase font-mono text-white">Map Layers</h3>
                </div>

                <div className="space-y-1">
                    {MAP_LAYERS.map((layer) => {
                        const unlocked = isLayerUnlocked(layer.requiredTier);
                        const isActive = activeLayers[layer.id];

                        return (
                            <div
                                key={layer.id}
                                className={`layer-toggle-row ${!unlocked ? 'locked' : ''}`}
                                onClick={() => toggleLayer(layer.id, layer.requiredTier)}
                            >
                                <label htmlFor={layer.id} className="layer-label-group cursor-pointer">
                                    <layer.icon size={16} className={isActive ? layer.color : 'text-gray-500'} />
                                    <span className={isActive ? 'text-white' : 'text-gray-400'}>{layer.label}</span>
                                </label>

                                {unlocked ? (
                                    <input
                                        type="checkbox"
                                        id={layer.id}
                                        className="custom-checkbox"
                                        checked={isActive}
                                        title={layer.label}
                                        aria-label={layer.label}
                                        readOnly
                                    />
                                ) : (
                                    <div className="text-gray-500 hover:text-indigo-400 transition-colors" title={`Upgrade to ${layer.requiredTier} to unlock this telemetry layer.`}>
                                        <Lock size={14} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Core Map */}
            <Map
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                mapStyle="mapbox://styles/mapbox/dark-v11"
                mapboxAccessToken={MAPBOX_TOKEN}
                style={{ width: '100%', height: '100%' }}
                interactiveLayerIds={activeLayers.showLiquidity ? ['liquidity-heat'] : []}
            >
                <FullscreenControl position="bottom-right" />
                <NavigationControl position="top-right" showCompass={false} />

                {/* 1. Liquidity GeoJSON Heatmap Layer */}
                {activeLayers.showLiquidity && (
                    <Source type="geojson" data={mockLiquidityGeoJSON}>
                        <Layer {...heatmapLayer} />
                    </Source>
                )}

                {/* 2. Deals Marker Layer */}
                {activeLayers.showDeals && mockDeals.map(deal => (
                    <Marker key={deal.id} longitude={deal.lng} latitude={deal.lat} anchor="center" style={{ zIndex: 10 }}>
                        <div
                            className="marker-core marker-deal"
                            onClick={(e) => { e.stopPropagation(); setSelectedFeature(deal); }}
                        />
                    </Marker>
                ))}

                {/* 3. Foreclosures Marker Layer */}
                {activeLayers.showForeclosures && mockForeclosures.map(fc => (
                    <Marker key={fc.id} longitude={fc.lng} latitude={fc.lat} anchor="center" style={{ zIndex: 11 }}>
                        <div
                            className="marker-core marker-foreclosure"
                            onClick={(e) => { e.stopPropagation(); setSelectedFeature(fc); }}
                        />
                    </Marker>
                ))}

                {/* 4. Investor Demand Marker Layer */}
                {activeLayers.showDemand && mockDemand.map(dm => (
                    <Marker key={dm.id} longitude={dm.lng} latitude={dm.lat} anchor="center" style={{ zIndex: 12 }}>
                        <div
                            className="marker-core marker-demand"
                            onClick={(e) => { e.stopPropagation(); setSelectedFeature(dm); }}
                        />
                    </Marker>
                ))}

                {/* 5. Closings Marker Layer */}
                {activeLayers.showClosings && mockClosings.map(closing => (
                    <Marker key={closing.id} longitude={closing.lng} latitude={closing.lat} anchor="center" style={{ zIndex: 13 }}>
                        <div
                            className="marker-core marker-closing"
                            onClick={(e) => { e.stopPropagation(); setSelectedFeature(closing); }}
                        />
                    </Marker>
                ))}

                {/* Global Popup Dispatcher */}
                {selectedFeature && (
                    <Popup
                        longitude={selectedFeature.lng}
                        latitude={selectedFeature.lat}
                        anchor="bottom"
                        onClose={() => setSelectedFeature(null)}
                        closeOnClick={false}
                        className="intelligence-popup"
                        offset={12}
                    >
                        <div className="p-4 min-w-[200px]">
                            <h4 className="font-bold text-sm mb-1">{selectedFeature.address}</h4>

                            {/* Dynamic context block based on marker type clicked */}
                            <div className="text-xs text-gray-400 mb-3 border-b border-[rgba(255,255,255,0.1)] pb-2 uppercase font-mono tracking-wider">
                                {selectedFeature.type === 'deal' && <span className="text-blue-400">Target Assignment</span>}
                                {selectedFeature.type === 'foreclosure' && <span className="text-amber-400">Notice of Default</span>}
                                {selectedFeature.type === 'demand' && <span className="text-purple-400">Buyer Mandate</span>}
                                {selectedFeature.type === 'closing' && <span className="text-emerald-400">Verified HUD-1</span>}
                            </div>

                            {selectedFeature.type === 'deal' && (
                                <div className="flex justify-between font-mono text-sm"><span>Assignment:</span> <span className="text-emerald-400 font-bold">{selectedFeature.amount}</span></div>
                            )}
                            {selectedFeature.type === 'foreclosure' && (
                                <div className="flex justify-between font-mono text-sm"><span>Auction Date:</span> <span>{selectedFeature.auctionDate}</span></div>
                            )}
                            {selectedFeature.type === 'demand' && (
                                <div className="flex justify-between font-mono text-xs"><span>Buying:</span> <span>{selectedFeature.reqs}</span></div>
                            )}
                            {selectedFeature.type === 'closing' && (
                                <div className="flex justify-between font-mono text-sm"><span>Closed:</span> <span>{selectedFeature.date}</span></div>
                            )}
                        </div>
                    </Popup>
                )}
            </Map>
        </div>
    );
};

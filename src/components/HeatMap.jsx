import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, User, DollarSign, Calendar } from 'lucide-react';
import { useDemoMode } from '../contexts/DemoModeContext';

// Create a custom pulsing marker using divIcon
const createPulseIcon = (color) => {
    return L.divIcon({
        className: 'custom-pulse-icon',
        html: `<div class="pulse-marker" style="background-color: ${color}; box-shadow: 0 0 0 0 rgba(${color === '#ef4444' ? '239, 68, 68' : '245, 158, 11'}, 0.7);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
    });
};

const redPulse = createPulseIcon('#ef4444');
const orangePulse = createPulseIcon('#f59e0b');

// Default coordinates for the United States
const defaultCenter = [39.8283, -98.5795];

const demoSalesData = [
    { id: 1, lat: 29.7520, lng: -95.3610, address: "1402 Dallas St, Houston, TX", buyer: "Blackstone Equity Group", amount: "$350,000", date: "2 days ago", type: "hot" },
    { id: 2, lat: 29.7450, lng: -95.3650, address: "918 Webster St, Houston, TX", buyer: "Texas Reholdings LLC", amount: "$215,000", date: "5 days ago", type: "warm" },
    { id: 3, lat: 29.7420, lng: -95.3520, address: "2104 Leeland St, Houston, TX", buyer: "OpenDoor Capital", amount: "$412,500", date: "1 week ago", type: "hot" },
    { id: 4, lat: 29.7610, lng: -95.3480, address: "804 Nance St, Houston, TX", buyer: "Local Investor", amount: "$180,000", date: "3 days ago", type: "warm" },
    { id: 5, lat: 29.7380, lng: -95.3710, address: "2310 Milam St, Houston, TX", buyer: "Zillow Offers", amount: "$520,000", date: "Just now", type: "hot" },
];

const HeatMap = () => {
    const { isDemoMode } = useDemoMode();

    return (
        <div className="heatmap-container glass-panel" style={{ height: '500px', width: '100%', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
            {/* Header Overlay */}
            <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 1000, pointerEvents: 'none' }}>
                <div className="glass-panel text-white px-4 py-2 flex flex-col gap-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <MapPin size={18} className="text-warning" /> Live Market Heat Map
                    </h3>
                    <p className="text-xs text-muted">Tracking recent cash transactions & institutional buying</p>
                </div>
            </div>

            <MapContainer
                center={defaultCenter}
                zoom={4}
                style={{ height: '100%', width: '100%', zIndex: 1 }}
                zoomControl={false}
            >
                {/* Dark Mode Tile Layer (CartoDB Dark Matter) */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {isDemoMode && demoSalesData.map((sale) => (
                    <Marker
                        key={sale.id}
                        position={[sale.lat, sale.lng]}
                        icon={sale.type === 'hot' ? redPulse : orangePulse}
                    >
                        <Popup className="custom-popup">
                            <div className="p-1 min-w-[200px]">
                                <h4 className="font-bold text-sm mb-2 border-b border-gray-700 pb-2">{sale.address}</h4>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 flex items-center gap-1"><User size={12} /> Buyer</span>
                                        <span className="font-semibold text-white">{sale.buyer}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 flex items-center gap-1"><DollarSign size={12} /> Amount</span>
                                        <span className="font-bold text-success">{sale.amount}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 flex items-center gap-1"><Calendar size={12} /> Sold</span>
                                        <span className="text-white">{sale.date}</span>
                                    </div>
                                </div>
                                <button className="mt-3 w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs py-1.5 rounded transition-colors">
                                    View Full Records
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Warning Overlay when in Live Mode (Without API Key) */}
            {!isDemoMode && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="text-center p-6 max-w-md">
                        <MapPin size={48} className="mx-auto mb-4 text-muted opacity-50" />
                        <h3 className="text-xl font-bold mb-2">Live Coordinate Data Blocked</h3>
                        <p className="text-sm text-gray-400 mb-4">
                            You are currently in Live Production Mode. Plotting actual "Recently Sold" coordinates nationwide requires an active API Premium Key.
                        </p>
                        <button className="bg-primary hover:bg-opacity-90 text-white font-semibold py-2 px-6 rounded-lg shadow-lg shadow-primary/30 transition-all text-sm">
                            Connect DataTree API
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HeatMap;

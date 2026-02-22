import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, User, DollarSign, Calendar, Maximize2, Activity } from 'lucide-react';
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

// Default coordinates for USA Center
const defaultCenter = [39.8283, -98.5795];

const demoSalesData = [
    { id: 1, lat: 36.1659, lng: -86.7788, address: "401 Union St, Nashville, TN", buyer: "Blackstone Equity Group", amount: "$850,000", date: "2 days ago", type: "hot" },
    { id: 2, lat: 36.1580, lng: -86.7850, address: "1002 Division St, Nashville, TN", buyer: "Music City Reholdings LLC", amount: "$425,000", date: "5 days ago", type: "warm" },
    { id: 3, lat: 30.2672, lng: -97.7431, address: "500 Main St, Austin, TX", buyer: "OpenDoor Capital", amount: "$612,500", date: "1 week ago", type: "hot" },
    { id: 4, lat: 32.7767, lng: -96.7970, address: "2100 West End Ave, Dallas, TX", buyer: "Local Investor", amount: "$380,000", date: "3 days ago", type: "warm" },
    { id: 5, lat: 29.7604, lng: -95.3698, address: "900 Eastland Ave, Houston, TX", buyer: "Zillow Offers", amount: "$520,000", date: "Just now", type: "hot" },
];

const MapController = ({ zoomedCenter }) => {
    const map = useMap();

    React.useEffect(() => {
        if (zoomedCenter) {
            map.flyTo(zoomedCenter, 11, { duration: 1.5 });
        } else {
            map.flyTo(defaultCenter, 4, { duration: 1.5 });
        }
    }, [zoomedCenter, map]);

    return null;
};

const HeatMap = ({ data = [] }) => {
    const { isDemoMode } = useDemoMode();
    const [zoomedCenter, setZoomedCenter] = useState(null);

    const mapData = data.length > 0 ? data : (isDemoMode ? demoSalesData : []);

    return (
        <div className="heatmap-container glass-panel" style={{ height: '500px', width: '100%', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
            {/* Header Overlay */}
            <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 1000, pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="glass-panel text-white px-4 py-2 flex flex-col gap-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <MapPin size={18} className="text-warning" /> National Heat Map
                    </h3>
                    <p className="text-xs text-muted">Tracking high-value targets and active areas</p>
                </div>

                {zoomedCenter && (
                    <button
                        onClick={() => setZoomedCenter(null)}
                        style={{ pointerEvents: 'auto' }}
                        className="btn btn-primary btn-sm flex items-center gap-2 w-fit shadow-lg shadow-black/50"
                    >
                        <Maximize2 size={14} /> Reset View
                    </button>
                )}
            </div>

            <MapContainer
                center={defaultCenter}
                zoom={4}
                style={{ height: '100%', width: '100%', zIndex: 1 }}
                zoomControl={false}
            >
                <MapController zoomedCenter={zoomedCenter} />
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {mapData.map((item) => {
                    const isHot = item.type === 'hot' || item.heatScore >= 80;
                    return (
                        <Marker
                            key={item.id}
                            position={[item.lat, item.lng]}
                            icon={isHot ? redPulse : orangePulse}
                            eventHandlers={{
                                click: () => setZoomedCenter([item.lat, item.lng])
                            }}
                        >
                            <Popup className="custom-popup">
                                <div className="p-1 min-w-[200px]">
                                    <h4 className="font-bold text-sm mb-2 border-b border-gray-700 pb-2">
                                        {item.address || item.location || item.name}
                                    </h4>
                                    <div className="space-y-2 text-xs">
                                        {item.buyer && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400 flex items-center gap-1"><User size={12} /> Buyer</span>
                                                <span className="font-semibold text-white">{item.buyer}</span>
                                            </div>
                                        )}
                                        {item.amount && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400 flex items-center gap-1"><DollarSign size={12} /> Amount</span>
                                                <span className="font-bold text-success">{item.amount}</span>
                                            </div>
                                        )}
                                        {item.date && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400 flex items-center gap-1"><Calendar size={12} /> Date</span>
                                                <span className="text-white">{item.date}</span>
                                            </div>
                                        )}
                                        {item.heatScore && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400 flex items-center gap-1"><Activity size={12} /> Score</span>
                                                <span className={`font-bold ${isHot ? 'text-danger' : 'text-warning'}`}>{item.heatScore} / 100</span>
                                            </div>
                                        )}
                                    </div>
                                    <button className="mt-3 w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs py-1.5 rounded transition-colors">
                                        View Details
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>

            {/* Warning Overlay when in Live Mode (Without API Key) */}
            {!isDemoMode && mapData.length === 0 && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="text-center p-6 max-w-md">
                        <MapPin size={48} className="mx-auto mb-4 text-muted opacity-50" />
                        <h3 className="text-xl font-bold mb-2">Live Coordinate Data Blocked</h3>
                        <p className="text-sm text-gray-400 mb-4">
                            You are currently in Live Production Mode. Plotting actual coordinates nationwide requires an active API Premium Key.
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

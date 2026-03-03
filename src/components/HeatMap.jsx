import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, User, DollarSign, Calendar, Maximize2, Activity } from 'lucide-react';
// Fallback placeholder data
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

const placeholderSalesData = [
    { id: 1, lat: 32.3668, lng: -86.3000, address: "Montgomery, AL", buyer: "Blackstone Equity Group", amount: "$850,000", date: "2 days ago", type: "hot" },
    { id: 2, lat: 58.3019, lng: -134.4197, address: "Juneau, AK", buyer: "Local Investor", amount: "$425,000", date: "5 days ago", type: "warm" },
    { id: 3, lat: 33.4484, lng: -112.0740, address: "Phoenix, AZ", buyer: "OpenDoor Capital", amount: "$612,500", date: "1 week ago", type: "hot" },
    { id: 4, lat: 34.7465, lng: -92.2896, address: "Little Rock, AR", buyer: "Zillow Offers", amount: "$380,000", date: "3 days ago", type: "warm" },
    { id: 5, lat: 38.5816, lng: -121.4944, address: "Sacramento, CA", buyer: "Blackstone Equity Group", amount: "$1,200,000", date: "Just now", type: "hot" },
    { id: 6, lat: 39.7392, lng: -104.9903, address: "Denver, CO", buyer: "Opendoor Capital", amount: "$750,000", date: "2 days ago", type: "hot" },
    { id: 7, lat: 41.7658, lng: -72.6734, address: "Hartford, CT", buyer: "Local Investor", amount: "$420,000", date: "1 week ago", type: "warm" },
    { id: 8, lat: 39.1582, lng: -75.5244, address: "Dover, DE", buyer: "Mid-Atlantic Realty", amount: "$310,000", date: "4 days ago", type: "warm" },
    { id: 9, lat: 30.4383, lng: -84.2807, address: "Tallahassee, FL", buyer: "Sunbelt REI", amount: "$540,000", date: "Today", type: "hot" },
    { id: 10, lat: 33.7490, lng: -84.3880, address: "Atlanta, GA", buyer: "Zillow Offers", amount: "$680,000", date: "2 days ago", type: "hot" },
    { id: 11, lat: 21.3069, lng: -157.8583, address: "Honolulu, HI", buyer: "Pacific Investors", amount: "$1,450,000", date: "1 month ago", type: "warm" },
    { id: 12, lat: 43.6150, lng: -116.2023, address: "Boise, ID", buyer: "Mountain West Capital", amount: "$590,000", date: "3 days ago", type: "hot" },
    { id: 13, lat: 39.7817, lng: -89.6501, address: "Springfield, IL", buyer: "Midwest Holdings", amount: "$220,000", date: "1 week ago", type: "warm" },
    { id: 14, lat: 39.7684, lng: -86.1581, address: "Indianapolis, IN", buyer: "Local Investor", amount: "$310,000", date: "2 weeks ago", type: "warm" },
    { id: 15, lat: 41.5868, lng: -93.6250, address: "Des Moines, IA", buyer: "Heartland Realty", amount: "$275,000", date: "4 days ago", type: "warm" },
    { id: 16, lat: 39.0473, lng: -95.6752, address: "Topeka, KS", buyer: "Plains Investors", amount: "$195,000", date: "1 month ago", type: "warm" },
    { id: 17, lat: 38.2009, lng: -84.8733, address: "Frankfort, KY", buyer: "Appalachian Capital", amount: "$240,000", date: "6 days ago", type: "warm" },
    { id: 18, lat: 30.4515, lng: -91.1471, address: "Baton Rouge, LA", buyer: "Gulf Coast Holdings", amount: "$330,000", date: "1 week ago", type: "warm" },
    { id: 19, lat: 44.3106, lng: -69.7795, address: "Augusta, ME", buyer: "Northeast Realty Group", amount: "$280,000", date: "3 days ago", type: "warm" },
    { id: 20, lat: 38.9784, lng: -76.4922, address: "Annapolis, MD", buyer: "Chesapeake Investors", amount: "$650,000", date: "2 days ago", type: "hot" },
    { id: 21, lat: 42.3601, lng: -71.0589, address: "Boston, MA", buyer: "Blackstone Equity Group", amount: "$1,100,000", date: "1 day ago", type: "hot" },
    { id: 22, lat: 42.7325, lng: -84.5555, address: "Lansing, MI", buyer: "Great Lakes Capital", amount: "$260,000", date: "5 days ago", type: "warm" },
    { id: 23, lat: 44.9537, lng: -93.0900, address: "St. Paul, MN", buyer: "Twin Cities REI", amount: "$380,000", date: "1 week ago", type: "warm" },
    { id: 24, lat: 32.2988, lng: -90.1848, address: "Jackson, MS", buyer: "Delta Holdings", amount: "$180,000", date: "2 weeks ago", type: "warm" },
    { id: 25, lat: 38.5739, lng: -92.1790, address: "Jefferson City, MO", buyer: "Show Me Capital", amount: "$210,000", date: "4 days ago", type: "warm" },
    { id: 26, lat: 46.5891, lng: -112.0391, address: "Helena, MT", buyer: "Big Sky Investors", amount: "$450,000", date: "1 month ago", type: "hot" },
    { id: 27, lat: 40.8136, lng: -96.7026, address: "Lincoln, NE", buyer: "Cornhusker Realty", amount: "$290,000", date: "6 days ago", type: "warm" },
    { id: 28, lat: 39.1638, lng: -119.7674, address: "Carson City, NV", buyer: "Desert Capital", amount: "$520,000", date: "2 days ago", type: "hot" },
    { id: 29, lat: 43.2081, lng: -71.5376, address: "Concord, NH", buyer: "New England Holdings", amount: "$370,000", date: "1 week ago", type: "warm" },
    { id: 30, lat: 40.2171, lng: -74.7429, address: "Trenton, NJ", buyer: "Tri-State Investors", amount: "$410,000", date: "3 days ago", type: "warm" },
    { id: 31, lat: 35.6870, lng: -105.9378, address: "Santa Fe, NM", buyer: "Southwest Realty Group", amount: "$680,000", date: "2 weeks ago", type: "hot" },
    { id: 32, lat: 42.6526, lng: -73.7562, address: "Albany, NY", buyer: "Empire State Capital", amount: "$350,000", date: "4 days ago", type: "warm" },
    { id: 33, lat: 35.7796, lng: -78.6382, address: "Raleigh, NC", buyer: "Zillow Offers", amount: "$580,000", date: "Today", type: "hot" },
    { id: 34, lat: 46.8083, lng: -100.7837, address: "Bismarck, ND", buyer: "Prairie Investors", amount: "$280,000", date: "1 month ago", type: "warm" },
    { id: 35, lat: 39.9612, lng: -82.9988, address: "Columbus, OH", buyer: "Buckeye Holdings", amount: "$420,000", date: "1 week ago", type: "warm" },
    { id: 36, lat: 35.4676, lng: -97.5164, address: "Oklahoma City, OK", buyer: "Sooner Capital", amount: "$310,000", date: "3 days ago", type: "warm" },
    { id: 37, lat: 44.9429, lng: -123.0351, address: "Salem, OR", buyer: "Pacific NW Realty", amount: "$460,000", date: "5 days ago", type: "warm" },
    { id: 38, lat: 40.2732, lng: -76.8867, address: "Harrisburg, PA", buyer: "Keystone Investors", amount: "$340,000", date: "2 days ago", type: "warm" },
    { id: 39, lat: 41.8240, lng: -71.4128, address: "Providence, RI", buyer: "Ocean State Capital", amount: "$490,000", date: "1 week ago", type: "hot" },
    { id: 40, lat: 33.9988, lng: -81.0454, address: "Columbia, SC", buyer: "Palmetto Holdings", amount: "$320,000", date: "4 days ago", type: "warm" },
    { id: 41, lat: 44.3683, lng: -100.3510, address: "Pierre, SD", buyer: "Dakota Investors", amount: "$250,000", date: "2 weeks ago", type: "warm" },
    { id: 42, lat: 36.1627, lng: -86.7816, address: "Nashville, TN", buyer: "Music City Reholdings LLC", amount: "$550,000", date: "Just now", type: "hot" },
    { id: 43, lat: 30.2672, lng: -97.7431, address: "Austin, TX", buyer: "OpenDoor Capital", amount: "$612,500", date: "1 week ago", type: "hot" },
    { id: 44, lat: 40.7608, lng: -111.8910, address: "Salt Lake City, UT", buyer: "Mountain West Capital", amount: "$640,000", date: "3 days ago", type: "hot" },
    { id: 45, lat: 44.2601, lng: -72.5754, address: "Montpelier, VT", buyer: "Green Mountain Realty", amount: "$380,000", date: "1 month ago", type: "warm" },
    { id: 46, lat: 37.5407, lng: -77.4360, address: "Richmond, VA", buyer: "Dominion Investors", amount: "$410,000", date: "5 days ago", type: "warm" },
    { id: 47, lat: 47.0379, lng: -122.9007, address: "Olympia, WA", buyer: "Evergreen Capital", amount: "$520,000", date: "2 days ago", type: "hot" },
    { id: 48, lat: 38.3498, lng: -81.6326, address: "Charleston, WV", buyer: "Appalachian Capital", amount: "$220,000", date: "1 week ago", type: "warm" },
    { id: 49, lat: 43.0731, lng: -89.4012, address: "Madison, WI", buyer: "Badger State Holdings", amount: "$450,000", date: "4 days ago", type: "warm" },
    { id: 50, lat: 41.1400, lng: -104.8202, address: "Cheyenne, WY", buyer: "Frontier Investors", amount: "$360,000", date: "2 weeks ago", type: "warm" }
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
    const [zoomedCenter, setZoomedCenter] = useState(null);

    // Forcing the mapData to ALWAYS populate using the 50-state capital simulated array if empty
    const mapData = data.length > 0 ? data : placeholderSalesData;

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


        </div>
    );
};

export default HeatMap;

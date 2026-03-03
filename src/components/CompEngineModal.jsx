import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Filter, Home, MapPin, Calculator, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './CompEngineModal.css';

const CompEngineModal = ({ isOpen, onClose, property }) => {

    // Top-Level Filter State
    const [radius, setRadius] = useState(1.0); // Miles
    const [timeframe, setTimeframe] = useState(6); // Months
    const [sqftVariance, setSqftVariance] = useState(15); // Percentage +/-
    const [exactBedBath, setExactBedBath] = useState(false);
    const [renovationTier, setRenovationTier] = useState(property?.renovation_tier || 'moderate');

    useEffect(() => {
        if (property && property.renovation_tier) {
            setRenovationTier(property.renovation_tier);
        }
    }, [property]);

    const handleRenovationTierChange = async (tier) => {
        setRenovationTier(tier);
        if (property?.id) {
            try {
                await supabase.from('properties').update({ renovation_tier: tier }).eq('id', property.id);
            } catch (err) {
                console.error("Failed to save renovation tier", err);
            }
        }
    };

    const [isLoading, setIsLoading] = useState(false);
    const [rawComps, setRawComps] = useState([]);
    const [zillowLink, setZillowLink] = useState(null);
    const [compError, setCompError] = useState(null);
    const [deepLinkMessage, setDeepLinkMessage] = useState(null);

    // Initial Fetch when Modal Opens or Filters change
    useEffect(() => {
        if (!isOpen || !property) return;

        let isStale = false;

        const fetchZillowComps = async () => {
            setIsLoading(true);
            setCompError(null);
            setDeepLinkMessage(null);
            setRawComps([]);

            try {
                let lat = property.lat;
                let lng = property.lng;

                // 1. Geocode if missing coordinates using free OpenStreetMap API
                if (!lat || !lng) {
                    const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(property.address)}&limit=1`;
                    const geoRes = await fetch(geocodeUrl);
                    const geoData = await geoRes.json();
                    if (geoData && geoData.length > 0) {
                        lat = parseFloat(geoData[0].lat);
                        lng = parseFloat(geoData[0].lon);
                    } else {
                        // Fallback coordinates (Nashville)
                        lat = 36.1627;
                        lng = -86.7816;
                    }
                }

                // Calculate bounds for the Zillow Map Pop-out link
                const latDelta = radius / 69.0;
                const lngDelta = radius / (69.0 * Math.cos(lat * Math.PI / 180));
                const bounds = {
                    north: lat + latDelta,
                    south: lat - latDelta,
                    east: lng + lngDelta,
                    west: lng - lngDelta
                };

                const searchQueryState = {
                    mapBounds: bounds,
                    isMapVisible: true,
                    filterState: {
                        sortSelection: { value: 'globalrelevanceex' },
                        isRecentlySold: { value: true },
                        doz: { value: `${timeframe}m` }
                    },
                    isListVisible: true
                };
                setZillowLink(`https://www.zillow.com/homes/recently_sold/?searchQueryState=${encodeURIComponent(JSON.stringify(searchQueryState))}`);

                // 2. Ping Local Playwright Proxy
                const baseUrl = import.meta.env.VITE_API_URL || 'https://wholesale-os.onrender.com';
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;

                const res = await fetch(`${baseUrl}/api/comps`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        lat, lng, radius, timeframeMonths: timeframe,
                        sqftVariance, exactBedBath,
                        subjectSqft: property.sqft || 1500,
                        subjectBeds: property.beds || 3,
                        subjectBaths: property.baths || 2
                    })
                });

                if (res.status === 403) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || "Forbidden. Upgrade required.");
                }
                if (res.status === 500) {
                    throw new Error("Server misconfiguration. The Comps Engine failed to process the request.");
                }
                if (res.status === 503) {
                    throw new Error("Comps Engine Temporarily Offline");
                }
                if (!res.ok) {
                    throw new Error('Failed to fetch real comps from proxy');
                }

                const data = await res.json();
                if (!isStale) {
                    if (data.requiresDeepLink) {
                        setDeepLinkMessage(data.message);
                        if (data.deepLinkUrl) setZillowLink(data.deepLinkUrl);
                        setRawComps([]); // Ensure no fake comps
                    } else {
                        setRawComps(data.comps || []);
                    }
                }

            } catch (error) {
                console.error("CompEngine Error:", error);
                if (!isStale) {
                    setCompError(error.message);
                    setRawComps([]); // NO MORE FAKE DATA! Deterministic blank failure.
                }
            } finally {
                if (!isStale) setIsLoading(false);
            }
        };

        fetchZillowComps();

        return () => { isStale = true; };
    }, [isOpen, property, radius, timeframe, sqftVariance, exactBedBath]); // Auto-refetch if radius/timeframe/precise-filters changes

    // Active Comps Data Filtering (Phase 11 Logic)
    const { activeComps, avgPpsqft, calculatedArv, confidence } = useMemo(() => {
        if (!property || rawComps.length === 0) return { activeComps: [], avgPpsqft: 0, calculatedArv: 0, confidence: 'low' };

        // sqft/beds/baths filter done client side
        const filtered = rawComps.filter(comp => {
            const subjectSqft = property.sqft || 1500;
            const sqftDiff = Math.abs(comp.sqft - subjectSqft) / subjectSqft * 100;
            const matchesSqft = sqftDiff <= sqftVariance;

            let matchesBedBath = true;
            if (exactBedBath) {
                matchesBedBath = (comp.beds === (property.beds || 3) && comp.baths === (property.baths || 2));
            }

            return matchesSqft && matchesBedBath;
        });

        if (filtered.length === 0) return { activeComps: [], avgPpsqft: 0, calculatedArv: 0, confidence: 'low' };

        const totalPpsqft = filtered.reduce((sum, comp) => sum + comp.ppsqft, 0);
        const avg = totalPpsqft / filtered.length;

        let renoMultiplier = 1.0;
        if (renovationTier === 'light') renoMultiplier = 1.05;
        if (renovationTier === 'moderate') renoMultiplier = 1.0;
        if (renovationTier === 'gut') renoMultiplier = 0.85;

        const subjectSqft = property.sqft || 1500;
        const arv = (avg * subjectSqft * renoMultiplier).toFixed(0);

        let conf = 'low';
        if (filtered.length >= 5 && radius <= 1.0 && timeframe <= 6) conf = 'high';
        else if (filtered.length >= 3) conf = 'medium';

        return {
            activeComps: filtered.slice(0, 15), // cap to 15 for UI
            avgPpsqft: avg.toFixed(2),
            calculatedArv: parseInt(arv).toLocaleString(),
            confidence: conf
        };
    }, [rawComps, property, sqftVariance, exactBedBath, renovationTier, radius, timeframe]);

    if (!isOpen || !property) return null;

    const formatMoney = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="comp-engine-overlay" onClick={onClose}>
            <div className="comp-engine-modal glass-panel animate-fade-in" onClick={e => e.stopPropagation()}>
                <div className="comp-engine-header">
                    <div>
                        <h2 className="comp-engine-title"><Calculator className="text-primary" size={24} /> Comp Intelligence Engine</h2>
                        <p className="text-sm text-muted">Analyzing: {property.address}</p>
                    </div>
                    <button className="icon-btn-small" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="comp-engine-body">
                    {/* Left Sidebar: Filters */}
                    <div className="comp-filters">
                        <div className="filter-group">
                            <span className="filter-label">Radius (Miles)</span>
                            <div className="pill-group">
                                {[1.0, 2.0, 3.0].map(r => (
                                    <button
                                        key={r}
                                        className={`filter-pill ${radius === r ? 'active' : ''}`}
                                        onClick={() => setRadius(r)}
                                    >
                                        {r} mi
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="filter-group mt-4">
                            <span className="filter-label">Timeframe</span>
                            <div className="pill-group">
                                {[3, 6, 12].map(t => (
                                    <button
                                        key={t}
                                        className={`filter-pill ${timeframe === t ? 'active' : ''}`}
                                        onClick={() => setTimeframe(t)}
                                    >
                                        {t} Mo
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="filter-group mt-4">
                            <span className="filter-label flex justify-between">
                                SqFt Variance (±{sqftVariance}%)
                            </span>
                            <input
                                type="range"
                                min="5"
                                max="30"
                                step="5"
                                value={sqftVariance}
                                onChange={(e) => setSqftVariance(parseInt(e.target.value))}
                            />
                        </div>

                        <div className="filter-group mt-4">
                            <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                                <input
                                    type="checkbox"
                                    checked={exactBedBath}
                                    onChange={(e) => setExactBedBath(e.target.checked)}
                                    className="accent-primary"
                                />
                                Exact Bed/Bath Match Only
                            </label>
                        </div>

                        <div className="border-t border-[var(--border-light)] my-2"></div>

                        <div className="filter-group">
                            <span className="filter-label text-warning flex items-center gap-1"><Wrench size={14} /> Renovation Tier</span>
                            <div className="pill-group flex-col">
                                <button className={`filter-pill text-left ${renovationTier === 'light' ? 'active' : ''}`} onClick={() => handleRenovationTierChange('light')}>
                                    <strong>Light Cosmetic</strong> (Paint/Carpet)
                                </button>
                                <button className={`filter-pill text-left ${renovationTier === 'moderate' ? 'active' : ''}`} onClick={() => handleRenovationTierChange('moderate')}>
                                    <strong>Moderate</strong> (Kitchen/Baths)
                                </button>
                                <button className={`filter-pill text-left ${renovationTier === 'gut' ? 'active' : ''}`} onClick={() => handleRenovationTierChange('gut')}>
                                    <strong>Full Gut</strong> (Roofs/HVAC/Foundation)
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Results & Calculations */}
                    <div className="comp-results">
                        <div className="comp-summary-bar">
                            <div className="arv-stat-box highlight">
                                <div className="stat-label">Estimated ARV</div>
                                <div className="stat-val">${calculatedArv}</div>
                            </div>
                            <div className="arv-stat-box">
                                <div className="stat-label flex items-center justify-center gap-1">
                                    Confidence Score
                                </div>
                                <div className={`stat-val uppercase text-lg mt-2 confidence-${confidence}`}>
                                    {confidence}
                                </div>
                            </div>
                            <div className="arv-stat-box">
                                <div className="stat-label">Avg $/SqFt</div>
                                <div className="stat-val">${avgPpsqft}</div>
                            </div>
                        </div>

                        <div>
                            <div className="flex-between mb-4">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <MapPin size={18} className="text-primary" />
                                    Comparable Sales <span className="badge bg-[rgba(255,255,255,0.1)] text-xs ml-2">{activeComps.length} Found</span>
                                </h3>
                                <div className="flex gap-2">
                                    {zillowLink && (
                                        <button className="btn btn-primary text-xs py-1 px-3" onClick={() => window.open(zillowLink, '_blank')}>
                                            <ExternalLink size={12} className="mr-1" /> View on Zillow
                                        </button>
                                    )}
                                </div>
                            </div>

                            {isLoading ? (
                                <div className="text-center py-12 text-muted border border-dashed border-[var(--border-light)] rounded-lg">
                                    <RefreshCw size={32} className="mx-auto mb-2 opacity-50 animate-spin" />
                                    <p>Connecting to Stealth Proxy...</p>
                                    <p className="text-sm mt-1">Authenticating and retrieving Live Comps.</p>
                                </div>
                            ) : compError ? (
                                <div className="text-center py-12 text-red-500 border border-dashed border-red-500/30 rounded-lg bg-red-500/5">
                                    <AlertCircle size={36} className="mx-auto mb-3" />
                                    <h4 className="font-bold text-lg mb-2">Access Denied</h4>
                                    <p>{compError}</p>
                                    <button className="btn btn-primary mt-4" onClick={() => window.location.href = '/settings'}>Upgrade Account</button>
                                </div>
                            ) : deepLinkMessage ? (
                                <div className="text-center py-12 border border-dashed border-indigo-500/30 rounded-lg bg-indigo-500/5">
                                    <ExternalLink size={36} className="mx-auto mb-3 text-indigo-400" />
                                    <h4 className="font-bold text-lg mb-2 text-indigo-400">Live External Data Required</h4>
                                    <p className="text-muted mb-4 max-w-sm mx-auto">{deepLinkMessage}</p>
                                    <button className="btn btn-primary px-8" onClick={() => window.open(zillowLink, '_blank')}>
                                        Open Zillow Map ({radius}mi Radius)
                                    </button>
                                </div>
                            ) : activeComps.length === 0 ? (
                                <div className="text-center py-12 text-muted border border-dashed border-[var(--border-light)] rounded-lg">
                                    <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>No real comparables found matching these strict criteria.</p>
                                    <p className="text-sm mt-1">Try expanding your radius or timeframe filters.</p>
                                </div>
                            ) : (
                                <div className="comp-list">
                                    {activeComps.map(comp => (
                                        <div key={comp.id} className="comp-row">
                                            <div>
                                                <div className="comp-address">{comp.address}</div>
                                                <div className="comp-meta">{comp.beds || "?"} beds • {comp.baths || "?"} baths • {comp.sqft || "?"} sqft • Built {comp.yearBuilt || "?"}</div>
                                            </div>
                                            <div className="comp-metric">
                                                <div className="val">{comp.distance.toFixed(2)} mi</div>
                                                <div className="lbl">Distance</div>
                                            </div>
                                            <div className="comp-metric">
                                                <div className="val">{comp.monthsAgo} mo</div>
                                                <div className="lbl">Sold</div>
                                            </div>
                                            <div className="comp-metric">
                                                <div className="val text-success">{formatMoney(comp.price)}</div>
                                                <div className="lbl">${comp.ppsqft.toFixed(2)} / sqft</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Inline icon since it was missed from lucide-react import
const Wrench = ({ size }) => <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>;

export default CompEngineModal;

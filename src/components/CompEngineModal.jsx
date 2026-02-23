import React, { useState, useMemo } from 'react';
import { X, Search, Filter, Home, MapPin, Calculator, AlertCircle, RefreshCw } from 'lucide-react';
import './CompEngineModal.css';

// Mock Comparable Properties Database
const generateMockComps = (baseZip) => {
    return Array.from({ length: 15 }).map((_, i) => {
        const distance = (Math.random() * 1.5).toFixed(2); // 0.01 to 1.50 miles
        const monthsAgo = Math.floor(Math.random() * 12) + 1; // 1 to 12 months
        const sqft = Math.floor(Math.random() * 1000) + 1200; // 1200 to 2200 sqft
        const yearBuilt = Math.floor(Math.random() * 50) + 1960;
        const price = Math.floor(Math.random() * 300000) + 200000;
        const ppsqft = (price / sqft).toFixed(2);

        return {
            id: `comp-${i}`,
            address: `${Math.floor(Math.random() * 9999)} Comp St, ${baseZip}`,
            distance: parseFloat(distance),
            monthsAgo: monthsAgo,
            sqft: sqft,
            yearBuilt: yearBuilt,
            beds: Math.floor(Math.random() * 2) + 2,
            baths: Math.floor(Math.random() * 1.5) + 1,
            price: price,
            ppsqft: parseFloat(ppsqft),
        };
    }).sort((a, b) => a.distance - b.distance);
};

const CompEngineModal = ({ isOpen, onClose, property }) => {
    // Top-Level Filter State
    const [radius, setRadius] = useState(0.5); // Miles
    const [timeframe, setTimeframe] = useState(6); // Months
    const [sqftVariance, setSqftVariance] = useState(15); // Percentage +/-
    const [exactBedBath, setExactBedBath] = useState(false);
    const [renovationTier, setRenovationTier] = useState('moderate');

    const mockComps = useMemo(() => {
        if (!property) return [];
        // Generate a deterministic set of mock comps based on property ID
        return generateMockComps('TX');
    }, [property]);

    // Active Comps Calculation Engine (Phase 11 Logic)
    const { activeComps, avgPpsqft, calculatedArv, confidence } = useMemo(() => {
        if (!property) return { activeComps: [], avgPpsqft: 0, calculatedArv: 0, confidence: 'low' };

        // 1. Filter the database based on UI parameters
        const filtered = mockComps.filter(comp => {
            const matchesRadius = comp.distance <= radius;
            const matchesTime = comp.monthsAgo <= timeframe;
            // Mock property sqft placeholder for demo if one doesn't exist
            const subjectSqft = property.sqft || 1500;
            const sqftDiff = Math.abs(comp.sqft - subjectSqft) / subjectSqft * 100;
            const matchesSqft = sqftDiff <= sqftVariance;

            let matchesBedBath = true;
            if (exactBedBath) {
                matchesBedBath = (comp.beds === (property.beds || 3) && comp.baths === (property.baths || 2));
            }

            return matchesRadius && matchesTime && matchesSqft && matchesBedBath;
        });

        if (filtered.length === 0) return { activeComps: [], avgPpsqft: 0, calculatedArv: 0, confidence: 'low' };

        // 2. Calculate Weighted Average Price per SqFt
        const totalPpsqft = filtered.reduce((sum, comp) => sum + comp.ppsqft, 0);
        const avg = totalPpsqft / filtered.length;

        // 3. Apply Renovation Tier Multipliers
        // Light = standard average, Moderate = 90% of max, Gut = 80% (needs discount for risk)  
        // In a real app, this multiplier is dynamic based on neighborhood condition.
        let renoMultiplier = 1.0;
        if (renovationTier === 'light') renoMultiplier = 1.05; // Slightly higher ARV for turnkey comps
        if (renovationTier === 'moderate') renoMultiplier = 1.0;
        if (renovationTier === 'gut') renoMultiplier = 0.85; // Heavier discount applied to baseline

        const subjectSqft = property.sqft || 1500;
        const arv = (avg * subjectSqft * renoMultiplier).toFixed(0);

        // 4. Derive Confidence Rating
        let conf = 'low';
        if (filtered.length >= 5 && radius <= 0.5 && timeframe <= 6) conf = 'high';
        else if (filtered.length >= 3) conf = 'medium';

        return {
            activeComps: filtered,
            avgPpsqft: avg.toFixed(2),
            calculatedArv: parseInt(arv).toLocaleString(),
            confidence: conf
        };
    }, [mockComps, property, radius, timeframe, sqftVariance, exactBedBath, renovationTier]);

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
                                {[0.25, 0.5, 1.0, 2.0].map(r => (
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
                                <button className={`filter-pill text-left ${renovationTier === 'light' ? 'active' : ''}`} onClick={() => setRenovationTier('light')}>
                                    <strong>Light Cosmetic</strong> (Paint/Carpet)
                                </button>
                                <button className={`filter-pill text-left ${renovationTier === 'moderate' ? 'active' : ''}`} onClick={() => setRenovationTier('moderate')}>
                                    <strong>Moderate</strong> (Kitchen/Baths)
                                </button>
                                <button className={`filter-pill text-left ${renovationTier === 'gut' ? 'active' : ''}`} onClick={() => setRenovationTier('gut')}>
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
                                <button className="btn btn-secondary text-xs py-1"><RefreshCw size={12} className="mr-1" /> Refresh Data</button>
                            </div>

                            {activeComps.length === 0 ? (
                                <div className="text-center py-12 text-muted border border-dashed border-[var(--border-light)] rounded-lg">
                                    <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>No comparables found matching these strict criteria.</p>
                                    <p className="text-sm mt-1">Try expanding your radius or timeframe filters.</p>
                                </div>
                            ) : (
                                <div className="comp-list">
                                    {activeComps.map(comp => (
                                        <div key={comp.id} className="comp-row">
                                            <div>
                                                <div className="comp-address">{comp.address}</div>
                                                <div className="comp-meta">{comp.beds} beds • {comp.baths} baths • {comp.sqft} sqft • Built {comp.yearBuilt}</div>
                                            </div>
                                            <div className="comp-metric">
                                                <div className="val">{comp.distance} mi</div>
                                                <div className="lbl">Distance</div>
                                            </div>
                                            <div className="comp-metric">
                                                <div className="val">{comp.monthsAgo} mo</div>
                                                <div className="lbl">Sold</div>
                                            </div>
                                            <div className="comp-metric">
                                                <div className="val text-success">{formatMoney(comp.price)}</div>
                                                <div className="lbl">${comp.ppsqft} / sqft</div>
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

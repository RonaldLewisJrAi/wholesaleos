import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Save, Wrench, Info, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useDemoMode } from '../contexts/DemoModeContext';
import './RehabEstimator.css';

const defaultLineItems = [
    { id: '1', category: 'Roof', description: 'Replace Shingles', cost: 7500 },
    { id: '2', category: 'HVAC', description: 'New 3-Ton Unit', cost: 6000 },
    { id: '3', category: 'Kitchen', description: 'Cabinets & Counters', cost: 12000 },
    { id: '4', category: 'Bathrooms', description: 'Update Fixtures', cost: 4500 },
    { id: '5', category: 'Flooring', description: 'LVP Throughout', cost: 8000 },
    { id: '6', category: 'Paint', description: 'Interior/Exterior', cost: 5500 }
];

const RehabEstimator = ({ property, onSaveComplete }) => {
    const { isDemoMode } = useDemoMode();
    const [tier, setTier] = useState('Moderate');
    const [lineItems, setLineItems] = useState([]);
    const [isCustomEditing, setIsCustomEditing] = useState(false);
    const [markupPct, setMarkupPct] = useState(20);
    const [isSaving, setIsSaving] = useState(false);

    // Initial setup based on tier
    useEffect(() => {
        if (!isCustomEditing) {
            // Adjust mock prices based on tier for the demo if not in custom mode
            let multiplier = 1;
            if (tier === 'Light') multiplier = 0.5;
            if (tier === 'Full Gut') multiplier = 1.8;

            setLineItems(defaultLineItems.map(item => ({
                ...item,
                cost: Math.round(item.cost * multiplier)
            })));
        }
    }, [tier, isCustomEditing]);

    const handleAddLineItem = () => {
        setIsCustomEditing(true);
        setLineItems([
            ...lineItems,
            { id: Date.now().toString(), category: 'Custom', description: 'New Line Item', cost: 0 }
        ]);
    };

    const handleUpdateLineItem = (id, field, value) => {
        setIsCustomEditing(true);
        setLineItems(lineItems.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const handleRemoveLineItem = (id) => {
        setIsCustomEditing(true);
        setLineItems(lineItems.filter(item => item.id !== id));
    };

    const totals = useMemo(() => {
        const subtotal = lineItems.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
        const markup = Math.round(subtotal * (markupPct / 100));
        const total = subtotal + markup;

        let perSqft = 0;
        if (property?.sqft) {
            perSqft = (total / property.sqft).toFixed(2);
        }

        return { subtotal, markup, total, perSqft };
    }, [lineItems, markupPct, property]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (isDemoMode || !supabase) {
                // Mock delay
                await new Promise(resolve => setTimeout(resolve, 800));
                if (onSaveComplete) onSaveComplete(totals.total);
                return;
            }

            const { error } = await supabase.from('repair_estimates').insert({
                property_id: property.id,
                renovation_tier: tier,
                per_sqft_estimate: totals.perSqft,
                contractor_markup_pct: markupPct,
                total_estimated_cost: totals.total,
                line_item_details: lineItems
            });

            if (error) throw error;
            if (onSaveComplete) onSaveComplete(totals.total);

        } catch (error) {
            console.error("Failed to save repair estimate", error);
            alert("Failed to save estimate. See console for details.");
        } finally {
            setIsSaving(false);
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="rehab-estimator">
            <div className="rehab-header-card glass-panel flex-between mb-4 p-4">
                <div>
                    <h3 className="font-bold flex items-center gap-2 mb-1"><Wrench className="text-primary" size={18} /> Renovation Engine</h3>
                    <p className="text-xs text-muted">Intelligent line-item breakdown for {property?.address || 'Selected Property'}</p>
                </div>
                <div className="tier-selector">
                    {['Light', 'Moderate', 'Full Gut'].map(t => (
                        <button
                            key={t}
                            className={`tier-btn ${tier === t ? 'active' : ''}`}
                            onClick={() => { setTier(t); setIsCustomEditing(false); }}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="rehab-main-grid">
                <div className="rehab-line-items glass-panel p-4">
                    <div className="flex-between mb-4 border-b border-[var(--border-light)] pb-2">
                        <h4 className="font-semibold text-sm uppercase tracking-wide">Repair Matrix</h4>
                        <button className="icon-btn-small text-primary" onClick={handleAddLineItem} title="Add Line Item"><Plus size={16} /></button>
                    </div>

                    <div className="line-item-list">
                        <div className="line-item-header flex text-xs text-muted mb-2 px-2 uppercase font-medium">
                            <div className="w-1/3">Category</div>
                            <div className="w-1/2">Description</div>
                            <div className="w-1/4 text-right">Cost Estimate</div>
                            <div className="w-8"></div>
                        </div>

                        {lineItems.map(item => (
                            <div key={item.id} className="line-item-row flex items-center gap-2 mb-2 bg-[rgba(0,0,0,0.2)] p-2 rounded">
                                <div className="w-1/3">
                                    <input
                                        type="text"
                                        className="rehab-input w-full"
                                        value={item.category}
                                        onChange={(e) => handleUpdateLineItem(item.id, 'category', e.target.value)}
                                        placeholder="Category"
                                    />
                                </div>
                                <div className="w-1/2">
                                    <input
                                        type="text"
                                        className="rehab-input w-full"
                                        value={item.description}
                                        onChange={(e) => handleUpdateLineItem(item.id, 'description', e.target.value)}
                                        placeholder="Description"
                                    />
                                </div>
                                <div className="w-1/4 relative">
                                    <DollarSign size={12} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted" />
                                    <input
                                        type="number"
                                        className="rehab-input w-full pl-6 text-right"
                                        value={item.cost}
                                        onChange={(e) => handleUpdateLineItem(item.id, 'cost', Number(e.target.value))}
                                    />
                                </div>
                                <button className="w-8 flex justify-center text-muted hover:text-danger" onClick={() => handleRemoveLineItem(item.id)}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rehab-summary glass-panel p-4 flex flex-col">
                    <h4 className="font-semibold text-sm uppercase tracking-wide mb-4 border-b border-[var(--border-light)] pb-2">Financial Summary</h4>

                    <div className="summary-row flex-between text-sm mb-2 text-gray-300">
                        <span>Materials & Labor</span>
                        <span>{formatCurrency(totals.subtotal)}</span>
                    </div>

                    <div className="summary-row flex-between text-sm mb-4">
                        <span className="flex items-center gap-1 text-muted">
                            Contractor Markup
                            <input
                                type="number"
                                className="rehab-input-small w-12 text-center mx-1 bg-[rgba(255,255,255,0.05)] border border-[var(--border-light)] rounded px-1"
                                value={markupPct}
                                onChange={(e) => setMarkupPct(Number(e.target.value))}
                            />%
                        </span>
                        <span>{formatCurrency(totals.markup)}</span>
                    </div>

                    <div className="total-box mt-auto bg-[rgba(0,0,0,0.3)] p-4 rounded border border-primary/30">
                        <div className="flex-between mb-1">
                            <span className="text-sm font-bold text-primary uppercase">Total Rehab Cost</span>
                            <span className="text-xl font-bold">{formatCurrency(totals.total)}</span>
                        </div>
                        {property?.sqft && (
                            <div className="text-right text-xs text-muted">
                                {formatCurrency(totals.perSqft)} / sqft
                            </div>
                        )}
                    </div>

                    <button
                        className="btn btn-primary w-full mt-4 flex justify-center gap-2"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? <span className="animate-pulse">Saving Matrix...</span> : <><Save size={16} /> Save to Deal Packet</>}
                    </button>

                    <p className="text-[10px] text-muted flex items-start gap-1 mt-3 text-center">
                        <Info size={12} className="mt-0.5 flex-shrink-0" />
                        This estimate will be automatically attached to the investor disposition packet when generated.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RehabEstimator;

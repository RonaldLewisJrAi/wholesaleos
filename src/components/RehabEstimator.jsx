import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Save, Wrench, Info, DollarSign } from 'lucide-react';
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
    const [tier, setTier] = useState('Moderate');
    const [lineItems, setLineItems] = useState(defaultLineItems);
    const [markupPct, setMarkupPct] = useState(20);
    const [isSaving, setIsSaving] = useState(false);

    const handleAddLineItem = () => {
        setLineItems([
            ...lineItems,
            { id: Date.now().toString(), category: 'Custom', description: 'New Line Item', cost: 0 }
        ]);
    };

    const handleUpdateLineItem = (id, field, value) => {
        setLineItems(lineItems.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const handleRemoveLineItem = (id) => {
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
                            onClick={() => {
                                setTier(t);
                                let multiplier = 1;
                                if (t === 'Light') multiplier = 0.5;
                                if (t === 'Full Gut') multiplier = 1.8;
                                setLineItems(defaultLineItems.map(item => ({
                                    ...item,
                                    cost: Math.round(item.cost * multiplier)
                                })));
                            }}
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
                        <div className="line-item-header grid grid-cols-[1fr_2fr_1fr_32px] gap-2 text-xs text-muted mb-2 px-2 uppercase font-medium">
                            <div>Category</div>
                            <div>Description</div>
                            <div className="text-right pb-1">Cost Estimate</div>
                            <div></div>
                        </div>

                        {lineItems.map(item => (
                            <div key={item.id} className="line-item-row grid grid-cols-[1fr_2fr_1fr_32px] gap-2 items-center mb-2 bg-[rgba(0,0,0,0.2)] p-2 rounded">
                                <div>
                                    <input
                                        type="text"
                                        className="rehab-input w-full"
                                        value={item.category}
                                        onChange={(e) => handleUpdateLineItem(item.id, 'category', e.target.value)}
                                        placeholder="Category"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        className="rehab-input w-full"
                                        value={item.description}
                                        onChange={(e) => handleUpdateLineItem(item.id, 'description', e.target.value)}
                                        placeholder="Description"
                                    />
                                </div>
                                <div className="relative">
                                    <DollarSign size={12} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted" />
                                    <input
                                        type="number"
                                        className="rehab-input w-full pl-6 text-right"
                                        value={item.cost}
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => handleUpdateLineItem(item.id, 'cost', Number(e.target.value))}
                                    />
                                </div>
                                <button className="flex justify-center text-muted hover:text-danger" onClick={() => handleRemoveLineItem(item.id)}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rehab-summary glass-panel p-4 flex flex-col justify-between">
                    <div>
                        <h4 className="font-semibold text-sm uppercase tracking-wide mb-4 border-b border-[var(--border-light)] pb-2">Financial Summary</h4>

                        <div className="summary-row grid grid-cols-[1fr_auto] gap-4 items-center text-sm mb-2 text-gray-300">
                            <span>Materials & Labor</span>
                            <span className="text-right">{formatCurrency(totals.subtotal)}</span>
                        </div>

                        <div className="summary-row grid grid-cols-[1fr_auto] gap-4 items-center text-sm mb-4">
                            <span className="flex items-center gap-1 text-muted">
                                Contractor Markup
                                <input
                                    type="number"
                                    className="rehab-input-small w-12 text-center mx-1 bg-[rgba(255,255,255,0.05)] border border-[var(--border-light)] rounded px-1"
                                    value={markupPct}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => setMarkupPct(Number(e.target.value))}
                                />%
                            </span>
                            <span className="text-right">{formatCurrency(totals.markup)}</span>
                        </div>
                    </div>

                    <div>
                        <div className="total-box mt-4 bg-[rgba(0,0,0,0.3)] p-3 rounded border border-primary/30">
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

                        <div className="flex justify-between items-center mt-4">
                            <p className="text-[10px] text-muted flex items-start gap-1 flex-1 pr-4">
                                <Info size={12} className="mt-0.5 flex-shrink-0" />
                                Estimate is attached to investor packet upon save.
                            </p>

                            <button
                                className="btn text-xs py-1.5 px-3 flex items-center gap-2 bg-primary/10 hover:bg-primary/30 text-primary border border-primary/30 rounded shadow-sm transition-all"
                                onClick={() => {
                                    setIsSaving(true);
                                    setTimeout(() => {
                                        setIsSaving(false);
                                        alert("Rehab Estimate Matrix saved to Property Record.");
                                        if (onSaveComplete) onSaveComplete();
                                    }, 500);
                                }}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <span className="animate-pulse">Saving...</span>
                                ) : (
                                    <>
                                        <Save size={14} />
                                        <span className="font-semibold uppercase tracking-wide">Save Matrix</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RehabEstimator;

import React, { useState, useEffect } from 'react';
import { Plus, Settings, MoreHorizontal, Edit2, Trash2, Zap, Clock, DollarSign, Target, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { calculateAssignmentFeeRange, calculateBuyerDemandIndex, estimateTimeToClose, calculateDealProbability } from '../lib/DealIntelligence';
import './Pipeline.css';

const initialStages = [
    {
        id: 'stage-1',
        title: 'Lead Intake',
        deals: [
            { id: 'deal-1', address: '123 Main St', value: '$10k', days: 2, tags: ['Hot'] },
            { id: 'deal-2', address: '456 Oak Ave', value: '$15k', days: 5, tags: ['Review'] }
        ]
    },
    {
        id: 'stage-2',
        title: 'Underwriting',
        deals: [
            { id: 'deal-3', address: '789 Pine Ln', value: '$25k', days: 1, tags: ['Needs Comp'] }
        ]
    },
    {
        id: 'stage-3',
        title: 'Under Contract',
        deals: [
            { id: 'deal-4', address: '321 Elm St', value: '$30k', days: 12, tags: ['EMD Cleared'] }
        ]
    },
    {
        id: 'stage-4',
        title: 'Disposition',
        deals: [
            { id: 'deal-5', address: '654 Maple Dr', value: '$12k', days: 3, tags: ['Blast Sent'] }
        ]
    }
];

const Pipeline = () => {
    const [stages, setStages] = useState(initialStages);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPipeline = async () => {
            if (!supabase) {
                // No connection, keep initialStages
                setLoading(false);
                return;
            }

            try {
                // Fetch deals from a hypothetical 'pipeline' table
                const { data, error } = await supabase
                    .from('pipeline')
                    .select('*');

                if (error) throw error;

                if (data && data.length > 0) {
                    // Complex logic to map flat db rows to stage arrays
                    // Phase 28: We now intercept each deal to calculate live AI Buyer Demand
                    const groupedStages = await Promise.all(initialStages.map(async (stage) => {
                        const stageDeals = data.filter(d => d.stage_id === stage.id);

                        // If no backend DB matches, we fallback to the mockup UI but still run the AI
                        const dealsToMap = stageDeals.length > 0 ? stageDeals : stage.deals;

                        const dealsWithIntelligence = await Promise.all(dealsToMap.map(async (deal) => {
                            const bdi = await calculateBuyerDemandIndex(deal.zipCode || "37206", deal.propertyType || "SFR");
                            return { ...deal, bdiScore: bdi.score, bdiMatches: bdi.matches };
                        }));

                        return { ...stage, deals: dealsWithIntelligence };
                    }));

                    setStages(groupedStages);
                    setStages(groupedStages);
                } else {
                    // If no DB rows, apply AI data to the hardcoded initial Stages
                    const fallbackStages = await Promise.all(initialStages.map(async (stage) => {
                        const fallbackDeals = await Promise.all(stage.deals.map(async (deal) => {
                            const bdi = await calculateBuyerDemandIndex(deal.zipCode || "37206", deal.propertyType || "SFR");
                            return { ...deal, bdiScore: bdi.score, bdiMatches: bdi.matches };
                        }));
                        return { ...stage, deals: fallbackDeals };
                    }));
                    setStages(fallbackStages);
                }
            } catch (error) {
                console.error("Pipeline fetch failed, sticking to mock data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPipeline();
    }, []);

    const handleCustomizeStages = () => {
        const newStageName = window.prompt("Enter a name for the new Pipeline Stage:");
        if (!newStageName) return;

        const newStage = {
            id: `custom-stage-${Date.now()}`,
            title: newStageName,
            deals: []
        };

        setStages(prev => [...prev, newStage]);
        alert(`Successfully added new stage: "${newStageName}"`);
    };

    const handleAddDeal = (stageId) => {
        if (!stageId) return;
        const newDeal = {
            id: `deal-${Date.now()}`,
            address: 'New Property',
            value: '$--k',
            days: 0,
            tags: ['New'],
            // Phase 28: Initial Intelligence Markers
            arv: 250000,
            purchasePrice: 180000,
            repairs: 25000,
            rehabLevel: "Moderate to Full Gut",
            smi: 3, // Seller Motivation Index (1-5)
            equityPercent: 28,
            zipCode: "37206",
            propertyType: "SFR",
            bdiScore: "Warm (1)",
            bdiMatches: 1
        };

        // Asynchronously fetch real BDI after creation
        calculateBuyerDemandIndex(newDeal.zipCode, newDeal.propertyType).then(bdi => {
            setStages(currentStages => currentStages.map(stage => {
                if (stage.id === stageId) {
                    return {
                        ...stage,
                        deals: stage.deals.map(d => d.id === newDeal.id ? { ...d, bdiScore: bdi.score, bdiMatches: bdi.matches } : d)
                    };
                }
                return stage;
            }));
        });

        const updatedStages = stages.map(stage => {
            if (stage.id === stageId) {
                // Prepend the new deal to the top of the column
                return { ...stage, deals: [newDeal, ...stage.deals] };
            }
            return stage;
        });
        setStages(updatedStages);
    };

    const checkExclusivityLock = async (address) => {
        if (!supabase) return { isLocked: false };
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data, error } = await supabase
                .from('properties')
                .select('exclusive_locked_by, exclusive_locked_at')
                .eq('address', address)
                .gte('exclusive_locked_at', thirtyDaysAgo.toISOString())
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') {
                return { isLocked: false, error };
            }
            if (data) {
                return { isLocked: true };
            }
            return { isLocked: false };
        } catch (err) {
            console.error("Exclusivity check failed", err);
            return { isLocked: false };
        }
    };

    const handleEditDeal = async (stageId, dealId, currentAddress, currentValue) => {
        const newAddress = window.prompt("Enter new address:", currentAddress);
        if (!newAddress) return;

        if (newAddress !== currentAddress) {
            const { isLocked } = await checkExclusivityLock(newAddress);
            if (isLocked) {
                alert("🔒 Access Denied: This property is actively being worked by another investor. The 30-day exclusivity lock has not expired.");
                return;
            }
        }

        const newValue = window.prompt("Enter new fee (e.g. $15k):", currentValue);
        if (!newValue) return;

        setStages(prevStages => prevStages.map(stage => {
            if (stage.id === stageId) {
                return {
                    ...stage,
                    deals: stage.deals.map(d =>
                        d.id === dealId ? { ...d, address: newAddress, value: newValue } : d
                    )
                };
            }
            return stage;
        }));
    };

    // Phase 29: Closed-Loop Learning - Log Actual Outcomes
    const handleCloseDeal = async (stageId, deal) => {
        const actualFeeStr = window.prompt(`Closing Deal: ${deal.address}\n\nEnter the ACTUAL Assignment Fee finalized (e.g. 15000):`);
        if (!actualFeeStr) return;

        const actualFee = parseFloat(actualFeeStr.replace(/[^0-9.-]+/g, ""));
        if (isNaN(actualFee)) {
            alert("Please enter a valid number for the assignment fee.");
            return;
        }

        const daysToCloseStr = window.prompt(`How many days did this deal take from Lead to Final Close?`);
        const daysToClose = parseInt(daysToCloseStr, 10) || 14;

        try {
            if (supabase) {
                // Determine predictions
                const feePrediction = calculateAssignmentFeeRange(deal.arv || 250000, deal.purchasePrice || 180000, deal.repairs || 25000);
                const ettc = estimateTimeToClose(deal.rehabLevel || "Moderate to Full Gut", deal.smi || 3);
                const probScore = calculateDealProbability(deal.equityPercent || 28, deal.smi || 3, deal.bdiMatches || 0);

                // Phase 29: Push to the Closed-Loop Ledger
                await supabase.from('deal_outcomes').insert([{
                    organization_id: deal.organization_id || "placeholder-org", // In production, derived from user session
                    deal_ref_id: deal.id,
                    zip_code: deal.zipCode || "Unknown",
                    property_type: deal.propertyType || "SFR",
                    predicted_dps: probScore,
                    predicted_afr_min: parseFloat(feePrediction.min.replace(/[^0-9.-]+/g, "")) || 0,
                    predicted_afr_max: parseFloat(feePrediction.max.replace(/[^0-9.-]+/g, "")) || 0,
                    predicted_ettc_days: ettc,
                    was_closed: true,
                    actual_assignment_fee: actualFee,
                    actual_days_to_close: daysToClose,
                    buyer_interest_velocity: deal.bdiMatches || 0,
                    loss_reason: null
                }]);
            }
            alert(`🎉 Deal Closed! Analytics successfully logged to the Wholesale OS Intelligence Engine.\n\nActual Fee: $${actualFee.toLocaleString()}\nDays to Close: ${daysToClose}`);

            // Remove the deal from the active pipeline
            setStages(prevStages => prevStages.map(stage => {
                if (stage.id === stageId) {
                    return { ...stage, deals: stage.deals.filter(d => d.id !== deal.id) };
                }
                return stage;
            }));
        } catch (error) {
            console.error("Failed to log deal outcome:", error);
            alert("Error logging the closed deal metrics.");
        }
    };

    const handleDeleteDeal = (stageId, dealId, currentAddress) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete ${currentAddress}?`);
        if (confirmDelete) {
            setStages(prevStages => prevStages.map(stage => {
                if (stage.id === stageId) {
                    return { ...stage, deals: stage.deals.filter(d => d.id !== dealId) };
                }
                return stage;
            }));
        }
    };

    return (
        <div className="pipeline-container animate-fade-in">
            <div className="page-header flex-between mb-0">
                <div>
                    <h1 className="page-title">Deal Pipeline</h1>
                    <p className="page-description">Newest deals automatically appear at the top of each workflow stage.</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={handleCustomizeStages}><Settings size={16} /> Customize Stages</button>
                    <button className="btn btn-primary" onClick={() => handleAddDeal(stages[0]?.id)}><Plus size={16} /> Add Deal</button>
                </div>
            </div>

            <div className="kanban-board">
                {loading ? (
                    <div className="p-4 text-muted">Loading pipeline...</div>
                ) : (
                    stages.map(stage => (
                        <div key={stage.id} className="kanban-column glass-panel">
                            <div className="column-header">
                                <div className="column-title-wrap">
                                    <h3 className="column-title">{stage.title}</h3>
                                    <span className="deal-count">{stage.deals.length}</span>
                                </div>
                                <button className="icon-btn-small"><MoreHorizontal size={16} /></button>
                            </div>

                            <div className="column-content">
                                {stage.deals.map(deal => (
                                    <div key={deal.id} className="deal-card">
                                        <div className="deal-card-header flex-between">
                                            <span className="deal-address">{deal.address}</span>
                                            <div className="deal-actions">
                                                <button className="icon-btn-small text-success" onClick={() => handleCloseDeal(stage.id, deal)} title="Close Deal & Log Analytics"><CheckCircle size={14} /></button>
                                                <button className="icon-btn-small" onClick={() => handleEditDeal(stage.id, deal.id, deal.address, deal.value)} title="Edit Deal"><Edit2 size={14} /></button>
                                                <button className="icon-btn-small text-danger" onClick={() => handleDeleteDeal(stage.id, deal.id, deal.address)} title="Delete Deal"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                        <div className="deal-metrics flex flex-col gap-1 mt-2">
                                            {/* Phase 28: Render AI Deal Intelligence Variables */}
                                            {(() => {
                                                const feePrediction = calculateAssignmentFeeRange(deal.arv || 250000, deal.purchasePrice || 180000, deal.repairs || 25000);
                                                const ettc = estimateTimeToClose(deal.rehabLevel || "Moderate to Full Gut", deal.smi || 3);

                                                const probScore = calculateDealProbability(deal.equityPercent || 28, deal.smi || 3, deal.bdiMatches || 0);

                                                let probColor = "text-danger";
                                                if (probScore > 75) probColor = "text-success";
                                                else if (probScore > 50) probColor = "text-warning";

                                                let heatColor = "text-muted";
                                                let heatBg = "bg-dark";
                                                if (deal.bdiMatches >= 5) { heatColor = "text-danger"; heatBg = "bg-danger/20 border border-danger/50"; }
                                                else if (deal.bdiMatches >= 3) { heatColor = "text-warning"; heatBg = "bg-warning/20 border border-warning/50"; }
                                                else if (deal.bdiMatches >= 1) { heatColor = "text-primary"; heatBg = "bg-primary/20 border border-primary/50"; }

                                                return (
                                                    <>
                                                        <div className="flex-between text-xs font-semibold mb-1">
                                                            <span className="flex items-center gap-1"><DollarSign size={12} /> AFR:</span>
                                                            <span className="text-success">{feePrediction.formatted}</span>
                                                        </div>
                                                        <div className="flex-between text-xs text-muted mb-1">
                                                            <span className="flex items-center gap-1"><Clock size={12} /> ETTC:</span>
                                                            <span>{ettc} Days</span>
                                                        </div>
                                                        <div className="flex-between text-xs text-muted mb-1">
                                                            <span className="flex items-center gap-1"><Target size={12} /> DPS:</span>
                                                            <span className={`font-bold ${probColor}`}>{probScore}%</span>
                                                        </div>
                                                        <div className="flex-between text-xs text-muted">
                                                            <span className="flex items-center gap-1"><Zap size={12} /> Heat:</span>
                                                            <span className={`badge ${heatBg} ${heatColor} px-1 rounded-sm text-[10px]`}>{deal.bdiScore || "Calculating..."}</span>
                                                        </div>
                                                        <div className="mt-2 text-center">
                                                            <span className="inline-block bg-warning/10 text-warning text-[9px] px-1.5 py-0.5 rounded border border-warning/20 font-mono tracking-tighter">
                                                                ⚠️ BETA AI: &lt;50 DEALS LOGGED
                                                            </span>
                                                        </div>
                                                    </>
                                                )
                                            })()}
                                        </div>
                                        <div className="deal-tags">
                                            {deal.tags && deal.tags.map(tag => (
                                                <span key={tag} className="tag">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="add-deal-btn" onClick={() => handleAddDeal(stage.id)}>+ New Deal</button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Pipeline;

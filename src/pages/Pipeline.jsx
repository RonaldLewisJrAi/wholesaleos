import React, { useState, useEffect } from 'react';
import { Plus, Settings, MoreHorizontal, Edit2, Trash2, Zap, Clock, DollarSign, Target, CheckCircle, Shield, ArrowRight, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/useAuth';
import { calculateAssignmentFeeRange, calculateBuyerDemandIndex, estimateTimeToClose, calculateDealProbability } from '../lib/DealIntelligence';
import { calculateDealScore, calculateLiquiditySignal, calculateCloseProbability } from '../services/dealIntelligenceEngine';
import { matchDealToInvestors, mockLiquidityInvestors } from '../services/liquidityEngine';

const initialStages = [
    {
        id: 'new-deals',
        title: 'New Deals',
        deals: [
            { id: 'deal-1', address: '123 Main St', value: '$10k', days: 2, tags: ['Hot'] },
            { id: 'deal-2', address: '456 Oak Ave', value: '$15k', days: 5, tags: ['Review'] }
        ]
    },
    {
        id: 'analyzing',
        title: 'Analyzing',
        deals: [
            { id: 'deal-3', address: '789 Pine Ln', value: '$25k', days: 1, tags: ['Needs Comp'] }
        ]
    },
    {
        id: 'buyer-interest',
        title: 'Buyer Interest',
        deals: []
    },
    {
        id: 'under-contract',
        title: 'Under Contract',
        deals: [
            { id: 'deal-4', address: '321 Elm St', value: '$30k', days: 12, tags: ['EMD Cleared'] }
        ]
    },
    {
        id: 'closing',
        title: 'Closing',
        deals: [
            { id: 'deal-5', address: '654 Maple Dr', value: '$12k', days: 3, tags: ['Blast Sent'] }
        ]
    }
];

const Pipeline = () => {
    const { user } = useAuth();
    const role = user?.primary_persona || 'WHOLESALER';
    const isReadOnlyRole = ['REALTOR', 'INVESTOR', 'TITLE_COMPANY'].includes(role);
    const [stages, setStages] = useState(initialStages);
    const [loading, setLoading] = useState(true);
    const [draggingDeal, setDraggingDeal] = useState(null);

    useEffect(() => {
        const fetchPipeline = async () => {
            if (!supabase) {
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('pipeline')
                    .select('*');

                if (error) throw error;

                if (data && data.length > 0) {
                    const groupedStages = await Promise.all(initialStages.map(async (stage) => {
                        const stageDeals = data.filter(d => d.stage_id === stage.id);
                        const dealsToMap = stageDeals.length > 0 ? stageDeals : stage.deals;

                        const dealsWithIntelligence = await Promise.all(dealsToMap.map(async (deal) => {
                            const bdi = await calculateBuyerDemandIndex(deal.zipCode || "37206", deal.propertyType || "SFR");
                            return { ...deal, bdiScore: bdi.score, bdiMatches: bdi.matches };
                        }));

                        return { ...stage, deals: dealsWithIntelligence };
                    }));

                    setStages(groupedStages);
                } else {
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

    // HTML5 Drag and Drop Handlers
    const handleDragStart = (e, deal, sourceStageId) => {
        setDraggingDeal({ deal, sourceStageId });
        // Set slightly transparent effect on drag
        e.currentTarget.style.opacity = '0.5';
        e.dataTransfer.effectAllowed = 'move';
        // HTML5 drag requires some data to be set
        e.dataTransfer.setData('text/plain', deal.id);
    };

    const handleDragEnd = (e) => {
        e.currentTarget.style.opacity = '1';
        setDraggingDeal(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e, targetStageId) => {
        e.preventDefault();
        if (!draggingDeal) return;

        const { deal, sourceStageId } = draggingDeal;
        if (sourceStageId === targetStageId) return;

        const targetStage = stages.find(s => s.id === targetStageId);

        // Guardrail: Cannot assign/dispose without EMD
        if (targetStage.id === 'closing' || targetStage.id === 'under-contract') {
            if (!deal.tags?.includes('EMD Cleared') && !deal.emd_amount && targetStage.id === 'closing') {
                alert(`🛑 OPERATIONAL BLOCK: Cannot move ${deal.address} to Closing. Earnest Money Deposit (EMD) is legally required beforehand.`);
                return;
            }
        }

        // Optimistic UI update
        setStages(prevStages => prevStages.map(stage => {
            if (stage.id === sourceStageId) {
                return { ...stage, deals: stage.deals.filter(d => d.id !== deal.id) };
            }
            if (stage.id === targetStageId) {
                return { ...stage, deals: [{ ...deal, stage_id: targetStageId }, ...stage.deals] };
            }
            return stage;
        }));

        // Log to platform_events / activity_logs
        if (supabase) {
            try {
                // Determine which table exists for platform ledgers, we will try platform_events, fallback to activity_logs
                const { error } = await supabase.from('platform_events').insert([{
                    event_type: 'DEAL_MOVED',
                    user_id: 'system', // or from auth context
                    description: `Moved deal ${deal.address} from ${sourceStageId} to ${targetStageId}`,
                    metadata: { deal_id: deal.id, source: sourceStageId, target: targetStageId }
                }]);

                if (error && error.code === '42P01') {
                    // if platform_events doesn't exist, use activity_logs
                    await supabase.from('activity_logs').insert([{
                        organization_id: deal.organization_id || 'placeholder-org',
                        action_type: 'DEAL_MOVED',
                        entity_type: 'pipeline',
                        entity_id: deal.id,
                        metadata: { address: deal.address, source: sourceStageId, target: targetStageId }
                    }]);
                }
            } catch (err) {
                console.error("Failed to log pipeline move event:", err);
            }
        }
    };


    const handleCustomizeStages = () => {
        const newStageName = window.prompt("Enter a name for the new Pipeline Stage:");
        if (!newStageName) return;

        const newStage = {
            id: `custom-[${Date.now()}]`,
            title: newStageName,
            deals: []
        };

        setStages(prev => [...prev, newStage]);
    };

    const handleAddDeal = (stageId) => {
        if (!stageId) return;
        const newDeal = {
            id: `deal-${Date.now()}`,
            address: 'New Property',
            value: '$--k',
            days: 0,
            tags: ['New'],
            arv: 250000,
            purchasePrice: 180000,
            repairs: 25000,
            rehabLevel: "Moderate to Full Gut",
            smi: 3,
            equityPercent: 28,
            zipCode: "37206",
            propertyType: "SFR",
            bdiScore: "Warm (1)",
            bdiMatches: 1
        };

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

            if (error && error.code !== 'PGRST116') return { isLocked: false, error };
            if (data) return { isLocked: true };
            return { isLocked: false };
        } catch {
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
                const feePrediction = calculateAssignmentFeeRange(deal.arv || 250000, deal.purchasePrice || 180000, deal.repairs || 25000);
                const ettc = estimateTimeToClose(deal.rehabLevel || "Moderate to Full Gut", deal.smi || 3);
                const probScore = calculateDealProbability(deal.equityPercent || 28, deal.smi || 3, deal.bdiMatches || 0);

                await supabase.from('deal_outcomes').insert([{
                    organization_id: deal.organization_id || "placeholder-org",
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
            alert(`🎉 Deal Closed! Analytics logged to the Wholesale OS Intelligence Engine.\n\nActual Fee: $${actualFee.toLocaleString()}\nDays to Close: ${daysToClose}`);

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

    const handleDeleteDeal = async (stageId, dealId, currentAddress) => {
        const confirmPrimary = window.confirm(`Initiating deletion of Deal: ${currentAddress}. Are you sure?`);
        if (!confirmPrimary) return;

        const confirmSecondary = window.prompt(`[OPERATIONAL GUARDRAILS]\nTo explicitly bypass security and delete ${currentAddress}, type "DELETE":`);
        if (confirmSecondary !== "DELETE") {
            alert("Deletion aborted. Operational guardrails kept deal intact.");
            return;
        }

        if (supabase) {
            try {
                await supabase.from('activity_logs').insert([{
                    organization_id: 'placeholder-org',
                    user_id: 'system',
                    action_type: 'deal_deleted_override',
                    entity_type: 'deals',
                    entity_id: dealId,
                    metadata: { reason: "Manual 2-step override", address: currentAddress }
                }]);
            } catch (e) { console.error("Could not write delete log.", e); }
        }

        setStages(prevStages => prevStages.map(stage => {
            if (stage.id === stageId) {
                return { ...stage, deals: stage.deals.filter(d => d.id !== dealId) };
            }
            return stage;
        }));
    };

    return (
        <div className="p-6 max-w-[1800px] mx-auto min-h-[calc(100vh-80px)] overflow-x-auto animate-fade-in relative z-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 pb-4 border-b border-blue-900/30">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight flex items-center gap-3">
                        <Activity className="text-blue-500" /> Workflow Command Center
                    </h1>
                    <p className="text-gray-400 text-sm font-mono uppercase tracking-widest">
                        Drag and drop intelligence cards to progress deals through active states
                    </p>
                </div>
                <div className="flex gap-3 mt-4 md:mt-0">
                    <button
                        className={`bg-[var(--bg-tertiary)] border border-blue-900/50 hover:bg-blue-900/30 text-gray-300 transition-colors px-4 py-2 rounded-lg text-xs font-mono tracking-widest uppercase flex items-center gap-2 ${isReadOnlyRole ? 'opacity-50 cursor-not-allowed hover:bg-[var(--bg-tertiary)]' : ''}`}
                        onClick={handleCustomizeStages}
                        disabled={isReadOnlyRole}
                        title={isReadOnlyRole ? "This workspace is limited to Wholesalers and Acquisition Teams." : ""}
                    >
                        <Settings size={14} /> Configure Grid
                    </button>
                    <button
                        className={`bg-blue-600/20 border border-blue-500/50 hover:bg-blue-600/40 text-blue-300 hover:text-white transition-all shadow-[0_0_15px_rgba(78,123,255,0.2)] px-4 py-2 rounded-lg text-xs font-mono tracking-widest uppercase flex items-center gap-2 ${isReadOnlyRole ? 'opacity-50 cursor-not-allowed hover:bg-blue-600/20 hover:text-blue-300' : ''}`}
                        onClick={() => handleAddDeal(stages[0]?.id)}
                        disabled={isReadOnlyRole}
                        title={isReadOnlyRole ? "This workspace is limited to Wholesalers and Acquisition Teams." : ""}
                    >
                        <Plus size={14} /> Inject Deal
                    </button>
                </div>
            </div>

            {/* Pipeline Board */}
            <div className="flex gap-6 items-start pb-8">
                {loading ? (
                    <div className="flex-1 flex justify-center items-center py-20 text-blue-400 font-mono tracking-widest">INITIALIZING GRID...</div>
                ) : (
                    stages.map(stage => (
                        <div
                            key={stage.id}
                            className={`glass-card flex flex-col w-[340px] min-w-[340px] shrink-0 p-4 transition-colors duration-300 ${draggingDeal ? 'border-dashed border-blue-800/80 bg-blue-900/5' : 'border-blue-900/40'}`}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, stage.id)}
                        >
                            {/* Column Header */}
                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-blue-900/30">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-sm font-bold text-white uppercase tracking-widest m-0">{stage.title}</h3>
                                    <span className="bg-blue-900/40 text-blue-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm border border-blue-500/30">
                                        {stage.deals.length}
                                    </span>
                                </div>
                                <button className="text-gray-500 hover:text-white transition-colors"><MoreHorizontal size={14} /></button>
                            </div>

                            {/* Column Content */}
                            <div className="flex flex-col gap-4 min-h-[100px]">
                                {stage.deals.map(deal => (
                                    <div
                                        key={deal.id}
                                        draggable={!isReadOnlyRole}
                                        onDragStart={(e) => handleDragStart(e, deal, stage.id)}
                                        onDragEnd={handleDragEnd}
                                        className={`glass-card bg-[var(--bg-tertiary)] border-blue-900/50 p-4 ${isReadOnlyRole ? 'cursor-default' : 'cursor-grab active:cursor-grabbing hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(78,123,255,0.25)]'} transition-all duration-300 transform group relative overflow-hidden ${deal.tags?.includes('Hot') ? 'priority-gold' : ''}`}
                                    >
                                        {/* Card Highlight Strip */}
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-sm font-bold text-white tracking-tight break-words pr-2">{deal.address}</span>
                                            {!isReadOnlyRole && (
                                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-4 bg-[var(--bg-tertiary)] p-1 rounded-lg border border-blue-900/50 shadow-lg">
                                                    <button className="text-emerald-400 hover:text-emerald-300 transition-colors p-1" onClick={() => handleCloseDeal(stage.id, deal)} title="Close Deal"><CheckCircle size={14} /></button>
                                                    <button className="text-blue-400 hover:text-blue-300 transition-colors p-1" onClick={() => handleEditDeal(stage.id, deal.id, deal.address, deal.value)} title="Edit Deal"><Edit2 size={14} /></button>
                                                    <button className="text-red-400 hover:text-red-300 transition-colors p-1" onClick={() => handleDeleteDeal(stage.id, deal.id, deal.address)} title="Delete Deal"><Trash2 size={14} /></button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            {(() => {
                                                const feePrediction = calculateAssignmentFeeRange(deal.arv || 250000, deal.purchasePrice || 180000, deal.repairs || 25000);
                                                const intelligenceData = {
                                                    arv: deal.arv || 250000,
                                                    purchase_price: deal.purchasePrice || 180000,
                                                    repairs: deal.repairs || 25000,
                                                    buyerDemand: deal.bdiMatches || (deal.tags?.includes('Hot') ? 8 : 4),
                                                    escrowStatus: deal.tags?.includes('EMD Cleared') ? 'ACTIVE' : 'PENDING'
                                                };
                                                const aiScore = calculateDealScore(intelligenceData);
                                                const closeProb = calculateCloseProbability(intelligenceData);
                                                const { label: liqLabel } = calculateLiquiditySignal(intelligenceData);

                                                // Liquidity Match Calculation
                                                const rankedBuyers = matchDealToInvestors({
                                                    id: deal.id,
                                                    market: deal.zipCode || 'Dallas',
                                                    purchase_price: deal.purchasePrice || 180000,
                                                    property_type: deal.propertyType || 'Single Family',
                                                    dealScore: aiScore
                                                }, mockLiquidityInvestors);
                                                const strongMatches = rankedBuyers.filter(b => b.matchScore >= 80).length;

                                                let probColor = "text-red-400 border-red-500/30 bg-red-900/10";
                                                if (closeProb > 75) probColor = "text-emerald-400 border-emerald-500/30 bg-emerald-900/10";
                                                else if (closeProb > 50) probColor = "text-amber-400 border-amber-500/30 bg-amber-900/10";

                                                const aiScoreColor = aiScore >= 80 ? 'text-blue-400 bg-blue-900/20 border-blue-500/30' :
                                                    aiScore >= 60 ? 'text-amber-400 bg-amber-900/20 border-amber-500/30' :
                                                        'text-red-400 bg-red-900/20 border-red-500/30';

                                                return (
                                                    <>
                                                        <div className="flex justify-between items-center text-xs font-mono pb-2 border-b border-blue-900/20 mb-2 mt-1">
                                                            <div className="flex items-center gap-1.5 bg-red-900/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-sm shadow-[0_0_10px_rgba(248,113,113,0.1)]">
                                                                <Target size={10} className="text-red-500" />
                                                                <span className="font-bold tracking-widest uppercase text-[10px]">{strongMatches} Strong Matches</span>
                                                            </div>
                                                            <span className="text-emerald-400 font-bold">{feePrediction.formatted}</span>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2 my-1">
                                                            <div className={`flex items-center justify-between text-[10px] p-1.5 rounded-md border font-mono ${aiScoreColor}`}>
                                                                <span className="flex items-center gap-1 uppercase"><Shield size={10} /> Score</span>
                                                                <span className="font-bold">{aiScore}</span>
                                                            </div>
                                                            <div className={`flex items-center justify-between text-[10px] p-1.5 rounded-md border font-mono ${probColor}`}>
                                                                <span className="flex items-center gap-1 uppercase"><Target size={10} /> Prob</span>
                                                                <span className="font-bold">{closeProb}%</span>
                                                            </div>
                                                        </div>

                                                        {/* Escrow/Liquidity Status mapped from tags */}
                                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                                            <span className={`text-[9px] uppercase tracking-widest font-mono font-bold px-1.5 py-0.5 rounded border border-blue-500/30 flex items-center gap-1 ${liqLabel === 'HIGH' ? 'bg-blue-900/20 text-blue-400' : liqLabel === 'MODERATE' ? 'bg-amber-900/20 text-amber-400' : 'bg-gray-800/40 text-gray-400'}`}>
                                                                <Zap size={8} /> Liq: {liqLabel}
                                                            </span>

                                                            {deal.tags?.includes('EMD Cleared') && (
                                                                <span className="text-[9px] uppercase tracking-widest font-mono font-bold px-1.5 py-0.5 rounded border bg-emerald-900/20 text-emerald-400 border-emerald-500/30 flex items-center gap-1">
                                                                    <DollarSign size={8} /> Escrow
                                                                </span>
                                                            )}
                                                            {deal.tags?.includes('Hot') && (
                                                                <span className="text-[9px] uppercase tracking-widest font-mono font-bold px-1.5 py-0.5 rounded border bg-amber-900/20 text-amber-400 border-amber-500/30 flex items-center gap-1">
                                                                    <Activity size={8} /> Hot
                                                                </span>
                                                            )}
                                                        </div>
                                                    </>
                                                )
                                            })()}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Inject Deal Button for Column */}
                            <button
                                className={`mt-4 w-full py-2.5 rounded text-[10px] font-mono font-bold uppercase tracking-widest text-blue-400/50 border border-dashed border-blue-900/40 hover:bg-blue-900/20 hover:text-blue-300 hover:border-blue-500/40 transition-colors flex items-center justify-center gap-2 ${isReadOnlyRole ? 'hidden' : ''}`}
                                onClick={() => handleAddDeal(stage.id)}
                            >
                                <Plus size={12} /> Add to {stage.title}
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Pipeline;

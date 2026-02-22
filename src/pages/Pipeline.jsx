import React, { useState, useEffect } from 'react';
import { Plus, Settings, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
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
                    // For the sake of the OS prototype, we group them if they exist
                    const groupedStages = initialStages.map(stage => {
                        const stageDeals = data.filter(d => d.stage_id === stage.id);
                        return { ...stage, deals: stageDeals.length > 0 ? stageDeals : stage.deals };
                    });
                    setStages(groupedStages);
                }
                // If empty or no table, `stages` remains `initialStages` so UI doesn't break
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
            tags: ['New']
        };

        const updatedStages = stages.map(stage => {
            if (stage.id === stageId) {
                // Prepend the new deal to the top of the column
                return { ...stage, deals: [newDeal, ...stage.deals] };
            }
            return stage;
        });
        setStages(updatedStages);
    };

    const handleEditDeal = (stageId, dealId, currentAddress, currentValue) => {
        const newAddress = window.prompt("Enter new address:", currentAddress);
        if (!newAddress) return;

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
                                                <button className="icon-btn-small" onClick={() => handleEditDeal(stage.id, deal.id, deal.address, deal.value)} title="Edit Deal"><Edit2 size={14} /></button>
                                                <button className="icon-btn-small text-danger" onClick={() => handleDeleteDeal(stage.id, deal.id, deal.address)} title="Delete Deal"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                        <div className="deal-metrics flex-between">
                                            <span className="deal-value">{deal.value} Fee</span>
                                            <span className="deal-days">{deal.days} days in stage</span>
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

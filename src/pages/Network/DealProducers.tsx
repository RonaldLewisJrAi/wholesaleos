import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Cpu, Award } from 'lucide-react';
import { getTopDealProducers, DealProducerProfile } from '../../services/networkService';

export const DealProducers = () => {
    const [producers, setProducers] = useState<DealProducerProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducers = async () => {
            setLoading(true);
            try {
                const data = await getTopDealProducers(10);
                setProducers(data);
            } catch (err) {
                console.error('Producers Fetch Error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducers();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!producers.length) {
        return (
            <div className="text-center p-12 text-slate-500">
                <Cpu size={48} className="mx-auto mb-4 opacity-30" />
                <p>No Deal Analytics recorded in the active tenant network yet.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 cursor-default">
            {producers.map((producer, i) => (
                <div key={producer.wholesaler_id} className="relative p-6 bg-slate-900/50 rounded-xl border border-slate-700/50 hover:border-emerald-500/30 transition-colors overflow-hidden group">

                    {/* Background Intelligence Gradient Node */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors" />

                    <div className="relative z-10 flex justify-between items-start mb-4">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-slate-400 font-mono text-sm border border-slate-700/50">
                            #{i + 1}
                        </div>
                        <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold">
                            <TrendingUp size={12} />
                            Avg Score: {producer.avg_deal_score}
                        </div>
                    </div>

                    <div className="relative z-10">
                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">
                            {producer.wholesaler_name}
                        </h3>
                        <p className="text-sm text-slate-400 flex items-center gap-2 mb-4">
                            <Target size={14} /> Total Sourced: {producer.total_deals}
                        </p>
                    </div>

                    {/* Deal Score Visual Gauge */}
                    <div className="relative z-10 w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${producer.avg_deal_score >= 85 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                                    producer.avg_deal_score >= 70 ? 'bg-gradient-to-r from-blue-500 to-indigo-400' :
                                        'bg-slate-500'
                                }`}
                            style={{ width: `${producer.avg_deal_score}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

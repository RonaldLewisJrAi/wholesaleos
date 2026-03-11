import React, { useState } from 'react';
import { MapPin, TrendingUp, DollarSign, Hammer, Activity, Droplets, Target } from 'lucide-react';

const mockDeals = [
    {
        id: '1',
        address: '1234 Sapphire Lane, Austin TX',
        dealScore: 94,
        arv: 450000,
        repairs: 45000,
        assignmentFee: 15000,
        demandSignal: 'High',
        liquidityIndex: 88,
        image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=400&h=250',
    },
    {
        id: '2',
        address: '890 Neon Avenue, Miami FL',
        dealScore: 88,
        arv: 620000,
        repairs: 80000,
        assignmentFee: 25000,
        demandSignal: 'Very High',
        liquidityIndex: 92,
        image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=400&h=250',
    },
    {
        id: '3',
        address: '445 Foundry Street, Seattle WA',
        dealScore: 76,
        arv: 850000,
        repairs: 120000,
        assignmentFee: 40000,
        demandSignal: 'Medium',
        liquidityIndex: 65,
        image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=400&h=250',
    },
    {
        id: '4',
        address: '221 Vertex Boulevard, Denver CO',
        dealScore: 91,
        arv: 510000,
        repairs: 35000,
        assignmentFee: 18000,
        demandSignal: 'High',
        liquidityIndex: 84,
        image: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&q=80&w=400&h=250',
    },
    {
        id: '5',
        address: '77 Quantum Drive, Raleigh NC',
        dealScore: 82,
        arv: 380000,
        repairs: 55000,
        assignmentFee: 12000,
        demandSignal: 'Medium',
        liquidityIndex: 71,
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=400&h=250',
    },
    {
        id: '6',
        address: '109 Palantir Way, Palo Alto CA',
        dealScore: 98,
        arv: 1250000,
        repairs: 150000,
        assignmentFee: 75000,
        demandSignal: 'Extreme',
        liquidityIndex: 96,
        image: 'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?auto=format&fit=crop&q=80&w=400&h=250',
    }
];

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-blue-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
};

const MarketplaceFeed = () => {
    const [deals] = useState(mockDeals);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <header className="mb-8 flex justify-between items-end border-b border-blue-900/40 pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Target className="text-blue-500" size={32} />
                        Intelligence Grid
                    </h1>
                    <p className="text-blue-400/70 mt-2 font-mono text-sm tracking-widest uppercase">
                        Live Deal Match Feed / Automated Deal Analysis
                    </p>
                </div>

                <div className="flex gap-4">
                    <button className="glass-card px-4 py-2 text-sm text-blue-300 hover:text-white transition-colors flex items-center gap-2">
                        <Activity size={16} /> Filters
                    </button>
                    <button className="bg-blue-600/20 border border-blue-500/50 hover:bg-blue-600/40 text-blue-300 hover:text-white px-4 py-2 rounded-lg text-sm transition-all shadow-[0_0_15px_rgba(78,123,255,0.2)]">
                        Refresh Signals
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {deals.map(deal => (
                    <div
                        key={deal.id}
                        className="glass-card overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(78,123,255,0.4)] hover:border-blue-500/60 cursor-pointer flex flex-col group"
                    >
                        {/* Image Header */}
                        <div className="h-40 w-full relative overflow-hidden">
                            <div className="absolute inset-0 bg-blue-900/40 mix-blend-overlay group-hover:bg-transparent transition-all z-10" />
                            <img
                                src={deal.image}
                                alt={deal.address}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute top-3 right-3 z-20 glass-card bg-black/60 px-2 py-1 flex items-center gap-1 font-mono text-xs border-blue-500/30 font-bold">
                                <span className={getScoreColor(deal.dealScore)}>
                                    SCORE: {deal.dealScore}
                                </span>
                            </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-5 flex-1 flex flex-col">
                            <h3 className="text-white font-medium text-lg leading-tight mb-4 flex items-start gap-2">
                                <MapPin className="text-blue-500 shrink-0 mt-0.5" size={16} />
                                {deal.address}
                            </h3>

                            <div className="grid grid-cols-2 gap-4 mb-5">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono flex items-center gap-1">
                                        <TrendingUp size={10} /> ARV
                                    </p>
                                    <p className="text-blue-100 font-semibold">{formatCurrency(deal.arv)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono flex items-center gap-1">
                                        <Hammer size={10} /> Repairs
                                    </p>
                                    <p className="text-blue-100 font-semibold">{formatCurrency(deal.repairs)}</p>
                                </div>
                            </div>

                            <div className="bg-[#050816]/60 border border-blue-900/40 rounded-lg p-3 mb-5 flex justify-between items-center">
                                <div className="text-[10px] text-blue-400 capitalize tracking-widest font-mono">
                                    Assignment Fee
                                </div>
                                <div className="font-bold text-emerald-400 flex items-center tracking-wide">
                                    <DollarSign size={14} className="text-emerald-500" />
                                    {formatCurrency(deal.assignmentFee).replace('$', '')}
                                </div>
                            </div>

                            {/* bottom indicators */}
                            <div className="mt-auto pt-4 border-t border-blue-900/30 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Activity size={12} className="text-purple-400" />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-gray-500 font-mono tracking-wider">DEMAND</span>
                                        <span className="text-xs text-white uppercase">{deal.demandSignal}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-right">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-gray-500 font-mono tracking-wider">LIQUIDITY</span>
                                        <span className={`text-xs uppercase font-bold ${deal.liquidityIndex > 80 ? 'text-blue-400' : 'text-blue-200'}`}>
                                            {deal.liquidityIndex} IDX
                                        </span>
                                    </div>
                                    <Droplets size={12} className="text-cyan-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MarketplaceFeed;

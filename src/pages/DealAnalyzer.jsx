import React, { useState } from 'react';
import { Calculator, TrendingUp, DollarSign, Hammer, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const getProfitColor = (profit) => {
    if (profit > 50000) return 'text-emerald-400';
    if (profit > 0) return 'text-blue-400';
    return 'text-red-400';
};

const getRiskColor = (riskLabel) => {
    switch (riskLabel.toLowerCase()) {
        case 'low': return 'text-blue-400';
        case 'moderate': return 'text-amber-400';
        case 'high': return 'text-red-400';
        default: return 'text-gray-400';
    }
};

const DealAnalyzer = () => {
    // Mock State for the interactive calculator
    const [inputs, setInputs] = useState({
        purchasePrice: 250000,
        arv: 400000,
        repairCost: 55000,
        closingCosts: 12000,
        holdingCosts: 8000,
        assignmentFee: 15000
    });

    // Calculated derived metrics
    const totalInvestment = inputs.purchasePrice + inputs.repairCost + inputs.closingCosts + inputs.holdingCosts;
    const grossProfit = inputs.arv - totalInvestment;
    const netProfit = grossProfit - inputs.assignmentFee; // From Wholesaler perspective
    const roi = (netProfit / totalInvestment) * 100;

    // AI Mock Intelligence
    const dealScore = 88;
    const riskLevel = 'Moderate';
    const mao = inputs.arv * 0.70 - inputs.repairCost; // Standard 70% rule

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInputs(prev => ({
            ...prev,
            [name]: Number(value) || 0
        }));
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <header className="mb-8 flex justify-between items-end border-b border-blue-900/40 pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Calculator className="text-blue-500" size={32} />
                        Deal Intelligence Analyzer
                    </h1>
                    <p className="text-blue-400/70 mt-2 font-mono text-sm tracking-widest uppercase">
                        Real-Time Underwriting & Risk Evaluation Terminal
                    </p>
                </div>

                <div className="flex gap-4">
                    <button className="glass-card px-4 py-2 text-sm text-blue-300 hover:text-white transition-colors flex items-center gap-2">
                        <Activity size={16} /> Load Comps
                    </button>
                    <button className="bg-emerald-600/20 border border-emerald-500/50 hover:bg-emerald-600/40 text-emerald-300 hover:text-white px-6 py-2 rounded-lg text-sm transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] font-bold tracking-wide">
                        Generate Packet
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT COL: Inputs */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-card p-5 group transition-all duration-300 hover:border-blue-500/50">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-blue-900/30 pb-2">
                            <DollarSign className="text-blue-400" size={18} />
                            Financial Inputs
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-1">Purchase Price</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono">$</span>
                                    <input
                                        type="number"
                                        name="purchasePrice"
                                        value={inputs.purchasePrice}
                                        onChange={handleInputChange}
                                        className="w-full bg-black/40 border border-blue-900/50 rounded-md py-2 pl-8 pr-3 text-white font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-bold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-1">After Repair Value (ARV)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono">$</span>
                                    <input
                                        type="number"
                                        name="arv"
                                        value={inputs.arv}
                                        onChange={handleInputChange}
                                        className="w-full bg-black/40 border border-blue-900/50 rounded-md py-2 pl-8 pr-3 text-white font-mono focus:border-blue-500 focus:outline-none transition-all font-bold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-1">Repair Cost Est.</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono">$</span>
                                    <input
                                        type="number"
                                        name="repairCost"
                                        value={inputs.repairCost}
                                        onChange={handleInputChange}
                                        className="w-full bg-black/40 border border-blue-900/50 rounded-md py-2 pl-8 pr-3 text-white font-mono focus:border-blue-500 focus:outline-none transition-all font-bold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-1">Closing</label>
                                    <input
                                        type="number"
                                        name="closingCosts"
                                        value={inputs.closingCosts}
                                        onChange={handleInputChange}
                                        className="w-full bg-black/40 border border-blue-900/50 rounded-md py-2 px-3 text-white font-mono focus:border-blue-500 focus:outline-none transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-1">Holding</label>
                                    <input
                                        type="number"
                                        name="holdingCosts"
                                        value={inputs.holdingCosts}
                                        onChange={handleInputChange}
                                        className="w-full bg-black/40 border border-blue-900/50 rounded-md py-2 px-3 text-white font-mono focus:border-blue-500 focus:outline-none transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="block text-[10px] text-blue-400 uppercase tracking-widest font-mono mb-1">Your Assignment Fee</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-mono font-bold">$</span>
                                    <input
                                        type="number"
                                        name="assignmentFee"
                                        value={inputs.assignmentFee}
                                        onChange={handleInputChange}
                                        className="w-full bg-emerald-900/10 border border-emerald-500/30 rounded-md py-3 pl-8 pr-3 text-emerald-400 font-mono focus:border-emerald-500 focus:outline-none transition-all font-bold text-lg"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COL: Outputs & Intelligence */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Top Row: Intelligence & Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div className="glass-card p-5 group transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(78,123,255,0.3)] hover:border-blue-500/50">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-blue-900/30 pb-2">
                                <Activity className="text-purple-400" size={18} />
                                AI Intelligence
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-black/40 rounded-lg p-3 border border-blue-900/30">
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-1">Deal Score</div>
                                    <div className={`text-3xl font-mono font-bold ${dealScore >= 80 ? 'text-blue-400' : 'text-yellow-400'}`}>
                                        {dealScore}
                                    </div>
                                </div>
                                <div className="bg-black/40 rounded-lg p-3 border border-blue-900/30">
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-1">Risk Level</div>
                                    <div className={`text-xl font-mono font-bold mt-1 flex items-center gap-2 ${getRiskColor(riskLevel)}`}>
                                        <AlertTriangle size={18} /> {riskLevel}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 bg-blue-900/10 border border-blue-500/20 rounded-lg p-4">
                                <div className="text-[10px] text-blue-300 uppercase tracking-widest font-mono mb-2 flex items-center gap-2">
                                    <ShieldCheck size={14} /> Maximum Allowable Offer (70% Rule)
                                </div>
                                <div className="text-2xl font-mono font-bold text-white">
                                    {formatCurrency(mao)}
                                </div>
                                <div className="text-xs text-blue-400/50 font-mono mt-1">
                                    Based on standard fix-and-flip underwriting.
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-5 group transition-all duration-300 hover:border-blue-500/50 cursor-pointer">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-blue-900/30 pb-2">
                                <Hammer className="text-amber-400" size={18} />
                                Capital Required
                            </h3>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <span className="text-xs text-gray-400 font-mono">Purchase Price</span>
                                    <span className="text-sm text-white font-mono">{formatCurrency(inputs.purchasePrice)}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <span className="text-xs text-gray-400 font-mono">Repairs</span>
                                    <span className="text-sm text-amber-300 font-mono">{formatCurrency(inputs.repairCost)}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <span className="text-xs text-gray-400 font-mono">Hold & Close</span>
                                    <span className="text-sm text-white font-mono">{formatCurrency(inputs.closingCosts + inputs.holdingCosts)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-sm text-blue-300 font-mono uppercase font-bold tracking-wider">Total Cash Needed</span>
                                    <span className="text-lg text-blue-400 font-mono font-bold">{formatCurrency(totalInvestment)}</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Bottom Row: Profit Outcome */}
                    <div className="glass-card p-6 group transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:border-emerald-500/40 relative overflow-hidden">

                        {/* Background glow effect */}
                        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-700"></div>

                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-emerald-900/30 pb-2 relative z-10">
                            <TrendingUp className="text-emerald-400" size={18} />
                            Projected Profit Outcome
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                            <div className="bg-black/40 rounded-lg p-4 border border-white/5 flex flex-col justify-center">
                                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-mono mb-2">Gross Flip Profit</div>
                                <div className="text-2xl font-mono text-white">
                                    {formatCurrency(grossProfit)}
                                </div>
                            </div>

                            <div className="bg-emerald-900/10 rounded-lg p-4 border border-emerald-500/20 flex flex-col justify-center scale-105 shadow-lg">
                                <div className="text-[10px] text-emerald-400 uppercase tracking-widest font-mono mb-2 font-bold">Net Investor Profit</div>
                                <div className={`text-4xl font-mono font-bold tracking-tight ${getProfitColor(netProfit)}`}>
                                    {formatCurrency(netProfit)}
                                </div>
                            </div>

                            <div className="bg-black/40 rounded-lg p-4 border border-white/5 flex flex-col justify-center">
                                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-mono mb-2">Return on Investment (ROI)</div>
                                <div className={`text-2xl font-mono font-bold ${roi >= 15 ? 'text-blue-400' : 'text-yellow-400'}`}>
                                    {roi.toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default DealAnalyzer;

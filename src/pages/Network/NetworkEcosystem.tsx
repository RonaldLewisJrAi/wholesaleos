import React, { useState, useEffect } from 'react';
import { Target, Users, GitMerge, Award, TrendingUp, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import { TrustLeaderboard } from './TrustLeaderboard';
import { DealProducers } from './DealProducers';
import { GamificationPanel } from './GamificationPanel';

export const NetworkEcosystem = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'leaderboard' | 'producers' | 'graph'>('leaderboard');
    const [currentPersona, setCurrentPersona] = useState<'WHOLESALER' | 'INVESTOR' | 'REALTOR'>('WHOLESALER');

    useEffect(() => {
        // Default the tab based on incoming persona. Investors want to see Producers (Wholesalers). Wholesalers want to see Investors.
        if (user?.primary_persona === 'WHOLESALER') {
            setCurrentPersona('INVESTOR');
        } else if (user?.primary_persona === 'INVESTOR') {
            setCurrentPersona('WHOLESALER');
            setActiveTab('producers');
        } else {
            setCurrentPersona('WHOLESALER');
        }
    }, [user]);

    return (
        <div className="p-8 max-w-7xl mx-auto pb-32">
            <header className="mb-8">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2 flex items-center gap-3">
                            <ShieldCheck className="text-emerald-500" size={32} />
                            Ecosystem Intelligence
                        </h1>
                        <p className="text-slate-400">
                            Discover top producers, expand your trust network, and unlock exclusive platform tiers.
                        </p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT COLLUMN: Main Interactive Dashboards */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Navigation Tabs */}
                    <div className="flex bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50 w-max">
                        <button
                            onClick={() => setActiveTab('leaderboard')}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'leaderboard'
                                ? 'bg-emerald-500/20 text-emerald-400 shadow-sm'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                }`}
                        >
                            <Award size={16} /> Trust Leaderboard
                        </button>
                        <button
                            onClick={() => setActiveTab('producers')}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'producers'
                                ? 'bg-emerald-500/20 text-emerald-400 shadow-sm'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                }`}
                        >
                            <TrendingUp size={16} /> Top Deal Producers
                        </button>
                        <button
                            onClick={() => setActiveTab('graph')}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'graph'
                                ? 'bg-emerald-500/20 text-emerald-400 shadow-sm'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                }`}
                        >
                            <GitMerge size={16} /> Network Graph
                        </button>
                    </div>

                    {/* Interactive Tab Routing */}
                    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden min-h-[500px]">
                        {activeTab === 'leaderboard' && (
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Target className="text-emerald-500" size={20} />
                                        Platform Trust Rankings
                                    </h2>
                                    <select
                                        aria-label="Select Persona"
                                        title="Select Persona"
                                        value={currentPersona}
                                        onChange={(e) => setCurrentPersona(e.target.value as any)}
                                        className="bg-slate-900 border border-slate-700 rounded-lg text-sm text-white px-3 py-1.5 focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="INVESTOR">Top Investors</option>
                                        <option value="WHOLESALER">Top Wholesalers</option>
                                        <option value="REALTOR">Top Realtors</option>
                                    </select>
                                </div>
                                <TrustLeaderboard persona={currentPersona} />
                            </div>
                        )}

                        {activeTab === 'producers' && (
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <TrendingUp className="text-emerald-500" size={20} />
                                        Highest Quality Deal Flow
                                    </h2>
                                </div>
                                <DealProducers />
                            </div>
                        )}

                        {activeTab === 'graph' && (
                            <div className="p-12 flex flex-col items-center justify-center text-center h-[400px]">
                                <GitMerge size={48} className="text-slate-600 mb-4 mx-auto" />
                                <h3 className="text-xl font-bold text-slate-300 mb-2">Network Graph Visualization</h3>
                                <p className="text-slate-500 max-w-md mx-auto">
                                    The interactive connection map requires the d3.js or recharts library implementation. Coming in Phase 55.2.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: User Specific Gamification Panel */}
                <div className="space-y-6">
                    <GamificationPanel />

                    {/* Extra Promotional Widget */}
                    <div className="bg-gradient-to-br from-emerald-900/40 to-slate-800/80 border border-emerald-500/20 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <Users className="text-emerald-400" size={24} />
                            <h3 className="font-bold text-white">Expand Your Network</h3>
                        </div>
                        <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                            Refer new investors and wholesalers to the platform. Both parties receive a +5 Trust Score boost upon their first completed transaction!
                        </p>
                        <button className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors">
                            Copy Referral Link
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

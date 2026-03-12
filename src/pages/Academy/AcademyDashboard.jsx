import React from 'react';
import { useSubscription } from '../../contexts/useSubscription';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle, Award, PlayCircle, ChevronRight, Lock, Target, Zap, GraduationCap } from 'lucide-react';

const MODULES = [
    { id: 'foundations', title: 'Stage 1: Foundations', description: 'Core concepts, legalities, terminology, and what wholesaling is NOT.', duration: '45 mins', status: 'COMPLETED' },
    { id: 'finding-deals', title: 'Stage 2: Finding Deals', description: 'Acquisition strategies, D4D, cold calling scripts, and lead generation.', duration: '60 mins', status: 'COMPLETED' },
    { id: 'deal-analysis', title: 'Stage 3: Deal Analysis', description: 'ARV estimation, repair calculations, MAO, and ROI math.', duration: '90 mins', status: 'IN_PROGRESS' },
    { id: 'contracting-deals', title: 'Stage 4: Contracting Deals', description: 'Purchase agreements, Option Contracts, and Proof of Control.', duration: '60 mins', status: 'LOCKED' },
    { id: 'selling-investors', title: 'Stage 5: Selling to Investors', description: 'Building buyer lists, dispatching deals, and using the Liquidity Engine.', duration: '75 mins', status: 'LOCKED' },
    { id: 'closing-deals', title: 'Stage 6: Closing Deals', description: 'Tri-party verification, working with Title Companies, and escrow flow.', duration: '45 mins', status: 'LOCKED' },
];

export default function AcademyDashboard() {
    const { subscriptionTier } = useSubscription();
    const navigate = useNavigate();

    // The Academy is accessible for BASIC, PRO, and SUPER_ADMIN.
    if (subscriptionTier === 'DEMO') {
        return (
            <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[70vh]">
                <div className="glass-card p-12 text-center max-w-lg border-blue-500/30 shadow-[0_0_30px_rgba(78,123,255,0.1)]">
                    <Lock className="mx-auto text-blue-500 mb-6" size={48} />
                    <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">Academy Locked</h1>
                    <p className="text-gray-400 font-mono mb-8 text-sm leading-relaxed">Upgrade to the $100 Basic Tier or higher to access the WholesaleOS Academy curriculum, the Deal Simulator sandbox, and to earn your Certification Badges.</p>
                    <button onClick={() => navigate('/settings')} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded uppercase font-bold tracking-widest font-mono text-sm transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                        Upgrade Account
                    </button>
                </div>
            </div>
        );
    }

    const completedCount = MODULES.filter(m => m.status === 'COMPLETED').length;
    const progressPercent = Math.round((completedCount / MODULES.length) * 100);

    return (
        <div className="p-8 animate-fade-in max-w-7xl mx-auto pb-12">
            <div className="flex justify-between items-end mb-8 border-b border-blue-900/40 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3 tracking-tight">
                        <BookOpen className="text-blue-500" size={32} />
                        WholesaleOS Academy
                    </h1>
                    <p className="text-gray-400 font-mono tracking-widest uppercase text-xs mt-2">
                        Integrated Real Estate Training & Mentorship
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-bold text-emerald-400 font-mono">{progressPercent}%</div>
                    <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Currculum Complete</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Stats Panel */}
                <div className="glass-card p-6 flex flex-col justify-between border-blue-900/30">
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2 text-blue-400">
                            <Target size={16} /> Learning Progress
                        </h3>
                        <div className="space-y-4 font-mono text-sm">
                            <div className="flex justify-between items-center bg-[var(--bg-tertiary)] p-3 rounded border border-blue-900/30">
                                <span className="text-gray-400">Completed Stages</span>
                                <span className="text-white font-bold">{completedCount} / 6</span>
                            </div>
                            <div className="flex justify-between items-center bg-[var(--bg-tertiary)] p-3 rounded border border-blue-900/30">
                                <span className="text-gray-400">Simulator Score</span>
                                <span className="text-amber-400 font-bold">Unranked</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-blue-900/40">
                        <span className="text-xs text-blue-300 font-mono bg-blue-900/20 px-3 py-1.5 rounded-full border border-blue-500/20">
                            Suggested: Continue Stage 3
                        </span>
                    </div>
                </div>

                {/* Certification Panel */}
                <div className="glass-card p-6 border-blue-900/30">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2 text-amber-400">
                        <Award size={16} /> Certification Status
                    </h3>

                    <div className="flex items-center gap-4 mb-4 opacity-50 grayscale pt-2">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-900 to-blue-600 flex items-center justify-center border-2 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                            <GraduationCap size={24} className="text-white" />
                        </div>
                        <div>
                            <div className="text-white font-bold font-mono text-sm">Academy Graduate</div>
                            <div className="text-xs text-gray-500 font-mono mt-1">Locked — Complete Curriculum</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 opacity-30 grayscale pt-2 border-t border-blue-900/30">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-900 to-emerald-600 flex items-center justify-center border-2 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                            <Award size={24} className="text-white" />
                        </div>
                        <div>
                            <div className="text-white font-bold font-mono text-sm">Certified Wholesaler</div>
                            <div className="text-xs text-gray-500 font-mono mt-1">Locked — Pass Simulator</div>
                        </div>
                    </div>
                </div>

                {/* Simulator Intro Panel */}
                <div className="glass-card p-6 border-emerald-900/30 bg-gradient-to-br from-emerald-900/10 to-[#050816] flex flex-col justify-between group cursor-pointer hover:border-emerald-500/50 transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]" onClick={() => navigate('/simulator')}>
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-3 flex items-center gap-2 text-emerald-400">
                            <Zap size={16} /> Deal Simulator
                        </h3>
                        <p className="text-gray-400 font-mono text-xs leading-relaxed mb-4">
                            Practice wholesaling in a safe, risk-free environment.
                            Simulate seller leads, analyze properties, generate mock contracts, and negotiate with virtual investors.
                        </p>
                    </div>
                    <div className="flex justify-between items-center text-emerald-400 font-mono text-sm group-hover:text-emerald-300 transition-colors">
                        <span className="font-bold tracking-widest uppercase flex items-center gap-2">Enter Simulator <PlayCircle size={16} /></span>
                        <ChevronRight size={18} />
                    </div>
                </div>
            </div>

            <h2 className="text-xl font-bold text-white mb-6 tracking-tight">Curriculum Modules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MODULES.map((mod, idx) => (
                    <div
                        key={mod.id}
                        onClick={() => mod.status !== 'LOCKED' ? navigate(`/academy/${mod.id}`) : null}
                        className={`glass-card p-6 flex gap-4 transition-all ${mod.status === 'LOCKED'
                            ? 'opacity-60 cursor-not-allowed border-blue-900/20'
                            : 'cursor-pointer hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-[0_8px_20px_rgba(59,130,246,0.1)]'
                            } ${mod.status === 'IN_PROGRESS' ? 'border-blue-500/40 ring-1 ring-blue-500/20' : ''}`}
                    >
                        <div className="shrink-0 mt-1">
                            {mod.status === 'COMPLETED' ? (
                                <CheckCircle className="text-emerald-500" size={24} />
                            ) : mod.status === 'IN_PROGRESS' ? (
                                <PlayCircle className="text-blue-400 animate-pulse" size={24} />
                            ) : (
                                <Lock className="text-gray-600" size={24} />
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className={`font-bold ${mod.status === 'LOCKED' ? 'text-gray-400' : 'text-white'}`}>{mod.title}</h3>
                                <span className="text-[10px] text-gray-500 font-mono tracking-widest">{mod.duration}</span>
                            </div>
                            <p className="text-sm text-gray-400 font-mono leading-relaxed">{mod.description}</p>

                            {mod.status === 'IN_PROGRESS' && (
                                <div className="mt-4 flex items-center gap-2 text-xs font-mono font-bold text-blue-400 tracking-widest uppercase">
                                    Resume Lesson <ChevronRight size={14} />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

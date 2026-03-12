import React, { useState } from 'react';
import { dealSimulatorService } from '../../services/dealSimulatorService';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Calculator, UserCheck, ShieldAlert, CheckCircle, Zap } from 'lucide-react';

export default function DealSimulator() {
    const navigate = useNavigate();
    const [step, setStep] = useState('INTRO'); // INTRO, LEAD, ANALYZE, RESULT
    const [lead, setLead] = useState(null);
    const [userArv, setUserArv] = useState('');
    const [userRepairs, setUserRepairs] = useState('');
    const [userOffer, setUserOffer] = useState('');
    const [results, setResults] = useState(null);

    const startSimulation = () => {
        const newLead = dealSimulatorService.generateMockLead();
        setLead(newLead);
        setStep('LEAD');
    };

    const submitAnalysis = () => {
        if (!userArv || !userRepairs || !userOffer) return;

        const evalResults = dealSimulatorService.evaluateAnalysis(
            lead,
            parseInt(userArv),
            parseInt(userRepairs),
            parseInt(userOffer)
        );

        setResults(evalResults);
        setStep('RESULT');
    };

    return (
        <div className="p-8 animate-fade-in max-w-5xl mx-auto pb-12">
            <button
                onClick={() => navigate('/academy')}
                className="flex items-center gap-2 text-gray-400 hover:text-white font-mono text-sm uppercase tracking-widest transition-colors mb-6"
            >
                <ArrowLeft size={16} /> Back to Dashboard
            </button>

            <div className="flex items-center gap-3 mb-8">
                <Zap className="text-emerald-500" size={32} />
                <h1 className="text-3xl font-bold text-white tracking-tight">Deal Simulator Engine</h1>
            </div>

            {step === 'INTRO' && (
                <div className="glass-card p-10 text-center border-emerald-900/30">
                    <h2 className="text-2xl font-bold text-white mb-4">Ready to test your skills?</h2>
                    <p className="text-gray-400 font-mono mb-8 max-w-2xl mx-auto leading-relaxed">
                        The Deal Simulator will generate a mock seller lead. You will need to review their situation, calculate the ARV, estimate repairs, and submit a Maximum Allowable Offer. Your performance will be scored.
                    </p>
                    <button
                        onClick={startSimulation}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded uppercase font-bold tracking-widest font-mono transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 mx-auto"
                    >
                        <Play size={18} /> Spawn Mock Lead
                    </button>
                </div>
            )}

            {step === 'LEAD' && lead && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="glass-card p-6 border-blue-900/30">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2 text-blue-400 border-b border-blue-900/30 pb-4">
                            <UserCheck size={16} /> Seller Intel
                        </h3>
                        <div className="space-y-6 font-mono text-sm text-gray-300">
                            <div>
                                <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Property</div>
                                <div className="font-bold text-white">{lead.address}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Asking Price</div>
                                <div className="font-bold text-red-400">${lead.askPrice.toLocaleString()}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Motivation</div>
                                <div className="leading-relaxed bg-[var(--bg-tertiary)] p-3 rounded border border-blue-900/30">{lead.motivation}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Timeline</div>
                                <div>{lead.timeline}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => setStep('ANALYZE')}
                            className="w-full mt-8 bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded uppercase font-bold tracking-widest font-mono text-xs transition-colors"
                        >
                            Proceed to Analysis
                        </button>
                    </div>

                    <div className="glass-card p-6 border-gray-800 flex items-center justify-center opacity-50 grayscale">
                        <div className="text-center">
                            <Calculator size={48} className="text-gray-500 mx-auto mb-4" />
                            <h3 className="text-gray-400 font-bold font-mono">Analysis Locked</h3>
                            <p className="text-xs text-gray-600 font-mono mt-2">Review seller intel before calculating.</p>
                        </div>
                    </div>
                </div>
            )}

            {step === 'ANALYZE' && lead && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="glass-card p-6 border-blue-900/30 opacity-70">
                        {/* Minimized lead view */}
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                            <UserCheck size={16} /> Seller Intel (Reference)
                        </h3>
                        <div className="font-mono text-xs text-gray-400 space-y-2">
                            <div><span className="text-gray-600">Property: </span> {lead.address}</div>
                            <div><span className="text-gray-600">Asking: </span> ${lead.askPrice.toLocaleString()}</div>
                            <div><span className="text-gray-600">Motivation: </span> {lead.motivation}</div>
                        </div>
                    </div>

                    <div className="glass-card p-6 border-emerald-900/30 ring-1 ring-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.05)]">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2 text-emerald-400 border-b border-emerald-900/30 pb-4">
                            <Calculator size={16} /> Deal Analysis
                        </h3>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-2">Estimated ARV ($)</label>
                                <input
                                    type="number"
                                    value={userArv}
                                    onChange={(e) => setUserArv(e.target.value)}
                                    className="w-full bg-[var(--bg-secondary)] border border-blue-900/50 text-white px-4 py-2 rounded focus:outline-none focus:border-emerald-500 font-mono transition-colors"
                                    placeholder="240000"
                                />
                                <div className="text-[10px] text-gray-600 mt-1 italic">Tip: Comps show similar renovated homes nearby selling for $230k - $250k.</div>
                            </div>

                            <div>
                                <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-2">Estimated Repairs ($)</label>
                                <input
                                    type="number"
                                    value={userRepairs}
                                    onChange={(e) => setUserRepairs(e.target.value)}
                                    className="w-full bg-[var(--bg-secondary)] border border-blue-900/50 text-white px-4 py-2 rounded focus:outline-none focus:border-emerald-500 font-mono transition-colors"
                                    placeholder="45000"
                                />
                            </div>

                            <div className="pt-4 border-t border-blue-900/30">
                                <label className="block text-[10px] text-emerald-500 uppercase tracking-widest font-mono mb-2 font-bold">Your Official Offer ($)</label>
                                <input
                                    type="number"
                                    value={userOffer}
                                    onChange={(e) => setUserOffer(e.target.value)}
                                    className="w-full bg-emerald-900/20 border border-emerald-500/50 text-emerald-400 px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-lg transition-all"
                                    placeholder="Submit offer below ask..."
                                />
                            </div>
                        </div>

                        <button
                            onClick={submitAnalysis}
                            disabled={!userArv || !userRepairs || !userOffer}
                            className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded uppercase font-bold tracking-widest font-mono text-xs transition-colors flex justify-center items-center gap-2"
                        >
                            <ShieldAlert size={16} /> Submit Binding Offer
                        </button>
                    </div>
                </div>
            )}

            {step === 'RESULT' && results && (
                <div className="glass-card p-10 border-blue-900/30 text-center max-w-2xl mx-auto">
                    {results.passed ? (
                        <CheckCircle size={64} className="text-emerald-500 mx-auto mb-6" />
                    ) : (
                        <ShieldAlert size={64} className="text-red-500 mx-auto mb-6" />
                    )}

                    <h2 className="text-3xl font-bold text-white mb-2 font-mono">
                        Score: <span className={results.passed ? 'text-emerald-400' : 'text-red-400'}>{results.score}/100</span>
                    </h2>
                    <p className={`font-bold tracking-widest uppercase text-sm mb-8 ${results.passed ? 'text-emerald-500' : 'text-red-500'}`}>
                        {results.passed ? 'Simulation Passed' : 'Simulation Failed'}
                    </p>

                    <div className="bg-[var(--bg-tertiary)] p-6 rounded-lg border border-blue-900/50 text-left space-y-4 font-mono text-sm">
                        <div className="text-xs text-gray-500 uppercase tracking-widest border-b border-blue-900/30 pb-2 mb-4">Post-Deal Breakdown</div>
                        {results.feedback.map((fb, idx) => (
                            <div key={idx} className="flex gap-3 text-gray-300">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span className="leading-relaxed">{fb}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 flex gap-4 justify-center">
                        <button
                            onClick={startSimulation}
                            className="bg-[var(--bg-secondary)] hover:bg-white/5 border border-blue-900/50 text-white px-6 py-2 rounded uppercase font-bold tracking-widest font-mono text-xs transition-colors"
                        >
                            Play Again
                        </button>
                        <button
                            onClick={() => navigate('/academy')}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded uppercase font-bold tracking-widest font-mono text-xs transition-colors shadow-lg"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

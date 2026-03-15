import React, { useState, useEffect } from 'react';
import { BookOpen, Search, ChevronRight, Hash, Phone, AlertCircle, ShieldCheck, Target, Zap, Activity, ShieldAlert, Award } from 'lucide-react';

const KNOWLEDGE_BASE_SECTIONS = [
    { id: 'platform-overview', title: '1. Platform Overview' },
    { id: 'getting-started', title: '2. Getting Started' },
    { id: 'user-personas', title: '3. User Personas' },
    { id: 'core-workspaces', title: '4. Core Workspaces' },
    { id: 'deal-intelligence', title: '5. Deal Intelligence' },
    { id: 'deal-lifecycle', title: '6. Deal Lifecycle' },
    { id: 'lead-generation', title: '7. Lead Generation' },
    { id: 'investor-tools', title: '8. Investor Tools' },
    { id: 'network-ecosystem', title: '9. Network Ecosystem' },
    { id: 'referral-network', title: '10. Referral Network' },
    { id: 'platform-automation', title: '11. Platform Automation' },
    { id: 'security-verification', title: '12. Security & Verification' },
    { id: 'subscription-billing', title: '13. Subscription & Billing' },
    { id: 'troubleshooting', title: '14. Troubleshooting' },
];

export const HelpCenter = () => {
    const [activeSection, setActiveSection] = useState('platform-overview');

    const scrollToSection = (id: string) => {
        setActiveSection(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Intersection Observer to highlight sidebar based on scroll position
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        }, { rootMargin: '-100px 0px -70% 0px' });

        KNOWLEDGE_BASE_SECTIONS.forEach(section => {
            const el = document.getElementById(section.id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-[var(--bg-primary)]">

            {/* Sidebar Navigation */}
            <div className="w-80 border-r border-slate-800 bg-slate-900/50 flex flex-col h-full hidden md:flex shrink-0">
                <div className="p-6 border-b border-slate-800">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <BookOpen className="text-indigo-400" /> Knowledge Base
                    </h2>
                    <div className="relative mt-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search guides..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                        />
                    </div>
                </div>

                <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
                    <nav className="space-y-1">
                        {KNOWLEDGE_BASE_SECTIONS.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => scrollToSection(section.id)}
                                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${activeSection === section.id
                                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                                    }`}
                            >
                                <span className="truncate">{section.title}</span>
                                {activeSection === section.id && <ChevronRight size={16} />}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Direct Support Module */}
                <div className="p-6 border-t border-slate-800 bg-indigo-950/20">
                    <h3 className="text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                        <Phone size={14} className="text-indigo-400" /> Contact Support
                    </h3>
                    <p className="text-xs text-slate-500 mb-3">Email: MyWholesaleOS@gmail.com</p>
                    <button className="w-full py-2 bg-[var(--bg-tertiary)] hover:bg-slate-700 border border-slate-600 rounded-lg text-xs font-bold text-white uppercase tracking-wider transition-colors">
                        Submit Request Form
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-8 md:p-12 scroll-smooth custom-scrollbar">
                <div className="max-w-4xl mx-auto pb-32">

                    <div className="mb-12 border-b border-slate-800 pb-8">
                        <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">WholesaleOS Documentation</h1>
                        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
                            The official platform Help Center. This manual mirrors the platform architecture, providing
                            clear guidance on Deal Intelligence, Tri-Party Verification, and automated transaction distribution.
                        </p>
                    </div>

                    <div className="prose prose-invert prose-indigo max-w-none">

                        {/* 1. Platform Overview */}
                        <section id="platform-overview" className="scroll-mt-10 mb-16">
                            <h2 className="text-2xl font-bold text-white border-none flex items-center gap-2 mb-6 tracking-tight"><Hash className="text-indigo-500" /> 1. Platform Overview</h2>
                            <p className="text-slate-300 leading-relaxed bg-slate-800/30 p-6 rounded-xl border border-slate-700 mb-6">
                                WholesaleOS operates as a multi-sided real estate transaction network, connecting five core personas to orchestrate seamless property acquisitions and dispositions.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="p-4 bg-slate-900 border border-slate-700 rounded-lg"><strong className="text-indigo-400 font-mono text-sm uppercase">Wholesalers &rarr;</strong> <div className="text-slate-300 text-sm mt-1">Source and secure off-market deals</div></div>
                                <div className="p-4 bg-slate-900 border border-slate-700 rounded-lg"><strong className="text-indigo-400 font-mono text-sm uppercase">Investors &rarr;</strong> <div className="text-slate-300 text-sm mt-1">Acquire discounted properties</div></div>
                                <div className="p-4 bg-slate-900 border border-slate-700 rounded-lg"><strong className="text-indigo-400 font-mono text-sm uppercase">Realtors &rarr;</strong> <div className="text-slate-300 text-sm mt-1">Receive retail listing referrals</div></div>
                                <div className="p-4 bg-slate-900 border border-slate-700 rounded-lg"><strong className="text-indigo-400 font-mono text-sm uppercase">Title Companies &rarr;</strong> <div className="text-slate-300 text-sm mt-1">Verify escrow and closing milestones</div></div>
                                <div className="p-4 bg-slate-900 border border-indigo-900/50 rounded-lg md:col-span-2 flex gap-3"><AlertCircle className="text-indigo-400 shrink-0" /><div className="text-slate-300 text-sm"><strong className="text-white block">Super Admin &rarr;</strong> Maintain platform integrity and verification</div></div>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-3">Ecosystem Workflow</h3>
                            <div className="flex flex-wrap gap-2 text-xs text-slate-300 font-mono items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                <span className="bg-slate-800 px-3 py-1.5 rounded text-white">Source Deal</span> &rarr;
                                <span className="bg-slate-800 px-3 py-1.5 rounded text-white">Analyze</span> &rarr;
                                <span className="bg-slate-800 px-3 py-1.5 rounded text-white">Publish</span> &rarr;
                                <span className="bg-slate-800 px-3 py-1.5 rounded text-white">Reserve</span> &rarr;
                                <span className="bg-slate-800 px-3 py-1.5 rounded text-white">Verify Escrow</span> &rarr;
                                <span className="bg-emerald-900/50 px-3 py-1.5 rounded border border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.1)]">Tri-Party Close</span> &rarr;
                                <span className="bg-indigo-900/50 px-3 py-1.5 rounded border border-indigo-500/50 text-indigo-300">Boost Trust Score</span>
                            </div>
                        </section>

                        {/* 2. Getting Started */}
                        <section id="getting-started" className="scroll-mt-10 mb-16">
                            <h2 className="text-2xl font-bold text-white border-none flex items-center gap-2 mb-6 tracking-tight"><Hash className="text-indigo-500" /> 2. Getting Started</h2>
                            <p className="text-slate-300 mb-4">Before transacting on WholesaleOS, configure your operating profile:</p>
                            <ul className="space-y-3 pl-0 list-none font-mono text-sm">
                                <li className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-center gap-4"><div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center shrink-0">1</div><div><strong className="text-indigo-400 block mb-1">Profile Setup</strong> Navigate to Profile to set your Company Name and Avatar.</div></li>
                                <li className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-center gap-4"><div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center shrink-0">2</div><div><strong className="text-indigo-400 block mb-1">KYC Verification</strong> Upload your government-issued ID to gain verified standing.</div></li>
                                <li className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-center gap-4"><div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center shrink-0">3</div><div><strong className="text-indigo-400 block mb-1">Stripe Linking</strong> Connect Stripe to process deposits or assignment fees natively.</div></li>
                            </ul>
                        </section>

                        {/* 3. User Personas */}
                        <section id="user-personas" className="scroll-mt-10 mb-16">
                            <h2 className="text-2xl font-bold text-white border-none flex items-center gap-2 mb-6 tracking-tight"><Hash className="text-indigo-500" /> 3. User Personas</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-indigo-500/30 transition-colors">
                                    <h3 className="font-bold text-white mb-3 text-lg">Wholesalers</h3>
                                    <ul className="text-sm text-slate-400 space-y-2 list-none pl-0">
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Lead ingestion</li>
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Deal analysis</li>
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Deal publishing</li>
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Deal blast marketing</li>
                                    </ul>
                                </div>
                                <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-emerald-500/30 transition-colors">
                                    <h3 className="font-bold text-white mb-3 text-lg">Investors</h3>
                                    <ul className="text-sm text-slate-400 space-y-2 list-none pl-0">
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Deal discovery</li>
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> AI deal intelligence review</li>
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Reservation deposits</li>
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Document vault</li>
                                    </ul>
                                </div>
                                <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-amber-500/30 transition-colors">
                                    <h3 className="font-bold text-white mb-3 text-lg">Realtors</h3>
                                    <ul className="text-sm text-slate-400 space-y-2 list-none pl-0">
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Referral acceptance</li>
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Listing management</li>
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Referral revenue tracking</li>
                                    </ul>
                                </div>
                                <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-blue-500/30 transition-colors">
                                    <h3 className="font-bold text-white mb-3 text-lg">Title Companies</h3>
                                    <ul className="text-sm text-slate-400 space-y-2 list-none pl-0">
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> EMD verification</li>
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Escrow tracking</li>
                                        <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Closing milestone confirmation</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* 4. Core Workspaces */}
                        <section id="core-workspaces" className="scroll-mt-10 mb-16">
                            <h2 className="text-2xl font-bold text-white border-none flex items-center gap-2 mb-6 tracking-tight"><Hash className="text-indigo-500" /> 4. Core Workspaces</h2>
                            <p className="text-slate-400 mb-6">Platform Navigation Map:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-mono">
                                <div className="bg-slate-900 p-4 border border-slate-800 rounded-lg flex items-center gap-3"><span className="text-emerald-400 font-bold w-24">/pipeline</span> <span className="text-slate-300">Wholesaler management board</span></div>
                                <div className="bg-slate-900 p-4 border border-slate-800 rounded-lg flex items-center gap-3"><span className="text-emerald-400 font-bold w-24">/deals</span> <span className="text-slate-300">Global Deal Room marketplace</span></div>
                                <div className="bg-slate-900 p-4 border border-slate-800 rounded-lg flex items-center gap-3"><span className="text-emerald-400 font-bold w-24">/dashboard</span> <span className="text-slate-300">Investor intelligence dashboard</span></div>
                                <div className="bg-slate-900 p-4 border border-slate-800 rounded-lg flex items-center gap-3"><span className="text-emerald-400 font-bold w-24">/referrals</span> <span className="text-slate-300">Realtor referral management hub</span></div>
                                <div className="bg-slate-900 p-4 border border-slate-800 rounded-lg flex items-center gap-3"><span className="text-emerald-400 font-bold w-24">/network</span> <span className="text-slate-300">Trust scores & Leaderboards</span></div>
                                <div className="bg-slate-900 p-4 border border-slate-800 rounded-lg flex items-center gap-3"><span className="text-emerald-400 font-bold w-24">/support</span> <span className="text-slate-300">Help Center & Knowledge Base</span></div>
                            </div>
                        </section>

                        {/* 5. Deal Intelligence */}
                        <section id="deal-intelligence" className="scroll-mt-10 mb-16">
                            <h2 className="text-2xl font-bold text-white border-none flex items-center gap-2 mb-6 tracking-tight"><Hash className="text-indigo-500" /> 5. Deal Intelligence Engine</h2>
                            <p className="text-slate-300 mb-6">The AI Intelligence algorithms evaluate every property published to the marketplace.</p>
                            <div className="space-y-4">
                                <div className="flex border-b border-slate-800 pb-4">
                                    <div className="w-1/3 font-bold text-white flex items-center gap-2"><Target className="text-indigo-400" size={16} /> Deal Score (0-100)</div>
                                    <div className="w-2/3 text-slate-400 text-sm">Composite rating based on Equity Spread, Local Buyer Demand, Estimated Rehab Risk, Seller Motivation, and the Wholesaler's Trust Score.</div>
                                </div>
                                <div className="flex border-b border-slate-800 pb-4">
                                    <div className="w-1/3 font-bold text-white flex items-center gap-2"><Zap className="text-indigo-400" size={16} /> Liquidity Signal</div>
                                    <div className="w-2/3 text-slate-400 text-sm">Prediction of how quickly the deal will sell based on recent 90-day cash buyer activity in the zip code.</div>
                                </div>
                                <div className="flex border-b border-slate-800 pb-4">
                                    <div className="w-1/3 font-bold text-white flex items-center gap-2"><ShieldAlert className="text-indigo-400" size={16} /> Risk Level</div>
                                    <div className="w-2/3 text-slate-400 text-sm">Measures profit margin against estimated repairs to detect risky flips.</div>
                                </div>
                                <div className="flex border-b border-slate-800 pb-4">
                                    <div className="w-1/3 font-bold text-white flex items-center gap-2"><Activity className="text-indigo-400" size={16} /> Equity Spread</div>
                                    <div className="w-2/3 text-slate-400 text-sm">Difference between ARV and total capital required (Asking + Repairs).</div>
                                </div>
                                <div className="flex border-b border-slate-800 pb-4">
                                    <div className="w-1/3 font-bold text-white flex items-center gap-2"><BookOpen className="text-indigo-400" size={16} /> Recommended Offer</div>
                                    <div className="w-2/3 text-slate-400 text-sm">Risk-adjusted Maximum Allowable Offer based on the 70% rule.</div>
                                </div>
                            </div>
                        </section>

                        {/* 6. Deal Lifecycle */}
                        <section id="deal-lifecycle" className="scroll-mt-10 mb-16">
                            <h2 className="text-2xl font-bold text-white border-none flex items-center gap-2 mb-6 tracking-tight"><Hash className="text-indigo-500" /> 6. Deal Lifecycle</h2>
                            <div className="flex flex-col md:flex-row gap-4 mb-10 overflow-x-auto custom-scrollbar pb-4">
                                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl min-w-[140px] text-center"><div className="text-indigo-400 font-bold mb-1">1</div><div className="text-xs font-mono text-slate-300">Lead Intake</div></div>
                                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl min-w-[140px] text-center"><div className="text-indigo-400 font-bold mb-1">2</div><div className="text-xs font-mono text-slate-300">Deal Analysis</div></div>
                                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl min-w-[140px] text-center"><div className="text-indigo-400 font-bold mb-1">3</div><div className="text-xs font-mono text-slate-300">Publish to Market</div></div>
                                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl min-w-[140px] text-center"><div className="text-indigo-400 font-bold mb-1">4</div><div className="text-xs font-mono text-slate-300">Investor Reservation</div></div>
                                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl min-w-[140px] text-center"><div className="text-indigo-400 font-bold mb-1">5</div><div className="text-xs font-mono text-slate-300">Escrow Verification</div></div>
                                <div className="bg-slate-900 border border-emerald-500/50 p-4 rounded-xl min-w-[140px] text-center shadow-[0_0_15px_rgba(16,185,129,0.1)]"><div className="text-emerald-400 font-bold mb-1">6</div><div className="text-xs font-bold text-emerald-300">Verified Close</div></div>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-4">Deal Status Definitions</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50"><strong className="text-slate-300 block mb-1">DRAFT</strong><span className="text-sm text-slate-400">Deal is being analyzed and not yet visible in the marketplace.</span></div>
                                <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-500/30"><strong className="text-blue-400 block mb-1">ACTIVE</strong><span className="text-sm text-slate-400">Deal has been published to the Deal Room and is available to investors.</span></div>
                                <div className="bg-amber-900/20 p-4 rounded-lg border border-amber-500/30"><strong className="text-amber-400 block mb-1">RESERVED</strong><span className="text-sm text-slate-400">An investor has placed a locking deposit and the deal is temporarily restricted.</span></div>
                                <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-500/30"><strong className="text-purple-400 block mb-1">UNDER ESCROW</strong><span className="text-sm text-slate-400">The Title Company has verified the Earnest Money Deposit.</span></div>
                                <div className="bg-emerald-900/20 p-4 rounded-lg border border-emerald-500/30 md:col-span-2"><strong className="text-emerald-400 block mb-1">CLOSED</strong><span className="text-sm text-slate-400">The deal has completed the Tri-Party Verification process and is permanently recorded.</span></div>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-4">The Triple Verification System</h3>
                            <p className="text-slate-300 mb-4">
                                WholesaleOS uses a Tri-Party Verification system to guarantee that deals recorded as "Closed" are legitimate transactions. A deal is only marked as VERIFIED CLOSED when three parties independently confirm the transaction:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-slate-800/50 p-5 rounded-lg border border-slate-700">
                                    <div className="font-bold text-white mb-2">1. Wholesaler</div>
                                    <div className="text-sm text-slate-400">Confirms the property assignment or sale was successfully executed.</div>
                                </div>
                                <div className="bg-slate-800/50 p-5 rounded-lg border border-slate-700">
                                    <div className="font-bold text-white mb-2">2. Investor</div>
                                    <div className="text-sm text-slate-400">Confirms the purchase was completed and funds were transferred.</div>
                                </div>
                                <div className="bg-slate-800/50 p-5 rounded-lg border border-slate-700">
                                    <div className="font-bold text-white mb-2">3. Title Company</div>
                                    <div className="text-sm text-slate-400">Confirms escrow completion and document recording.</div>
                                </div>
                            </div>
                            <div className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-lg text-sm text-indigo-200">
                                <strong>Success:</strong> Once all three confirmations occur, the deal becomes permanently recorded as a Verified Close. This automatically increases Trust Scores, improves Deal Producer rankings, and strengthens the Trust Network graph. This system prevents fake deals from being reported and maintains marketplace integrity.
                            </div>
                        </section>

                        {/* 7. Lead Generation */}
                        <section id="lead-generation" className="scroll-mt-10 mb-16">
                            <h2 className="text-2xl font-bold text-white border-none flex items-center gap-2 mb-6 tracking-tight"><Hash className="text-indigo-500" /> 7. Lead Generation</h2>
                            <ul className="list-disc pl-5 space-y-4 text-slate-300">
                                <li>
                                    <strong>Opportunity Radar:</strong> A geographic intelligence engine that identifies acquisition opportunities using:
                                    <ul className="list-circle pl-5 mt-2 space-y-1 text-sm text-slate-400">
                                        <li>Foreclosure auction feeds</li>
                                        <li>Tax delinquency signals</li>
                                        <li>Vacancy indicators</li>
                                        <li>High investor demand zones</li>
                                    </ul>
                                    <p className="text-sm mt-2 font-mono text-indigo-300">Radar helps wholesalers focus on areas where discounted properties and active buyers overlap.</p>
                                </li>
                                <li><strong>Distress Indicators:</strong> Manually flagged OSINT conditions (Tax Delinquent, Code Violations, Vacancy).</li>
                                <li><strong>Foreclosure Signals:</strong> System alerts for upcoming county auction dates.</li>
                                <li><strong>OSINT Data Enrichment:</strong> Public data sources are appended to a property record to improve the accuracy of AI evaluation signals such as seller motivation, property condition indicators, and deal prioritization.</li>
                            </ul>
                        </section>

                        {/* 8. Investor Tools */}
                        <section id="investor-tools" className="scroll-mt-10 mb-16">
                            <h2 className="text-2xl font-bold text-white border-none flex items-center gap-2 mb-6 tracking-tight"><Hash className="text-indigo-500" /> 8. Investor Tools</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-slate-700 font-medium text-slate-300">Deal Reservation System</div>
                                <div className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-slate-700 font-medium text-slate-300">Secure Document Vault</div>
                                <div className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-slate-700 font-medium text-slate-300">Proof of Funds Verification</div>
                                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-slate-400 flex flex-col justify-center">
                                    <strong className="text-slate-300 font-medium">Portfolio Manager (Future)</strong>
                                    <span className="text-xs mt-1 italic">Track portfolio ROI, equity growth, and performance metrics.</span>
                                </div>
                            </div>
                        </section>

                        {/* 9. Network Ecosystem */}
                        <section id="network-ecosystem" className="scroll-mt-10 mb-16">
                            <h2 className="text-2xl font-bold text-white border-none flex items-center gap-2 mb-6 tracking-tight"><Hash className="text-indigo-500" /> 9. Network Ecosystem</h2>
                            <p className="text-slate-300 mb-6">The Network Ecosystem page showcases Trust Leaderboards, Top Deal Producers, and Deal Quality Rankings. The upcoming Network Graph will visualize verified transaction relationships between users.</p>

                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Award size={18} className="text-amber-400" /> Platform Badges</h3>
                            <p className="text-sm text-slate-400 mb-4">WholesaleOS uses badges to visually identify trusted participants and verified credentials across User Profiles, Deal Cards, and Leaderboards.</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl"><strong className="text-white block mb-2 text-sm">Verification</strong><div className="text-xs text-slate-400 flex flex-col gap-1"><span>• KYC Verified</span><span>• Proof of Funds Verified</span><span>• Entity Verified</span></div></div>
                                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl"><strong className="text-white block mb-2 text-sm">Performance</strong><div className="text-xs text-slate-400 flex flex-col gap-1"><span>• Verified Deal Closer</span><span>• Top Deal Producer</span><span>• AI Deal Specialist</span></div></div>
                                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl"><strong className="text-white block mb-2 text-sm">Network</strong><div className="text-xs text-slate-400 flex flex-col gap-1"><span>• Referral Partner</span><span>• Trusted Network Member</span></div></div>
                            </div>

                            <h3 className="text-lg font-bold text-white mb-3">Trust Score Impact</h3>
                            <p className="text-sm text-slate-400 mb-4">Trust Scores directly influence platform visibility and deal access.</p>
                            <div className="flex flex-col gap-3">
                                <div className="p-3 border border-blue-400/30 rounded-lg text-sm bg-blue-900/10 flex items-center gap-4"><div className="font-bold text-blue-400 w-32">90+ Platinum</div> <div className="text-slate-300">Priority deal distribution and leaderboard placement.</div></div>
                                <div className="p-3 border border-amber-500/30 rounded-lg text-sm bg-amber-900/10 flex items-center gap-4"><div className="font-bold text-amber-500 w-32">75–89 Gold/Silver</div> <div className="text-slate-300">Standard marketplace visibility.</div></div>
                                <div className="p-3 border border-slate-600 rounded-lg text-sm bg-slate-800/50 flex items-center gap-4"><div className="font-bold text-slate-300 w-32">50–74 Bronze</div> <div className="text-slate-300">Limited deal blast privileges.</div></div>
                                <div className="p-3 border border-red-900/50 rounded-lg text-sm bg-red-900/10 flex items-center gap-4"><div className="font-bold text-red-400 w-32">Below 50</div> <div className="text-slate-300">Restricted access to marketplace features.</div></div>
                            </div>
                        </section>

                        {/* 10. Referral Network */}
                        <section id="referral-network" className="scroll-mt-10 mb-16">
                            <h2 className="text-2xl font-bold text-white border-none flex items-center gap-2 mb-6 tracking-tight"><Hash className="text-indigo-500" /> 10. Referral Network</h2>
                            <ul className="list-disc pl-5 space-y-2 text-slate-300">
                                <li><strong>Sending Referrals:</strong> Wholesalers route unqualified or retail leads to the Network.</li>
                                <li><strong>Accepting Referrals:</strong> Realtors receive ping notifications and must actively Accept or Decline representation.</li>
                                <li><strong>Referral Fee Tracking:</strong> Automatically logs percentage splits and tracks expected revenue upon closing.</li>
                            </ul>
                        </section>

                        {/* 11. Platform Automation */}
                        <section id="platform-automation" className="scroll-mt-10 mb-16">
                            <h2 className="text-2xl font-bold text-white border-none flex items-center gap-2 mb-6 tracking-tight"><Hash className="text-indigo-500" /> 11. Platform Automation</h2>
                            <p className="text-slate-300 mb-4">WholesaleOS automates many tasks normally handled manually in traditional wholesaling operations. These automation systems work together to increase transaction velocity across the platform:</p>
                            <ul className="list-disc pl-5 space-y-2 text-slate-300">
                                <li><strong>AI Deal Intelligence:</strong> Property risk and equity analysis.</li>
                                <li><strong>Distribution Engine:</strong> Routing deals to the correct investor buy boxes.</li>
                                <li><strong>Deal Blast Engine:</strong> Automated SMS and email marketing.</li>
                                <li><strong>Skip Trace Infrastructure:</strong> Owner contact discovery.</li>
                                <li><strong>Opportunity Radar:</strong> Distressed property signal detection.</li>
                            </ul>
                        </section>

                        {/* 12. Security & Verification */}
                        <section id="security-verification" className="scroll-mt-10 mb-16">
                            <h2 className="text-2xl font-bold text-white border-none flex items-center gap-2 mb-6 tracking-tight"><Hash className="text-indigo-500" /> 12. Security & Verification</h2>

                            <h3 className="text-lg font-bold text-white mb-3">Marketplace Integrity</h3>
                            <p className="text-slate-300 mb-4">WholesaleOS maintains marketplace integrity through several safeguards:</p>
                            <ul className="list-disc pl-5 space-y-2 text-slate-400 text-sm mb-6">
                                <li>Proof of Control verification for wholesalers</li>
                                <li>Proof of Funds verification for investors</li>
                                <li>Tri-Party Verification for deal closings</li>
                                <li>Trust Score penalties for failed transactions</li>
                                <li>Super Admin oversight and manual review tools</li>
                            </ul>
                            <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg mb-6">
                                <p className="text-sm text-indigo-300 font-mono">These mechanisms ensure that the marketplace remains transparent and trustworthy.</p>
                            </div>

                            <ul className="list-disc pl-5 space-y-2 text-slate-300">
                                <li><strong>KYC Verification:</strong> Identity validation to prevent bad actors.</li>
                                <li><strong>Trust Score System:</strong> Penalty system that restricts functionality for abusive accounts.</li>
                            </ul>
                        </section>

                        {/* 13. Subscription & Billing */}
                        <section id="subscription-billing" className="scroll-mt-10 mb-16">
                            <h2 className="text-2xl font-bold text-white border-none flex items-center gap-2 mb-6 tracking-tight"><Hash className="text-indigo-500" /> 13. Subscription & Billing</h2>
                            <div className="flex gap-4">
                                <span className="bg-slate-800 px-3 py-1 rounded-full text-xs font-bold text-slate-300 border border-slate-700">PROFESSIONAL</span>
                                <span className="bg-indigo-900/50 px-3 py-1 rounded-full text-xs font-bold text-indigo-300 border border-indigo-500/50">PRO</span>
                                <span className="bg-purple-900/50 px-3 py-1 rounded-full text-xs font-bold text-purple-300 border border-purple-500/50">SUPER</span>
                            </div>
                            <p className="text-sm text-slate-400 mt-4">Upgrading is handled via the `/pricing` page. Payments process securely via Stripe.</p>
                        </section>

                        {/* 14. Troubleshooting */}
                        <section id="troubleshooting" className="scroll-mt-10">
                            <h2 className="text-2xl font-bold text-white border-none flex items-center gap-2 mb-6 tracking-tight"><Hash className="text-indigo-500" /> 14. Troubleshooting</h2>
                            <div className="space-y-4 mb-8">
                                <div className="bg-slate-800 p-4 rounded-lg">
                                    <h4 className="font-bold text-white mb-1 text-sm">Deal Publishing Errors</h4>
                                    <p className="text-sm text-slate-400">Missing photos, ARV, MAO, or Proof of Control.</p>
                                </div>
                                <div className="bg-slate-800 p-4 rounded-lg">
                                    <h4 className="font-bold text-white mb-1 text-sm">Verification Issues</h4>
                                    <p className="text-sm text-slate-400">Proof of Funds review may take 24-48 hours.</p>
                                </div>
                                <div className="bg-slate-800 p-4 rounded-lg">
                                    <h4 className="font-bold text-white mb-1 text-sm">Deal Reservation Problems</h4>
                                    <p className="text-sm text-slate-400">Deals already reserved cannot be double-booked.</p>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-4">Support Contact</h3>
                            <ul className="text-slate-300 list-disc pl-5">
                                <li>MyWholesaleOS@gmail.com</li>
                                <li>Help Center request form</li>
                            </ul>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
};

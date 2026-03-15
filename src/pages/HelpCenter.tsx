import React, { useState, useEffect } from 'react';
import { BookOpen, Search, ChevronRight, Hash, Phone, AlertCircle } from 'lucide-react';

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
                                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${activeSection === section.id
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
                        <Phone size={14} className="text-indigo-400" /> Need more help?
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">Our support engineers are standing by.</p>
                    <button className="w-full py-2 bg-[var(--bg-tertiary)] hover:bg-slate-700 border border-slate-600 rounded-lg text-xs font-bold text-white uppercase tracking-wider transition-colors">
                        Contact Support
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-8 md:p-12 scroll-smooth custom-scrollbar">
                <div className="max-w-4xl mx-auto pb-32">

                    <div className="mb-12 border-b border-slate-800 pb-8">
                        <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">WholesaleOS Documentation</h1>
                        <p className="text-lg text-slate-400 leading-relaxed">
                            Welcome to the official platform Help Center. View architecture overviews, troubleshoot errors, and master the exact workflows needed to scale your operations.
                        </p>
                    </div>

                    <div className="prose prose-invert prose-indigo max-w-none">

                        <section id="platform-overview" className="scroll-mt-10 mb-16">
                            <h2 className="text-2xl font-bold text-white border-none flex items-center gap-2 mb-6 tracking-tight"><Hash className="text-indigo-500" /> 1. Platform Overview</h2>
                            <p className="text-slate-300 leading-relaxed bg-slate-800/30 p-6 rounded-xl border border-slate-700">
                                WholesaleOS is a multi-sided SaaS marketplace designed to operate as a "Bloomberg Terminal" for real estate transactions. The ecosystem connects Wholesalers (deal providers) with Cash Buyers (Investors), while integrating Realtors for retail referrals and Title Companies to verify transaction milestones. The platform algorithmically ranks deals, tracks user trust, and automates marketing distribution to accelerate transaction velocity.
                            </p>
                        </section>

                        <section id="getting-started" className="scroll-mt-10 mb-16">
                            <h2 className="text-2xl font-bold text-white border-none flex items-center gap-2 mb-6 tracking-tight"><Hash className="text-indigo-500" /> 2. Getting Started</h2>
                            <p className="text-slate-300 mb-4">Before transacting on WholesaleOS, you must configure your operating profile:</p>
                            <ul className="space-y-3 pl-0 list-none">
                                <li className="bg-slate-900 border border-slate-800 p-4 rounded-lg"><strong className="text-indigo-400 block mb-1">Profile Setup</strong> Navigate to Settings -&gt; Profile to set your Company Name, Avatar, and contact routing info.</li>
                                <li className="bg-slate-900 border border-slate-800 p-4 rounded-lg"><strong className="text-indigo-400 block mb-1">KYC Verification</strong> Upload your government-issued ID via the Security tab to gain verified standing.</li>
                                <li className="bg-slate-900 border border-slate-800 p-4 rounded-lg"><strong className="text-indigo-400 block mb-1">Stripe Linking</strong> Connect a Stripe payout account (Wholesalers) or a payment method (Investors) to process locking deposits and assignment fees natively.</li>
                            </ul>
                        </section>

                        <section id="user-personas" className="scroll-mt-10 mb-16">
                            <h2 className="text-2xl font-bold text-white border-none flex items-center gap-2 mb-6 tracking-tight"><Hash className="text-indigo-500" /> 3. User Personas</h2>
                            <p className="text-slate-300 mb-4">WholesaleOS assigns distinct capabilities based on your declared persona:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-5 bg-slate-800/50 border border-slate-700 rounded-xl"><h3 className="font-bold text-white mb-2">Wholesalers</h3><p className="text-sm text-slate-400">Authorized to ingest leads, run comps, analyze deals, and push inventory to the Deal Room.</p></div>
                                <div className="p-5 bg-slate-800/50 border border-slate-700 rounded-xl"><h3 className="font-bold text-white mb-2">Investors</h3><p className="text-sm text-slate-400">Authorized to browse the marketplace, review AI Deal Scores, and place locking deposits on active deals.</p></div>
                                <div className="p-5 bg-slate-800/50 border border-slate-700 rounded-xl"><h3 className="font-bold text-white mb-2">Realtors</h3><p className="text-sm text-slate-400">Authorized to receive pre-qualified listing referrals from Wholesalers for retail properties.</p></div>
                                <div className="p-5 bg-slate-800/50 border border-slate-700 rounded-xl"><h3 className="font-bold text-white mb-2">Title Companies</h3><p className="text-sm text-slate-400">Authorized to verify Earnest Money Deposits (EMD) and push transactions to a "Verified Close" status.</p></div>
                                <div className="p-5 bg-slate-900 border border-indigo-900 md:col-span-2 rounded-xl flex items-start gap-3"><AlertCircle className="text-indigo-400 shrink-0 mt-1" /><div className="text-sm"><strong className="text-indigo-400 block">Super Admin</strong>Authorized to moderate the network, approve KYC / Proof of Funds documentation, and monitor systemic health.</div></div>
                            </div>
                        </section>

                        <section id="core-workspaces" className="scroll-mt-10 mb-16">
                            <h2 className="text-2xl font-bold text-white border-none flex items-center gap-2 mb-6 tracking-tight"><Hash className="text-indigo-500" /> 4. Core Workspaces</h2>
                            <ul className="space-y-4 text-slate-300">
                                <li><strong>Wholesaler Pipeline (/pipeline):</strong> A Kanban board for managing leads from initial intake through closing.</li>
                                <li><strong>Deal Room Marketplace (/deals):</strong> The global grid where Investors discover and reserve algorithmic-ranked active deals.</li>
                                <li><strong>Investor Dashboard (/dashboard):</strong> A curated summary of saved deals, active reservations, and recent market alerts.</li>
                                <li><strong>Referral Hub (/referrals):</strong> The exchange portal where Wholesalers route retail leads to Realtors for a percentage fee.</li>
                                <li><strong>Network Ecosystem (/network):</strong> The gamification arena displaying Trust Leaderboards and Top Deal Producers.</li>
                            </ul>
                        </section>

                        <section id="deal-intelligence" className="scroll-mt-10 mb-16">
                            <h2 className="text-2xl font-bold text-white border-none flex items-center gap-2 mb-6 tracking-tight"><Hash className="text-indigo-500" /> 5. Deal Intelligence</h2>
                            <p className="text-slate-300 mb-6">The AI Deal Engine evaluates every property published to the marketplace.</p>
                            <div className="space-y-3">
                                <div className="flex border-b border-slate-800 pb-3"><div className="w-1/3 font-bold text-indigo-300">Deal Score (0-100)</div><div className="w-2/3 text-slate-400 text-sm">A master rating fusing equity, risk, demand, and the Wholesaler's trust score.</div></div>
                                <div className="flex border-b border-slate-800 pb-3"><div className="w-1/3 font-bold text-indigo-300">Liquidity Signal</div><div className="w-2/3 text-slate-400 text-sm">A prediction (High/Moderate/Weak) of how fast a deal will sell based on trailing 90-day cash purchases.</div></div>
                                <div className="flex border-b border-slate-800 pb-3"><div className="w-1/3 font-bold text-indigo-300">Risk Level</div><div className="w-2/3 text-slate-400 text-sm">Evaluates profit margin against estimated repair costs to flag potentially hazardous flips.</div></div>
                                <div className="flex border-b border-slate-800 pb-3"><div className="w-1/3 font-bold text-indigo-300">Equity Spread</div><div className="w-2/3 text-slate-400 text-sm">The raw dollar amount difference between the ARV and total capital required.</div></div>
                                <div className="flex border-b border-slate-800 pb-3"><div className="w-1/3 font-bold text-indigo-300">Recommended Offer</div><div className="w-2/3 text-slate-400 text-sm">An automatically calculated Maximum Allowable Offer (MAO) using a risk-adjusted 70% Rule.</div></div>
                            </div>
                        </section>

                        <section id="deal-lifecycle" className="scroll-mt-10 mb-16">
                            <h2 className="text-2xl font-bold text-white border-none flex items-center gap-2 mb-6 tracking-tight"><Hash className="text-indigo-500" /> 6. Deal Lifecycle</h2>
                            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 relative">
                                <div className="absolute left-[39px] top-10 bottom-10 w-0.5 bg-slate-800"></div>
                                <div className="space-y-6 relative z-10">
                                    <div className="flex items-start gap-4"><div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center font-bold text-slate-300 shrink-0 text-sm">1</div><div className="pt-1"><strong className="text-white">Lead Intake:</strong> <span className="text-slate-400 text-sm block">Wholesaler adds a property to the Pipeline.</span></div></div>
                                    <div className="flex items-start gap-4"><div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center font-bold text-slate-300 shrink-0 text-sm">2</div><div className="pt-1"><strong className="text-white">Deal Analysis:</strong> <span className="text-slate-400 text-sm block">Wholesaler enters repair estimates; Comps Engine fetches local ARV.</span></div></div>
                                    <div className="flex items-start gap-4"><div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center font-bold text-slate-300 shrink-0 text-sm">3</div><div className="pt-1"><strong className="text-white">Publishing Deals:</strong> <span className="text-slate-400 text-sm block">Photos and contracts are uploaded and pushed to the marketplace.</span></div></div>
                                    <div className="flex items-start gap-4"><div className="w-8 h-8 rounded-full bg-indigo-900 border-2 border-indigo-500 flex items-center justify-center font-bold text-indigo-300 shrink-0 text-sm">4</div><div className="pt-1"><strong className="text-white">Investor Reservation:</strong> <span className="text-slate-400 text-sm block">An Investor views the AI Score and pays a $250 earnest fee to lock the deal.</span></div></div>
                                    <div className="flex items-start gap-4"><div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center font-bold text-slate-300 shrink-0 text-sm">5</div><div className="pt-1"><strong className="text-white">Escrow & Title:</strong> <span className="text-slate-400 text-sm block">A Title Company verifies the EMD receipt, hard-locking the property.</span></div></div>
                                    <div className="flex items-start gap-4"><div className="w-8 h-8 rounded-full bg-emerald-900 border-2 border-emerald-500 flex items-center justify-center font-bold text-emerald-300 shrink-0 text-sm">6</div><div className="pt-1"><strong className="text-white">Verified Close:</strong> <span className="text-slate-400 text-sm block">Transaction finalizes via Tri-Party Verification, boosting Trust Scores.</span></div></div>
                                </div>
                            </div>
                        </section>

                        <section id="lead-generation" className="scroll-mt-10 mb-16">
                            <h2 className="text-2xl font-bold text-white border-none flex items-center gap-2 mb-6 tracking-tight"><Hash className="text-indigo-500" /> 7. Lead Generation</h2>
                            <ul className="list-disc pl-5 space-y-2 text-slate-300">
                                <li><strong>Opportunity Radar:</strong> A heatmap visualizing high-velocity transaction zones and active cash buyers.</li>
                                <li><strong>Distress Indicators:</strong> Manually flagged OSINT conditions (Tax Delinquent, Code Violations, Vacancy).</li>
                                <li><strong>Foreclosure Signals:</strong> System alerts for upcoming county auction dates.</li>
                                <li><strong>OSINT Enrichment:</strong> External data appended to boost a property's priority `ai_deal_score`.</li>
                            </ul>
                        </section>

                        <section id="investor-tools" className="scroll-mt-10 mb-16">
                            <h2 className="text-2xl font-bold text-white border-none flex items-center gap-2 mb-6 tracking-tight"><Hash className="text-indigo-500" /> 8. Investor Tools</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-slate-700 font-medium text-slate-300">1. Deal Reservation Checkout</div>
                                <div className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-slate-700 font-medium text-slate-300">2. Secure Document Vault</div>
                                <div className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-slate-700 font-medium text-slate-300">3. Proof of Funds (POF) Flow</div>
                                <div className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-slate-700 font-medium text-slate-500 italic">4. Portfolio Manager (Coming Soon)</div>
                            </div>
                        </section>

                        <section id="network-ecosystem" className="scroll-mt-10 mb-16">
                            <h2 className="text-2xl font-bold text-white border-none flex items-center gap-2 mb-6 tracking-tight"><Hash className="text-indigo-500" /> 9. Network Ecosystem</h2>
                            <ul className="list-disc pl-5 space-y-2 text-slate-300">
                                <li><strong>Trust Score:</strong> Your reputation (0-100). Increases with verified closings; decreases with dropped contracts.</li>
                                <li><strong>Deal Score:</strong> An aggregate metric of the quality of deals a Wholesaler produces.</li>
                                <li><strong>Trust Leaderboards:</strong> Ranks the most reliable players in the marketplace.</li>
                                <li><strong>Top Deal Producers:</strong> Showcases Wholesalers providing the deepest discount properties.</li>
                            </ul>
                        </section>

                        <section id="referral-network" className="scroll-mt-10 mb-16">
                            <h2 className="text-2xl font-bold text-white border-none flex items-center gap-2 mb-6 tracking-tight"><Hash className="text-indigo-500" /> 10. Referral Network</h2>
                            <p className="text-slate-300">Retail leads generated by Wholesalers are dispatched to Realtors via the Referral Hub. Realtors can <strong>Accept</strong> or <strong>Decline</strong> the referral matrix and agree to specific fee percentages (tracked automatically by the platform closing engine).</p>
                        </section>

                        <section id="platform-automation" className="scroll-mt-10 mb-16">
                            <h2 className="text-2xl font-bold text-white border-none flex items-center gap-2 mb-6 tracking-tight"><Hash className="text-indigo-500" /> 11. Platform Automation</h2>
                            <ul className="list-disc pl-5 space-y-2 text-slate-300">
                                <li><strong>Skip Tracing:</strong> Bulk or single lookups for owner phone numbers.</li>
                                <li><strong>Deal Blast Engine:</strong> 1-click execution to distribute a published deal via SMS and Email to the matched buyer pool.</li>
                                <li><strong>AI Deal Intelligence:</strong> Asynchronous evaluation of property metrics using background OSINT processors.</li>
                                <li><strong>Distribution Engine:</strong> The routing system that matches a property's zip code to an Investor's Buy Box.</li>
                            </ul>
                        </section>

                        <section id="security-verification" className="scroll-mt-10 mb-16">
                            <h2 className="text-2xl font-bold text-white border-none flex items-center gap-2 mb-6 tracking-tight"><Hash className="text-indigo-500" /> 12. Security & Verification</h2>
                            <ul className="list-disc pl-5 space-y-2 text-slate-300">
                                <li><strong>KYC Verification:</strong> Identity validation to prevent bad actors.</li>
                                <li><strong>Proof of Control (POC):</strong> Wholesalers must upload executed A-to-B contracts before deals go live.</li>
                                <li><strong>Trust Score System:</strong> An algorithmic penalty system that restricts functionality for abusive accounts.</li>
                                <li><strong>Platform Integrity:</strong> Super Admin dashboard kill-switches for fraudulent activity.</li>
                            </ul>
                        </section>

                        <section id="subscription-billing" className="scroll-mt-10 mb-16">
                            <h2 className="text-2xl font-bold text-white border-none flex items-center gap-2 mb-6 tracking-tight"><Hash className="text-indigo-500" /> 13. Subscription & Billing</h2>
                            <p className="text-slate-300 mb-4">Upgrading is handled dynamically via the `/pricing` page. Payments process off-site via Stripe Checkout.</p>
                            <div className="flex gap-4">
                                <span className="bg-slate-800 px-3 py-1 rounded-full text-xs font-bold text-slate-300 border border-slate-700">PROFESSIONAL ($100/mo)</span>
                                <span className="bg-indigo-900/50 px-3 py-1 rounded-full text-xs font-bold text-indigo-300 border border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.2)]">PRO ($500/mo)</span>
                                <span className="bg-purple-900/50 px-3 py-1 rounded-full text-xs font-bold text-purple-300 border border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.2)]">SUPER ($1000/mo)</span>
                            </div>
                        </section>

                        <section id="troubleshooting" className="scroll-mt-10">
                            <h2 className="text-2xl font-bold text-white border-none flex items-center gap-2 mb-6 tracking-tight"><Hash className="text-indigo-500" /> 14. Troubleshooting</h2>
                            <div className="space-y-4">
                                <details className="bg-slate-800 p-4 rounded-lg cursor-pointer">
                                    <summary className="font-bold text-white">Deal Publishing Errors</summary>
                                    <p className="text-sm text-slate-400 mt-2">Ensure you have attached at least 3 photos, input the ARV/MAO, and verified your POC document.</p>
                                </details>
                                <details className="bg-slate-800 p-4 rounded-lg cursor-pointer">
                                    <summary className="font-bold text-white">Verification Issues</summary>
                                    <p className="text-sm text-slate-400 mt-2">Proof of Funds processing can take 24-48 hours depending on admin volume.</p>
                                </details>
                                <details className="bg-slate-800 p-4 rounded-lg cursor-pointer">
                                    <summary className="font-bold text-white">Reservation Problems</summary>
                                    <p className="text-sm text-slate-400 mt-2">If a deal is tagged 'RESERVED' by another buyer, it is locked. You must wait for their 24hr escrow period to lapse.</p>
                                </details>
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
};

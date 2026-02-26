import React, { useState, useEffect } from 'react';
import { ShieldAlert, FileText, Scale, Cpu, Trash2 } from 'lucide-react';

const EnterpriseTermsModal = ({ isOpen, onAccept }) => {
    const [scrolledToBottom, setScrolledToBottom] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState({
        masterAgreement: false
    });

    // Check if the user has already accepted the terms in this session/device
    useEffect(() => {
        if (isOpen) {
            const hasAccepted = localStorage.getItem('wholesale_os_enterprise_terms_accepted');
            if (hasAccepted === 'true') {
                onAccept();
            }
        }
    }, [isOpen, onAccept]);

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        // Add a 10px buffer for cross-browser rounding issues
        if (scrollTop + clientHeight >= scrollHeight - 10) {
            setScrolledToBottom(true);
        }
    };

    const handleCheckboxChange = () => {
        setAcceptedTerms(prev => ({
            masterAgreement: !prev.masterAgreement
        }));
    };

    const allAccepted = Object.values(acceptedTerms).every(Boolean) && scrolledToBottom;

    const handleSignAgreement = () => {
        if (allAccepted) {
            localStorage.setItem('wholesale_os_enterprise_terms_accepted', 'true');
            onAccept();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999999] bg-[var(--surface-dark)] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-[var(--surface-light)] border border-[var(--border-light)] shadow-[0_0_50px_rgba(239,68,68,0.15)] rounded-xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden relative">

                {/* Header */}
                <div className="p-6 border-b border-[var(--border-light)] bg-gradient-to-r from-[rgba(239,68,68,0.1)] to-transparent">
                    <div className="flex items-center gap-3 mb-2">
                        <ShieldAlert className="text-danger" size={28} />
                        <h2 className="text-2xl font-bold tracking-tight">Enterprise Infrastructure Agreement</h2>
                    </div>
                    <p className="text-muted text-sm">Action Required: You must review and legally accept the following terms to interact with the Wholesale OS SaaS platform.</p>
                </div>

                {/* Scrollable Terms Content */}
                <div
                    className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-[var(--surface-dark)]/50 space-y-6 text-sm text-gray-300"
                    onScroll={handleScroll}
                >
                    <section>
                        <h3 className="text-white font-bold mb-2 flex items-center gap-2"><FileText size={16} /> 1. Terms of Service & Software License</h3>
                        <p className="mb-2">1.1 Wholesale OS ("The Software") is provided on an "as is" and "as available" basis. We grant you a revocable, non-exclusive, non-transferable license to use the Software strictly in accordance with these terms.</p>
                        <p>1.2 You agree not to reverse engineer, decompile, or aggressively scrape the Application Programming Interfaces (APIs) beyond your allotted tier limits. Circumvention of rate limits will result in immediate termination.</p>
                    </section>

                    <section>
                        <h3 className="text-white font-bold mb-2 flex items-center gap-2"><Cpu size={16} /> 2. AI Intelligence & Predictive Math Disclaimer</h3>
                        <p className="mb-2">2.1 The "Wholesale Intelligence Engine™", including the Deal Probability Score (DPS), Estimated Time-to-Close (ETTC), and Assignment Fee Range (AFR), are algorithmic estimates based on historical data aggregates and unstructured public records.</p>
                        <p>2.2 <strong>THESE METRICS ARE NOT FINANCIAL ADVICE.</strong> They are software-generated estimates. Wholesale OS assumes zero liability for investment losses, collapsed escrows, or inaccurate market velocity predictions.</p>
                    </section>

                    <section>
                        <h3 className="text-warning font-bold mb-2 flex items-center gap-2"><ShieldAlert size={16} /> 3. No Guarantee of Profit</h3>
                        <p className="mb-2">3.1 Real estate wholesaling involves significant risk. The provision of Lead Data, Distress Signals, and Buyer Demand Indexing (BDI) does not guarantee you will secure a contract or successfully assign an asset.</p>
                        <p>3.2 All revenue projections shown within the Demo Mode or Live software are illustrative paradigms. Your actual business results are entirely dependent on your individual execution, negotiation, and market conditions.</p>
                    </section>

                    <section>
                        <h3 className="text-white font-bold mb-2 flex items-center gap-2"><Scale size={16} /> 4. Mandatory Binding Arbitration</h3>
                        <p className="mb-2">4.1 <strong>CLASS ACTION WAIVER:</strong> You agree that any dispute or claim arising from your use of Wholesale OS, its data accuracy, or subscription billing issues will be resolved by binding, individual arbitration under the rules of the American Arbitration Association (AAA), rather than in court.</p>
                        <p>4.2 You explicitly waive your right to participate in a class action lawsuit or class-wide arbitration against Wholesale OS or its parent entities.</p>
                    </section>

                    <section>
                        <h3 className="text-white font-bold mb-2 flex items-center gap-2"><Trash2 size={16} /> 5. Data Accuracy & Deletion Protocol</h3>
                        <p className="mb-2">5.1 Public record data parsed via our web scrapers (Notices of Default, Preforeclosures) may contain inaccuracies, delays, or omissions originating from the source counties.</p>
                        <p>5.2 <strong>Data Deletion:</strong> Pursuant to privacy regulations, should you terminate your Stripe subscription, your proprietary CRM pipeline and specific configurations will be permanently purged from the database within 45 days. Shared macro-telemetry (Deal Outcomes) is aggregated and anonymized.</p>
                    </section>

                    {!scrolledToBottom && (
                        <div className="sticky bottom-0 bg-gradient-to-t from-[var(--surface-dark)] pt-8 pb-2 text-center text-primary animate-pulse flex flex-col items-center">
                            <span>Scroll to bottom to review all terms</span>
                            <div className="mt-1">↓</div>
                        </div>
                    )}
                </div>

                {/* Consent Controls */}
                <div className={`p-6 border-t border-[var(--border-light)] bg-[var(--surface-light)] transition-opacity duration-300 ${scrolledToBottom ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <input type="checkbox" className="mt-1 cursor-pointer accent-primary"
                            checked={acceptedTerms.masterAgreement} onChange={handleCheckboxChange} />
                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                            I have read, understood, and agree to the Master Terms of Service, Binding Arbitration clause, AI Disclaimer, Liability Waiver, and Data Deletion Protocol.
                        </span>
                    </label>

                    <div className="flex justify-end">
                        <button
                            className="btn btn-primary px-8 flex items-center gap-2 text-sm font-bold shadow-[0_4px_15px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all"
                            disabled={!allAccepted}
                            onClick={handleSignAgreement}
                        >
                            <ShieldAlert size={16} /> Execute Agreement & Enter Platform
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default EnterpriseTermsModal;

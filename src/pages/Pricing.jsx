import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Zap, Shield, Crown } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import '../App.css';

const Pricing = () => {
    const { user, loadingAuth } = useAuth();
    const navigate = useNavigate();
    const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

    const handleUpgrade = async (tier) => {
        if (!user) {
            navigate('/signup', { state: { returnTo: '/pricing', intendedTier: tier } });
            return;
        }

        setIsCheckoutLoading(true);
        try {
            // Map plain text tiers to live Stripe Price IDs securely
            let priceId = '';
            if (tier === 'PRO') priceId = 'price_1QxOpeA3e2M6S811g4EaVlXm'; // Replace with actual Pro Price ID if needed
            else if (tier === 'SUPER') priceId = 'price_1QxOqKA3e2M6S811zRMyQnTw'; // Replace with actual Super Price ID if needed

            // Standard fetch call to the backend
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const res = await fetch(`${baseUrl}/api/stripe/create-checkout-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    userEmail: user.email,
                    tier: tier,
                    priceId: priceId,
                    tosAccepted: true // Enforce TOS acceptance at this juncture
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to initialize checkout');
            }

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url; // Redirect to Stripe
            } else {
                throw new Error('No checkout URL returned');
            }
        } catch (error) {
            console.error("Checkout Error:", error);
            alert(`Unable to start checkout: ${error.message}`);
            setIsCheckoutLoading(false);
        }
    };

    if (loadingAuth) {
        return <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-white">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-[#0B0F19] text-white selection:bg-primary/30 py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16 animate-fade-in-up">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
                        Unlock the full power of <span className="text-primary glow-text">Wholesale OS</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Scale your real estate operations with industrial-grade intelligence, automated pipelines, and ironclad compliance.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">

                    {/* BASIC TIER */}
                    <div className="glass-panel p-8 rounded-2xl border border-white/10 flex flex-col relative animate-fade-in-up hover:border-white/20 transition-all duration-300">
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold flex items-center gap-2 mb-2"><Shield className="text-gray-400" /> BASIC</h3>
                            <div className="text-gray-400 mb-4 h-12">The essential sandbox to evaluate the operating system.</div>
                            <div className="text-4xl font-extrabold mb-1">$0<span className="text-xl text-gray-500 font-normal"> /mo</span></div>
                            <div className="text-sm text-gray-500">Free forever. No credit card required.</div>
                        </div>

                        <div className="flex-grow">
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-start gap-3"><CheckCircle2 className="text-success shrink-0" size={20} /> <span className="text-gray-300">Standard CRM Pipeline</span></li>
                                <li className="flex items-start gap-3"><CheckCircle2 className="text-success shrink-0" size={20} /> <span className="text-gray-300">Up to 50 Leads / Month</span></li>
                                <li className="flex items-start gap-3"><CheckCircle2 className="text-success shrink-0" size={20} /> <span className="text-gray-300">Basic Document Storage</span></li>
                                <li className="flex items-start gap-3 opacity-50"><XCircle className="text-danger shrink-0" size={20} /> <span className="text-gray-500 line-through">Comps Engine Access</span></li>
                                <li className="flex items-start gap-3 opacity-50"><XCircle className="text-danger shrink-0" size={20} /> <span className="text-gray-500 line-through">Opportunity Radar Datasets</span></li>
                                <li className="flex items-start gap-3 opacity-50"><XCircle className="text-danger shrink-0" size={20} /> <span className="text-gray-500 line-through">Spreadsheet Batch Imports</span></li>
                            </ul>
                        </div>

                        {!user ? (
                            <button className="btn btn-secondary w-full py-3 border-gray-600 hover:bg-white/5" onClick={() => navigate('/signup')}>
                                Create Free Account
                            </button>
                        ) : (
                            <button className="btn btn-secondary w-full py-3 border-gray-600 opacity-50 cursor-not-allowed">
                                Current Plan
                            </button>
                        )}
                    </div>

                    {/* PRO TIER */}
                    <div className="glass-panel p-8 rounded-2xl border-2 border-primary relative transform md:-translate-y-4 shadow-[0_0_40px_rgba(79,70,229,0.15)] flex flex-col animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <span className="bg-primary text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-[0_0_15px_rgba(79,70,229,0.5)]">Most Popular</span>
                        </div>
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold flex items-center gap-2 mb-2"><Zap className="text-primary" /> PRO</h3>
                            <div className="text-indigo-200 mb-4 h-12">For active wholesalers scaling their acquisition volume.</div>
                            <div className="text-4xl font-extrabold mb-1">$97<span className="text-xl text-indigo-300 font-normal"> /mo</span></div>
                            <div className="text-sm text-indigo-400">Cancel anytime.</div>
                        </div>

                        <div className="flex-grow">
                            <p className="font-bold text-sm text-indigo-300 mb-4 uppercase tracking-wider">Everything in Basic, plus:</p>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-start gap-3"><CheckCircle2 className="text-primary shrink-0" size={20} /> <span className="text-white font-medium">Unlocked Comps Engine (Live Data)</span></li>
                                <li className="flex items-start gap-3"><CheckCircle2 className="text-primary shrink-0" size={20} /> <span className="text-white">Live Opportunity Radar Maps</span></li>
                                <li className="flex items-start gap-3"><CheckCircle2 className="text-primary shrink-0" size={20} /> <span className="text-white">AI Offer Suggestions (MAO)</span></li>
                                <li className="flex items-start gap-3"><CheckCircle2 className="text-primary shrink-0" size={20} /> <span className="text-white">Digital Document E-Signatures</span></li>
                                <li className="flex items-start gap-3"><CheckCircle2 className="text-primary shrink-0" size={20} /> <span className="text-white">Spreadsheet Batch Ingestion Utility</span></li>
                                <li className="flex items-start gap-3"><CheckCircle2 className="text-primary shrink-0" size={20} /> <span className="text-white">Up to 2,500 Leads / Month</span></li>
                            </ul>
                        </div>

                        <button
                            className="btn btn-primary w-full py-3 text-lg font-bold shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                            onClick={() => handleUpgrade('PRO')}
                            disabled={isCheckoutLoading}
                        >
                            {isCheckoutLoading ? 'Initializing...' : 'Upgrade to PRO'}
                        </button>
                    </div>

                    {/* SUPER TIER */}
                    <div className="glass-panel p-8 rounded-2xl border border-white/10 flex flex-col relative animate-fade-in-up hover:border-purple-500/50 transition-all duration-300" style={{ animationDelay: '0.2s' }}>
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold flex items-center gap-2 mb-2"><Crown className="text-purple-400" /> SUPER</h3>
                            <div className="text-purple-200/70 mb-4 h-12">Enterprise infrastructure for multi-market domination.</div>
                            <div className="text-4xl font-extrabold mb-1">$297<span className="text-xl text-purple-300/50 font-normal"> /mo</span></div>
                            <div className="text-sm text-purple-400/50">Billed monthly.</div>
                        </div>

                        <div className="flex-grow">
                            <p className="font-bold text-sm text-purple-300/70 mb-4 uppercase tracking-wider">Everything in Pro, plus:</p>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-start gap-3"><CheckCircle2 className="text-purple-400 shrink-0" size={20} /> <span className="text-white">Unlimited Active Leads</span></li>
                                <li className="flex items-start gap-3"><CheckCircle2 className="text-purple-400 shrink-0" size={20} /> <span className="text-white">Unlimited Radar Datasets</span></li>
                                <li className="flex items-start gap-3"><CheckCircle2 className="text-purple-400 shrink-0" size={20} /> <span className="text-white">Advanced Webhook Automations</span></li>
                                <li className="flex items-start gap-3"><CheckCircle2 className="text-purple-400 shrink-0" size={20} /> <span className="text-white">Third-party API Keys (Beta)</span></li>
                                <li className="flex items-start gap-3"><CheckCircle2 className="text-purple-400 shrink-0" size={20} /> <span className="text-white">White-Glove Priority Support</span></li>
                            </ul>
                        </div>

                        <button
                            className="btn btn-secondary w-full py-3 border-purple-500/30 hover:bg-purple-500/10 hover:text-white"
                            onClick={() => handleUpgrade('SUPER')}
                            disabled={isCheckoutLoading}
                        >
                            {isCheckoutLoading ? 'Initializing...' : 'Upgrade to SUPER'}
                        </button>
                    </div>

                </div>

                {user && (
                    <div className="text-center mt-12 animate-fade-in">
                        <Link to="/dashboard" className="text-indigo-400 hover:text-indigo-300 underline font-medium">
                            Return to Dashboard
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Pricing;

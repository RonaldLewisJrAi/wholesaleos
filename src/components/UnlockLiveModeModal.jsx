import React, { useState } from 'react';
import { CreditCard, CheckCircle, ShieldCheck, Lock, X, Zap, Key } from 'lucide-react';
import { useDemoMode } from '../contexts/DemoModeContext';
import { useSubscription } from '../contexts/useSubscription';
import { useNavigate } from 'react-router-dom';
import './UnlockLiveModeModal.css';

const UnlockLiveModeModal = ({ isOpen, onClose }) => {
    const { setIsDemoMode } = useDemoMode();
    const { setSubscriptionTier } = useSubscription();
    const navigate = useNavigate();

    // Steps: 1 = Payment Options, 2 = Processing, 3 = Account Creation
    const [step, setStep] = useState(1);
    const [selectedTier, setSelectedTier] = useState('pro');
    const [selectedPersona, setSelectedPersona] = useState('WHOLESALER');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [accountData, setAccountData] = useState({ password: '', confirmPassword: '' });
    const [promoCode, setPromoCode] = useState('');
    const [isApplyingPromo, setIsApplyingPromo] = useState(false);

    if (!isOpen) return null;

    const handleCheckout = async () => {
        setStep(2);

        let priceId = '';
        if (selectedTier === 'starter') priceId = import.meta.env.VITE_STRIPE_BASIC_PRICE_ID;
        if (selectedTier === 'pro') priceId = import.meta.env.VITE_STRIPE_ADVANCED_PRICE_ID;
        if (selectedTier === 'super' || selectedTier === 'elite') priceId = import.meta.env.VITE_STRIPE_SUPER_PRICE_ID;

        try {
            // Native relative Vercel API path
            const response = await fetch(`/api/stripe/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    priceId: priceId,
                    userEmail: 'demo@wholesale-os.com', // Placeholder for initialization
                    userId: '00000000-0000-0000-0000-000000000000', // Placeholder auth ID until actual signup
                    persona: selectedPersona,
                    tier: selectedTier === 'starter' ? 'BASIC' : (selectedTier === 'pro' ? 'ADVANCED' : 'SUPER'),
                    tosAccepted: termsAccepted
                })
            });
            const data = await response.json();
            if (data.url) {
                // Redirect immediately to Stripe's massively secure Hosted Checkout
                window.location.href = data.url;
            } else {
                alert('Checkout failed: ' + data.error);
                setStep(1);
            }
        } catch (err) {
            console.error(err);
            alert('Could not connect to billing backend proxy.');
            setStep(1);
        }
    };

    const handleAccountCreation = (e) => {
        e.preventDefault();
        if (accountData.password !== accountData.confirmPassword) {
            alert('Passwords do not match.');
            return;
        }

        // Unlock App
        setIsDemoMode(false);
        onClose();

        // Redirect to profile
        // Added a short timeout to let the modal fully unmount before navigation to avoid trapped state issues
        setTimeout(() => {
            navigate('/profile');
        }, 100);
    };

    const handlePromoRedemption = async () => {
        if (!promoCode.trim()) return;
        setIsApplyingPromo(true);

        try {
            // Simulate backend validation delay
            await new Promise(resolve => setTimeout(resolve, 800));

            // In production, this would call Supabase to validate the code against `temporary_access_codes`
            // and return the associated tier.
            if (promoCode.toUpperCase() === 'VIP2026') {
                setSubscriptionTier('SUPER');
                setStep(3); // Skip Stripe checkout entirely
            } else if (promoCode.toUpperCase() === 'BETAACCESS') {
                setSubscriptionTier('ADVANCED');
                setStep(3);
            } else {
                alert('Invalid or expired Live Access Code.');
            }
        } catch (error) {
            console.error('Promo Code Error:', error);
            alert('Could not validate Promo Code.');
        } finally {
            setIsApplyingPromo(false);
        }
    };

    return (
        <div className="modal-overlay live-mode-overlay animate-fade-in" style={{ zIndex: 9999999 }}>
            <div className="modal-content live-mode-modal">
                <button className="icon-btn-small modal-close-btn" onClick={onClose}><X size={20} /></button>

                {step === 1 && (
                    <div className="checkout-step animate-slide-up">
                        <div className="modal-header text-center mb-6">
                            <ShieldCheck size={48} className="text-primary mx-auto mb-3" />
                            <h2 className="text-2xl font-bold">Unlock Live Pipeline Data</h2>
                            <p className="text-muted text-sm mt-2">You are currently viewing simulated demo data. Upgrade to connect your live property feeds and CRM.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            {/* Starter Card */}
                            <div
                                className={`pricing-card flex flex-col p-6 rounded-xl border-2 transition-all cursor-pointer ${selectedTier === 'starter' ? 'border-primary bg-primary/10 scale-105 shadow-lg shadow-primary/20 z-10' : 'border-[var(--border-light)] bg-black/20 hover:border-gray-500 opacity-70 hover:opacity-100'}`}
                                onClick={() => setSelectedTier('starter')}
                            >
                                <h3 className="text-xl font-bold mb-1">Starter</h3>
                                <div className="text-3xl font-black text-white mb-2">$100<span className="text-sm font-normal text-muted">/mo</span></div>
                                <p className="text-xs text-muted mb-6 min-h-[40px]">Perfect for solo wholesalers getting started with data acquisition.</p>
                                <ul className="text-sm space-y-3 mb-6 flex-1">
                                    <li className="flex gap-2 items-center"><CheckCircle size={16} className="text-success shrink-0" /> <span><strong>25</strong> Live Scrape Leads</span></li>
                                    <li className="flex gap-2 items-center"><CheckCircle size={16} className="text-success shrink-0" /> <span><strong>1</strong> Team Seat</span></li>
                                    <li className="flex gap-2 items-center"><CheckCircle size={16} className="text-success shrink-0" /> <span>Wholesaler Persona</span></li>
                                    <li className="flex gap-2 items-center text-muted"><X size={16} className="shrink-0" /> <span>No API Access</span></li>
                                    <li className="flex gap-2 items-center text-muted"><X size={16} className="shrink-0" /> <span>No Webhooks</span></li>
                                </ul>
                                <div className={`mt-auto py-2.5 text-center rounded-lg text-sm font-bold transition-colors ${selectedTier === 'starter' ? 'bg-primary text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>Select Starter</div>
                            </div>

                            {/* Pro Card */}
                            <div
                                className={`pricing-card flex flex-col p-6 rounded-xl border-2 transition-all cursor-pointer relative ${selectedTier === 'pro' ? 'border-accent bg-accent/10 scale-105 shadow-lg shadow-accent/20 z-10' : 'border-[var(--border-light)] bg-black/20 hover:border-gray-500 opacity-70 hover:opacity-100'}`}
                                onClick={() => setSelectedTier('pro')}
                            >
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap shadow-sm">MOST POPULAR</div>
                                <h3 className="text-xl font-bold mb-1">Pro</h3>
                                <div className="text-3xl font-black text-white mb-2">$500<span className="text-sm font-normal text-muted">/mo</span></div>
                                <p className="text-xs text-muted mb-6 min-h-[40px]">Scale your operation with multiple seats, CRM integration, and API access.</p>
                                <ul className="text-sm space-y-3 mb-6 flex-1">
                                    <li className="flex gap-2 items-center"><CheckCircle size={16} className="text-success shrink-0" /> <span><strong>Unlimited</strong> Scraping</span></li>
                                    <li className="flex gap-2 items-center"><CheckCircle size={16} className="text-success shrink-0" /> <span><strong>3</strong> Team Seats</span></li>
                                    <li className="flex gap-2 items-center"><CheckCircle size={16} className="text-success shrink-0" /> <span>Wholesaler & Investor</span></li>
                                    <li className="flex gap-2 items-center"><CheckCircle size={16} className="text-success shrink-0" /> <span>Read-Only API</span></li>
                                    <li className="flex gap-2 items-center"><CheckCircle size={16} className="text-success shrink-0" /> <span><strong>5</strong> Webhook Targets</span></li>
                                </ul>
                                <div className={`mt-auto py-2.5 text-center rounded-lg text-sm font-bold transition-colors ${selectedTier === 'pro' ? 'bg-accent text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>Select Pro</div>
                            </div>

                            {/* Super Card */}
                            <div
                                className={`pricing-card flex flex-col p-6 rounded-xl border-2 transition-all cursor-pointer ${selectedTier === 'super' ? 'border-purple-500 bg-purple-500/10 scale-105 shadow-lg shadow-purple-500/20 z-10' : 'border-[var(--border-light)] bg-black/20 hover:border-gray-500 opacity-70 hover:opacity-100'}`}
                                onClick={() => setSelectedTier('super')}
                            >
                                <h3 className="text-xl font-bold mb-1 text-purple-400">Super</h3>
                                <div className="text-3xl font-black text-white mb-2">$1k<span className="text-sm font-normal text-muted">/mo</span></div>
                                <p className="text-xs text-muted mb-6 min-h-[40px]">Complete ecosystem access for enterprise teams needing raw power and AI.</p>
                                <ul className="text-sm space-y-3 mb-6 flex-1">
                                    <li className="flex gap-2 items-center"><CheckCircle size={16} className="text-success shrink-0" /> <span><strong>Unlimited</strong> Scraping</span></li>
                                    <li className="flex gap-2 items-center"><CheckCircle size={16} className="text-success shrink-0" /> <span><strong>10</strong> Team Seats</span></li>
                                    <li className="flex gap-2 items-center"><CheckCircle size={16} className="text-success shrink-0" /> <span><strong>All</strong> Personas</span></li>
                                    <li className="flex gap-2 items-center"><CheckCircle size={16} className="text-success shrink-0" /> <span>Full Read/Write API</span></li>
                                    <li className="flex gap-2 items-center"><CheckCircle size={16} className="text-success shrink-0" /> <span><strong>Unlimited</strong> Webhooks</span></li>
                                    <li className="flex gap-2 items-center font-semibold text-purple-300"><Zap size={16} className="text-warning fill-warning shrink-0" /> <span>Predictive Intelligence</span></li>
                                </ul>
                                <div className={`mt-auto py-2.5 text-center rounded-lg text-sm font-bold transition-colors ${selectedTier === 'super' ? 'bg-purple-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>Select Super</div>
                            </div>
                        </div>

                        <div className="mock-payment-form bg-[rgba(0,0,0,0.2)] p-4 rounded-lg mb-6 border border-[var(--border-light)]">
                            <h4 className="text-sm font-bold mb-3 flex items-center gap-2"><CreditCard size={16} /> Payment Method (Test Mode)</h4>
                            <div className="space-y-3">
                                <input type="text" className="fillable-input w-full" placeholder="Card Number (4242 4242...)" defaultValue="4242 4242 4242 4242" />
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="text" className="fillable-input w-full" placeholder="MM/YY" defaultValue="12/28" />
                                    <input type="text" className="fillable-input w-full" placeholder="CVC" defaultValue="123" />
                                </div>

                                <label className="flex items-start gap-2 cursor-pointer mt-3 border-t border-[var(--border-light)] pt-3">
                                    <input
                                        type="checkbox"
                                        className="mt-[2px] cursor-pointer accent-primary"
                                        checked={termsAccepted}
                                        onChange={(e) => setTermsAccepted(e.target.checked)}
                                    />
                                    <span className="text-[10.5px] text-muted leading-tight">
                                        I accept the <a href="#" className="text-primary hover:underline">Enterprise Terms of Service</a>, AI Liability Waiver, Data Purge policies, and Master Subscription Agreement.
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="persona-selection mb-6 p-4 bg-[rgba(0,0,0,0.2)] rounded-lg border border-[var(--border-light)]">
                            <h4 className="text-sm font-bold mb-3 flex items-center gap-2"><Lock size={16} /> Select Your Platform Persona</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    className={`btn ${selectedPersona === 'WHOLESALER' ? 'btn-primary' : 'btn-secondary'} py-2 flex items-center justify-center gap-2`}
                                    onClick={() => setSelectedPersona('WHOLESALER')}
                                >
                                    <CheckCircle size={16} className={selectedPersona === 'WHOLESALER' ? 'opacity-100' : 'opacity-0'} /> Wholesaler
                                </button>
                                <button
                                    className={`btn ${selectedPersona === 'INVESTOR' ? 'btn-primary' : 'btn-secondary'} py-2 flex items-center justify-center gap-2`}
                                    onClick={() => setSelectedPersona('INVESTOR')}
                                >
                                    <CheckCircle size={16} className={selectedPersona === 'INVESTOR' ? 'opacity-100' : 'opacity-0'} /> VIP Investor
                                </button>
                            </div>
                        </div>


                        <button
                            className="btn btn-primary w-full text-lg py-3 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleCheckout}
                            disabled={!termsAccepted}
                        >
                            <Lock size={18} /> Process Secure Payment
                        </button>

                        <div className="promo-code-section mt-6 pt-6 border-t border-[var(--border-light)]">
                            <label className="block text-xs uppercase tracking-wide text-muted mb-2 font-bold flex items-center gap-2">
                                <Key size={14} /> Have a Live Access Code?
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="fillable-input flex-1 uppercase font-mono"
                                    placeholder="ENTER PROMO CODE"
                                    value={promoCode}
                                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                />
                                <button
                                    className="btn btn-secondary whitespace-nowrap"
                                    onClick={handlePromoRedemption}
                                    disabled={!promoCode.trim() || isApplyingPromo}
                                >
                                    {isApplyingPromo ? 'Validating...' : 'Apply Code'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="processing-step text-center py-12 animate-fade-in">
                        <div className="spinner-border text-primary mx-auto mb-4" style={{ width: '3rem', height: '3rem', borderWidth: '4px' }}></div>
                        <h3 className="text-xl font-bold mb-2">Processing Payment...</h3>
                        <p className="text-muted">Contacting Stripe in Test Mode.</p>
                    </div>
                )}

                {step === 3 && (
                    <div className="account-creation-step animate-slide-up text-center">
                        <CheckCircle size={56} className="text-success mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
                        <p className="text-muted text-sm mb-6">Your Live Mode subscription is active. Please secure your account with a password.</p>

                        <form onSubmit={handleAccountCreation} className="text-left space-y-4">
                            <div>
                                <label className="block text-xs uppercase text-muted mb-1 font-bold">Email Address</label>
                                <input type="email" className="fillable-input w-full" value="demo@wholesale-os.com" disabled />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-muted mb-1 font-bold">Create Password</label>
                                <input
                                    type="password"
                                    className="fillable-input w-full"
                                    placeholder="••••••••"
                                    required
                                    value={accountData.password}
                                    onChange={(e) => setAccountData({ ...accountData, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-muted mb-1 font-bold">Confirm Password</label>
                                <input
                                    type="password"
                                    className="fillable-input w-full"
                                    placeholder="••••••••"
                                    required
                                    value={accountData.confirmPassword}
                                    onChange={(e) => setAccountData({ ...accountData, confirmPassword: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="btn btn-primary w-full text-lg py-3 mt-4 flex justify-center items-center gap-2">
                                <Zap size={18} /> Enter Live Mode
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UnlockLiveModeModal;

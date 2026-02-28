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

                        <div className="pricing-tiers flex flex-col gap-2 mb-6 bg-[rgba(0,0,0,0.1)] p-4 rounded-xl border border-[var(--border-light)]">
                            <div className="grid grid-cols-4 gap-2 text-sm text-center font-bold pb-2 border-b border-[var(--border-light)] text-muted">
                                <div className="text-left font-bold text-white uppercase tracking-wider text-xs pt-1">Features</div>
                                <div className={`cursor-pointer pb-2 ${selectedTier === 'starter' ? 'text-primary border-b-2 border-primary' : 'hover:text-gray-300 transition-colors'}`} onClick={() => setSelectedTier('starter')}>Basic<div className="text-lg text-white">$100</div></div>
                                <div className={`cursor-pointer pb-2 ${selectedTier === 'pro' ? 'text-accent border-b-2 border-accent' : 'hover:text-gray-300 transition-colors'}`} onClick={() => setSelectedTier('pro')}>Pro<div className="text-lg text-white">$500</div></div>
                                <div className={`cursor-pointer pb-2 ${selectedTier === 'super' ? 'text-purple-400 border-b-2 border-purple-400' : 'hover:text-gray-300 transition-colors'}`} onClick={() => setSelectedTier('super')}>Super<div className="text-lg text-white">$1k</div></div>
                            </div>

                            {/* CRM Limits */}
                            <div className="grid grid-cols-4 gap-2 text-xs py-2 border-b border-[var(--border-light)] hover:bg-[rgba(255,255,255,0.02)] items-center">
                                <div className="text-left font-medium text-gray-400">Live Scraping Leads</div>
                                <div className="text-center font-mono">25 / mo</div>
                                <div className="text-center text-accent font-bold">Unlimited</div>
                                <div className="text-center text-purple-400 font-bold">Unlimited</div>
                            </div>

                            {/* Seat Limits */}
                            <div className="grid grid-cols-4 gap-2 text-xs py-2 border-b border-[var(--border-light)] hover:bg-[rgba(255,255,255,0.02)] items-center">
                                <div className="text-left font-medium text-gray-400">Team Seats</div>
                                <div className="text-center font-mono">1 Seat</div>
                                <div className="text-center text-accent font-bold">3 Seats</div>
                                <div className="text-center text-purple-400 font-bold">10 Seats</div>
                            </div>

                            {/* Persona Access */}
                            <div className="grid grid-cols-4 gap-2 text-xs py-2 border-b border-[var(--border-light)] hover:bg-[rgba(255,255,255,0.02)] items-center">
                                <div className="text-left font-medium text-gray-400">Persona Access</div>
                                <div className="text-center">Wholesaler Only</div>
                                <div className="text-center text-accent font-bold">+ Investor</div>
                                <div className="text-center text-purple-400 font-bold">All Personas</div>
                            </div>

                            {/* API Access */}
                            <div className="grid grid-cols-4 gap-2 text-xs py-2 border-b border-[var(--border-light)] hover:bg-[rgba(255,255,255,0.02)] items-center">
                                <div className="text-left font-medium text-gray-400">API Generation</div>
                                <div className="text-center text-gray-600">-</div>
                                <div className="text-center text-accent font-bold">Read-Only API</div>
                                <div className="text-center text-purple-400 font-bold">Full Read/Write</div>
                            </div>

                            {/* Integrations */}
                            <div className="grid grid-cols-4 gap-2 text-xs py-2 border-b border-[var(--border-light)] hover:bg-[rgba(255,255,255,0.02)] items-center">
                                <div className="text-left font-medium text-gray-400">Integrations (Webhooks)</div>
                                <div className="text-center text-gray-600">-</div>
                                <div className="text-center text-accent font-bold">Max 5 Targets</div>
                                <div className="text-center text-purple-400 font-bold">Unlimited</div>
                            </div>

                            {/* Predictive Intelligence */}
                            <div className="grid grid-cols-4 gap-2 text-xs py-3 hover:bg-[rgba(255,255,255,0.02)] items-center">
                                <div className="text-left font-medium text-gray-400">Predictive Intelligence</div>
                                <div className="text-center text-gray-600">-</div>
                                <div className="text-center text-gray-600">-</div>
                                <div className="text-center text-purple-400 font-bold">Risk Matrices + AI</div>
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

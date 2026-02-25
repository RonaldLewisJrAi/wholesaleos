import React, { useState } from 'react';
import { CreditCard, CheckCircle, ShieldCheck, Lock, X, ChevronRight, Zap, Key } from 'lucide-react';
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
                    userEmail: 'Ronald_Lewis_Jr@live.com', // Mapped to Founder Email for initialization
                    userId: '00000000-0000-0000-0000-000000000000' // Placeholder auth ID until actual signup
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
        navigate('/profile');
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

                        <div className="pricing-tiers grid grid-cols-3 gap-4 mb-6">
                            <div
                                className={`pricing-card ${selectedTier === 'starter' ? 'active' : ''}`}
                                onClick={() => setSelectedTier('starter')}
                            >
                                <div className="text-left w-full">
                                    <h3 className="font-bold text-lg mb-1">Starter</h3>
                                    <div className="price font-bold text-2xl mb-3">$100<span className="text-sm font-normal text-muted">/mo</span></div>
                                    <ul className="text-xs text-muted space-y-2">
                                        <li><CheckCircle size={12} className="inline mr-1 text-success" /> 25 Live Scrape Leads</li>
                                        <li><CheckCircle size={12} className="inline mr-1 text-success" /> Basic CRM Access</li>
                                    </ul>
                                </div>
                            </div>

                            <div
                                className={`pricing-card recommended ${selectedTier === 'pro' ? 'active' : ''}`}
                                onClick={() => setSelectedTier('pro')}
                            >
                                <div className="recommend-badge">RECOMMENDED</div>
                                <div className="text-left w-full">
                                    <h3 className="font-bold text-lg mb-1 text-primary">Pro</h3>
                                    <div className="price font-bold text-2xl mb-3">$500<span className="text-sm font-normal text-muted">/mo</span></div>
                                    <ul className="text-xs text-muted space-y-2">
                                        <li><CheckCircle size={12} className="inline mr-1 text-success" /> Unlimited Live CRM</li>
                                        <li><CheckCircle size={12} className="inline mr-1 text-success" /> AI Document Extraction</li>
                                    </ul>
                                </div>
                            </div>

                            <div
                                className={`pricing-card ${selectedTier === 'super' ? 'active' : ''}`}
                                onClick={() => setSelectedTier('super')}
                            >
                                <div className="text-left w-full">
                                    <h3 className="font-bold text-lg mb-1 text-accent">Super</h3>
                                    <div className="price font-bold text-2xl mb-3">$1,000<span className="text-sm font-normal text-muted">/mo</span></div>
                                    <ul className="text-xs text-muted space-y-2">
                                        <li><CheckCircle size={12} className="inline mr-1 text-success" /> Preforeclosure Radar</li>
                                        <li><CheckCircle size={12} className="inline mr-1 text-success" /> Live Zillow Comps</li>
                                    </ul>
                                </div>
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
                            </div>
                        </div>

                        <button className="btn btn-primary w-full text-lg py-3 flex justify-center items-center gap-2" onClick={handleCheckout}>
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
                                <input type="email" className="fillable-input w-full" value="ronal@example.com" disabled />
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

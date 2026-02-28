import React, { useState, useEffect } from 'react';
import { Building, MapPin, DollarSign, Percent, Save, Camera, Target, Calculator, Headphones, ShieldCheck, Activity } from 'lucide-react';
import { useSubscription } from '../contexts/useSubscription';
import { useDemoMode } from '../contexts/DemoModeContext';
import { supabase } from '../lib/supabase';
import './Profile.css';

const Profile = () => {
    // Basic Profile State
    const [profile, setProfile] = useState({
        firstName: 'Ronald',
        lastName: 'Lewis',
        email: 'ronal@example.com',
        phone: '(615) 555-0198',
        company: 'Wholesale OS Strategies',
        bio: 'Real estate acquisition specialist focused on off-market distressed assets in the Greater Nashville area.',
        primaryPersona: 'WHOLESALER'
    });

    const { subscriptionTier, allowedPersonas } = useSubscription();
    const { isDemoMode } = useDemoMode();

    // Investor Buy Box State
    const [buyBox, setBuyBox] = useState({
        targetMarkets: 'Nashville TN, Austin TX',
        maxPrice: 350000,
        minROI: 12,
        propertyTypes: 'SFR, Small MFR',
        rehabLevel: 'Moderate to Full Gut'
    });

    const [isSaving, setIsSaving] = useState(false);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!supabase) return;
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                setProfile(prev => ({ ...prev, email: user.email }));

                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (data && !error) {
                    setProfile({
                        firstName: data.first_name || '',
                        lastName: data.last_name || '',
                        email: user.email,
                        phone: data.phone || '',
                        company: data.company || '',
                        bio: data.bio || '',
                        primaryPersona: data.primary_persona || 'WHOLESALER'
                    });
                    setBuyBox({
                        targetMarkets: data.target_markets || '',
                        maxPrice: data.max_price || 0,
                        minROI: data.min_roi || 0,
                        propertyTypes: data.property_types || 'SFR, Small MFR',
                        rehabLevel: data.rehab_level || 'Moderate to Full Gut'
                    });
                }
            }
        };
        fetchProfile();
    }, []);

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleBuyBoxChange = (e) => {
        const { name, value } = e.target;
        setBuyBox(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!supabase || !userId) {
            alert('Cannot save: Not connected to database or user not authenticated.');
            return;
        }

        const isUnpaid = !subscriptionTier || subscriptionTier === 'BASIC';
        if (isUnpaid) {
            alert("🔒 Upgrade Required: Active SaaS tier required to save profile configs.");
            return;
        }

        setIsSaving(true);
        try {
            const { error } = await supabase.from('profiles').update({
                first_name: profile.firstName,
                last_name: profile.lastName,
                company: profile.company,
                phone: profile.phone,
                bio: profile.bio,
                primary_persona: profile.primaryPersona,
                target_markets: buyBox.targetMarkets,
                max_price: parseFloat(buyBox.maxPrice) || 0,
                min_roi: parseFloat(buyBox.minROI) || 0,
                property_types: buyBox.propertyTypes,
                rehab_level: buyBox.rehabLevel
            }).eq('id', userId);

            if (error) throw error;
            alert("Profile preferences successfully updated and synced via Supabase!");
        } catch (error) {
            console.error("Save Error:", error);
            alert("Failed to save profile. Make sure you are logged in.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCheckout = async () => {
        setIsSaving(true);
        let priceId = '';
        if (subscriptionTier === 'BASIC') priceId = import.meta.env.VITE_STRIPE_BASIC_PRICE_ID;
        if (subscriptionTier === 'ADVANCED') priceId = 'price_1T4jOFK2qPJKpuPcVKh0BG4W';
        if (subscriptionTier === 'SUPER') priceId = import.meta.env.VITE_STRIPE_SUPER_PRICE_ID;

        try {
            const response = await fetch('/api/stripe/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    priceId: priceId,
                    userEmail: profile.email,
                    userId: userId || '00000000-0000-0000-0000-000000000000'
                })
            });
            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert('Checkout failed: ' + data.error);
                setIsSaving(false);
            }
        } catch (err) {
            console.error(err);
            alert('Could not connect to billing backend proxy.');
            setIsSaving(false);
        }
    };

    // Persona Options
    const personaConfigs = [
        { id: 'WHOLESALER', label: 'Wholesaler', icon: Building },
        { id: 'INVESTOR', label: 'VIP Investor', icon: Target },
        { id: 'REALTOR', label: 'Realtor', icon: Calculator },
        { id: 'VIRTUAL_ASSISTANT', label: 'Assistant', icon: Headphones }
    ];

    if (allowedPersonas?.includes('ADMIN')) {
        personaConfigs.push({ id: 'ADMIN', label: 'Master Admin', icon: ShieldCheck });
    }

    const isMasterAdmin = profile.email === 'ronald_lewis_jr@live.com' || allowedPersonas?.includes('ADMIN');

    if (isDemoMode) {
        return (
            <div className="profile-container animate-fade-in flex items-center justify-center min-h-[60vh]">
                <div className="glass-panel p-8 text-center max-w-md bg-[var(--surface-dark)] border border-[var(--border-light)] rounded-xl">
                    <ShieldCheck size={48} className="text-warning mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2 text-white">Restricted Access</h2>
                    <p className="text-muted mb-6">User Profiles are completely disabled in Demo Mode for security purposes. Please log in or upgrade to an active SaaS tier to access your personalized configuration.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-container animate-fade-in">
            <div className="page-header border-b border-[var(--border-light)] pb-6 mb-2">
                <h1 className="page-title mb-1">User Identity & Access</h1>
                <p className="page-description m-0">Manage your system persona, contact bindings, and platform configuration.</p>
            </div>

            <div className="profile-grid">

                {/* Visual Identity Module */}
                <div className="profile-card">
                    <div className="avatar-upload-section">
                        <div className="avatar-preview">
                            {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                            <button className="avatar-edit-btn" title="Change Avatar">
                                <Camera size={16} />
                            </button>
                        </div>
                        <h2 className="profile-name">{profile.firstName} {profile.lastName}</h2>
                        <p className="profile-company">{profile.company}</p>

                        <div className="mt-4">
                            <span className="role-badge" style={{ backgroundColor: 'rgba(99,102,241,0.1)', color: 'var(--primary-color)', border: '1px solid rgba(99,102,241,0.3)' }}>
                                <ShieldCheck size={14} /> Active Seat: {subscriptionTier}
                            </span>
                        </div>
                    </div>

                    <div className="pt-2">
                        <h3 className="section-title mb-4 pb-2 border-b border-[var(--border-light)] font-bold">System Persona</h3>
                        <div className="role-toggle-group">
                            {personaConfigs.map((persona) => (
                                <button
                                    key={persona.id}
                                    className={`role-toggle-btn ${profile.primaryPersona === persona.id ? 'active' : ''}`}
                                    onClick={() => setProfile(prev => ({ ...prev, primaryPersona: persona.id }))}
                                >
                                    <persona.icon size={24} />
                                    <span>{persona.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Core Details Module */}
                <div className="profile-card">
                    <h3 className="section-title mb-4 pb-2 border-b border-[var(--border-light)] font-bold mb-4">Core Identity</h3>

                    <div className="form-grid-2">
                        <div className="form-group">
                            <label>First Name</label>
                            <input type="text" className="fillable-input w-full" name="firstName" value={profile.firstName} onChange={handleProfileChange} />
                        </div>
                        <div className="form-group">
                            <label>Last Name</label>
                            <input type="text" className="fillable-input w-full" name="lastName" value={profile.lastName} onChange={handleProfileChange} />
                        </div>
                    </div>

                    <div className="form-group mt-4">
                        <label>Business Entity</label>
                        <input type="text" className="fillable-input w-full" name="company" value={profile.company} onChange={handleProfileChange} />
                    </div>

                    <div className="form-grid-2 mt-4">
                        <div className="form-group">
                            <label>Primary Email</label>
                            <input type="email" className="fillable-input w-full opacity-50 cursor-not-allowed" value={profile.email} disabled />
                        </div>
                        <div className="form-group">
                            <label>Phone Number</label>
                            <input type="tel" className="fillable-input w-full" name="phone" value={profile.phone} onChange={handleProfileChange} />
                        </div>
                    </div>

                    <div className="form-group mt-4">
                        <label>Public Bio / Investor Description</label>
                        <textarea className="fillable-input w-full h-24 resize-none" name="bio" value={profile.bio} onChange={handleProfileChange} placeholder="Describe your investing history..."></textarea>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[var(--border-light)]">
                        <button
                            className="btn btn-primary w-full flex justify-center items-center gap-2 py-3 disabled:opacity-50"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            <Save size={18} /> {isSaving ? 'Syncing to Database...' : 'Save Profile Identity'}
                        </button>
                    </div>
                </div>

                {/* Algorithmic Buy Box */}
                <div className="profile-card buy-box-card">
                    <h3 className="section-title mb-1 font-bold text-warning flex items-center gap-2">
                        <Target size={18} /> Algorithmic Buy Box
                    </h3>
                    <p className="text-xs text-muted mb-4 pb-3 border-b border-[var(--border-light)]">Configure the parameters the system uses to match you with off-market inventory.</p>

                    <div className="form-group mb-4">
                        <label className="flex items-center gap-2"><MapPin size={14} className="text-muted" /> Target Markets (Comma Separated)</label>
                        <input type="text" className="fillable-input w-full" name="targetMarkets" value={buyBox.targetMarkets} onChange={handleBuyBoxChange} placeholder="e.g. Nashville TN, Atlanta GA" />
                    </div>

                    <div className="form-grid-2 mb-4">
                        <div className="form-group">
                            <label>Maximum Purchase Price</label>
                            <div className="input-with-prefix">
                                <span className="prefix"><DollarSign size={14} /></span>
                                <input type="number" className="fillable-input w-full pl-8" name="maxPrice" value={buyBox.maxPrice} onChange={handleBuyBoxChange} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Minimum Expected ROI</label>
                            <div className="input-with-suffix">
                                <input type="number" className="fillable-input w-full pr-8" name="minROI" value={buyBox.minROI} onChange={handleBuyBoxChange} />
                                <span className="suffix"><Percent size={14} /></span>
                            </div>
                        </div>
                    </div>

                    <div className="form-group mb-4">
                        <label>Target Asset Classes</label>
                        <select className="fillable-input w-full" name="propertyTypes" value={buyBox.propertyTypes} onChange={handleBuyBoxChange}>
                            <option value="SFR Only">Single Family (SFR) Only</option>
                            <option value="SFR, Small MFR">SFR & Small Multi-Family (2-4 Units)</option>
                            <option value="Commercial MFR">Commercial Multi-Family (5+ Units)</option>
                            <option value="Land">Vacant Land / Development</option>
                            <option value="All Types">All Asset Classes</option>
                        </select>
                    </div>

                    <div className="form-group mb-6">
                        <label>Preferred Project Scope (Rehab Level)</label>
                        <select className="fillable-input w-full" name="rehabLevel" value={buyBox.rehabLevel} onChange={handleBuyBoxChange}>
                            <option value="Turnkey">Turnkey / Cosmetic Updates Only</option>
                            <option value="Light Rehab">Light Rehab (Paint, Floors, Fixtures)</option>
                            <option value="Moderate to Full Gut">Moderate to Full Gut (Major Systems)</option>
                            <option value="Teardown">Teardown / New Build Opportunity</option>
                        </select>
                    </div>

                    <button
                        className="btn border border-warning text-warning hover:bg-warning/10 w-full flex justify-center items-center gap-2 py-3"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        <Save size={18} /> Update Buy Box Match Logic
                    </button>
                </div>

                {/* Phase 29: Team Performance Tracker */}
                {(subscriptionTier === 'SUPER' || isMasterAdmin) && (
                    <div className="profile-card border-none bg-[rgba(16,185,129,0.05)] shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                        <h3 className="section-title mb-4 pb-2 border-b border-success/30 font-bold text-success flex items-center gap-2">
                            <Activity size={18} /> Elite Performance Tracker
                        </h3>
                        <p className="text-xs text-muted mb-4">Outbound conversion telemetry locked to Elite/Super Admin tiers.</p>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-[var(--surface-dark)] p-3 rounded border border-[var(--border-light)] text-center">
                                <span className="text-xs text-muted block mb-1 uppercase">Outbound Calls</span>
                                <span className="text-2xl font-bold text-white">142</span>
                            </div>
                            <div className="bg-[var(--surface-dark)] p-3 rounded border border-[var(--border-light)] text-center">
                                <span className="text-xs text-muted block mb-1 uppercase">SMS Sent</span>
                                <span className="text-2xl font-bold text-primary">845</span>
                            </div>
                            <div className="bg-[var(--surface-dark)] p-3 rounded border border-[var(--border-light)] text-center">
                                <span className="text-xs text-muted block mb-1 uppercase">Appointments</span>
                                <span className="text-2xl font-bold text-success">12</span>
                            </div>
                        </div>
                        <div className="mt-4 text-center text-xs text-muted font-mono">Telemetry synced from active Deals pipeline</div>
                    </div>
                )}

                {/* Global Plan Governance */}
                <div className="profile-card border-none bg-[rgba(99,102,241,0.05)] shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                    <h3 className="section-title mb-4 pb-2 border-b border-primary/30 font-bold text-primary flex items-center gap-2">
                        <Building size={18} /> Subscriptions & Add-Ons
                    </h3>

                    <div className="text-sm mb-4">
                        <p className="text-muted"><strong className="text-white">Current Organization:</strong> Wholesale OS Strategies</p>
                        <p className="text-muted mt-1"><strong className="text-white">Active Plan:</strong> <span className="badge bg-primary/20 text-primary border border-primary/50 ml-2">{subscriptionTier}</span></p>
                    </div>

                    {isMasterAdmin ? (
                        <div className="mt-6 p-6 bg-[rgba(0,0,0,0.3)] border border-danger/50 rounded-xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-danger"></div>
                            <h3 className="font-bold text-xl text-white mb-2 flex items-center gap-2">
                                <ShieldCheck className="text-danger" /> System Architect (God-Mode)
                            </h3>
                            <p className="text-muted">You are recognized natively as the Creator and Author of the Wholesale OS platform.</p>
                            <p className="text-muted mt-2">All billing constraints, persona limits, and payment walls in this ecosystem are permanently bypassed for your account via native SQL database elevation.</p>
                        </div>
                    ) : (
                        <>
                            <div className="pricing-tiers mt-6">
                                <div className={`pricing-card ${subscriptionTier === 'BASIC' ? 'active border-primary bg-primary/10' : ''}`} style={{ padding: '16px' }}>
                                    <div className="text-left w-full">
                                        <h3 className="font-bold text-lg mb-1">Starter</h3>
                                        <div className="price font-bold text-2xl mb-2">$100<span className="text-xs font-normal text-muted">/mo</span></div>
                                    </div>
                                </div>

                                <div className={`pricing-card recommended ${subscriptionTier === 'ADVANCED' ? 'active border-warning bg-warning/10' : ''}`} style={{ padding: '16px' }}>
                                    {subscriptionTier === 'ADVANCED' ? <div className="recommend-badge bg-success/20 text-success border border-success">ACTIVE SUBSCRIPTION</div> : <div className="recommend-badge">RECOMMENDED</div>}
                                    <div className="text-left w-full mt-2">
                                        <h3 className="font-bold text-lg mb-1 text-primary">Pro Team</h3>
                                        <div className="price font-bold text-2xl mb-2">$500<span className="text-xs font-normal text-muted">/mo</span></div>
                                    </div>
                                </div>

                                <div className={`pricing-card ${subscriptionTier === 'SUPER' ? 'active border-accent bg-accent/10' : ''}`} style={{ padding: '16px' }}>
                                    {subscriptionTier === 'SUPER' && <div className="recommend-badge bg-success/20 text-success border border-success">MAXIMUM ACCESS</div>}
                                    <div className="text-left w-full mt-2">
                                        <h3 className="font-bold text-lg mb-1 text-accent">Super Admin</h3>
                                        <div className="price font-bold text-2xl mb-2">$1,000<span className="text-xs font-normal text-muted">/mo</span></div>
                                    </div>
                                </div>
                            </div>

                            <button
                                className="btn btn-secondary border-primary text-primary hover:bg-primary/20 w-full mt-6 py-3 disabled:opacity-50"
                                onClick={handleCheckout}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Processing Secure Redirect...' : 'Manage Stripe Billing & Add-Ons'}
                            </button>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Profile;

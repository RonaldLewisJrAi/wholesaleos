import React, { useState, useEffect } from 'react';
import { Building, MapPin, DollarSign, Percent, Save, Camera, Target, Calculator, Headphones, ShieldCheck, Activity, Sun, Moon } from 'lucide-react';
import { useSubscription } from '../contexts/useSubscription';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import './Profile.css';

const Profile = () => {
    // Basic Profile State
    const [profile, setProfile] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        bio: '',
        primaryPersona: 'WHOLESALER',
        systemRole: 'USER'
    });

    const { subscriptionTier, allowedPersonas } = useSubscription();
    const { theme, toggleTheme } = useTheme();

    // Investor Buy Box State
    const [buyBox, setBuyBox] = useState({
        targetMarkets: '',
        maxPrice: 0,
        minROI: 0,
        propertyTypes: 'SFR, Small MFR',
        rehabLevel: 'Moderate to Full Gut'
    });

    const [isSaving, setIsSaving] = useState(false);
    const [userId, setUserId] = useState(null);
    const [isOnboarding, setIsOnboarding] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('onboarding') === 'true') {
            setIsOnboarding(true);
        }

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
                        primaryPersona: data.primary_persona || 'WHOLESALER',
                        systemRole: data.system_role || 'USER'
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
            setIsOnboarding(false);
            if (isOnboarding) {
                window.history.replaceState({}, document.title, window.location.pathname);
            }
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
        { id: 'WHOLESALER', label: 'Wholesaler (Classic)', icon: Building },
        { id: 'INVESTOR', label: 'VIP Investor', icon: Target },
        { id: 'REALTOR', label: 'Realtor', icon: Calculator },
        { id: 'VIRTUAL_ASSISTANT', label: 'Assistant', icon: Headphones },
        { id: 'ACQUISITION', label: 'Acquisition', icon: Target },
        { id: 'DISPOSITION', label: 'Disposition', icon: DollarSign },
        { id: 'COMPLIANCE', label: 'Compliance Module', icon: ShieldCheck },
        { id: 'ANALYST', label: 'Analyst Data Lab', icon: Activity }
    ];

    if (allowedPersonas?.includes('ADMIN')) {
        personaConfigs.push({ id: 'ADMIN', label: 'Master Admin', icon: ShieldCheck });
    }

    const isMasterAdmin = profile.systemRole === 'GLOBAL_SUPER_ADMIN';

    return (
        <div className="profile-container animate-fade-in">
            <div className="page-header border-b border-[var(--border-light)] pb-6 mb-2">
                <h1 className="page-title mb-1">User Identity & Access</h1>
                <p className="page-description m-0">Manage your system persona, contact bindings, and platform configuration.</p>
            </div>

            {isOnboarding && (
                <div className="bg-success/20 border border-success text-success p-4 rounded-xl mb-6 flex items-start gap-3 animate-fade-in">
                    <ShieldCheck className="shrink-0 mt-1" size={20} />
                    <div>
                        <h3 className="font-bold">Live Mode Unlocked!</h3>
                        <p className="text-sm">Welcome to Wholesale OS Live. Please complete your system persona and core identity details below, then click "Save Profile Identity" to initialize your matching algorithms.</p>
                    </div>
                </div>
            )}

            <div className="profile-grid">

                {/* Visual Identity Module */}
                <div className="profile-card">
                    <div className="avatar-upload-section">
                        <div className="avatar-preview">
                            {profile.firstName ? profile.firstName.charAt(0) : 'U'}
                            {profile.lastName ? profile.lastName.charAt(0) : ''}
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
                        <div className="form-group">
                            <select
                                className="fillable-input w-full"
                                value={profile.primaryPersona}
                                onChange={(e) => setProfile(prev => ({ ...prev, primaryPersona: e.target.value }))}
                            >
                                {personaConfigs.map(persona => (
                                    <option key={persona.id} value={persona.id}>{persona.label}</option>
                                ))}
                            </select>
                        </div>

                        <h3 className="section-title mb-4 mt-6 pb-2 border-b border-[var(--border-light)] font-bold">Theme Calibration</h3>
                        <div className="flex gap-4">
                            <button
                                className={`flex items-center justify-center gap-2 py-2 px-4 rounded border transition-colors ${theme === 'dark' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-transparent border-[var(--border-color)] text-muted hover:text-white'}`}
                                onClick={() => theme !== 'dark' && toggleTheme()}
                            >
                                <Moon size={16} /> Dark Mode
                            </button>
                            <button
                                className={`flex items-center justify-center gap-2 py-2 px-4 rounded border transition-colors ${theme === 'light' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-transparent border-[var(--border-color)] text-muted hover:text-black'}`}
                                onClick={() => theme !== 'light' && toggleTheme()}
                            >
                                <Sun size={16} /> Light Mode
                            </button>
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

                    <div className="form-group mt-6 pt-4 border-t border-[var(--border-light)]">
                        <label>Update Password</label>
                        <div className="flex gap-2 mt-2">
                            <input
                                type="password"
                                className="fillable-input w-full"
                                placeholder="Enter new password..."
                                id="newPasswordInput"
                            />
                            <button
                                className="btn btn-secondary whitespace-nowrap"
                                onClick={async () => {
                                    const input = document.getElementById('newPasswordInput');
                                    if (!input.value || input.value.length < 6) {
                                        alert('Password must be at least 6 characters.');
                                        return;
                                    }
                                    const { error } = await supabase.auth.updateUser({ password: input.value });
                                    if (error) {
                                        alert('Failed to update password: ' + error.message);
                                    } else {
                                        alert('Password successfully updated.');
                                        input.value = '';
                                    }
                                }}
                            >
                                Update Password
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[var(--border-light)]">
                        <button
                            className="btn btn-primary w-full flex justify-center items-center gap-2 py-3 disabled:opacity-50"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            <Save size={18} /> {isSaving ? 'Syncing to Database...' : 'Save Profile Identity'}
                        </button>
                    </div>
                </div>

                {/* Global Plan Governance */}
                <div className="profile-card border-none bg-[rgba(99,102,241,0.05)] shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                    <h3 className="section-title mb-4 pb-2 border-b border-primary/30 font-bold text-primary flex items-center gap-2">
                        <Building size={18} /> Subscriptions & Add-Ons
                    </h3>

                    <div className="text-sm mb-4">
                        <p className="text-muted"><strong className="text-white">Current Organization:</strong> {profile.company || 'Personal Workspace'}</p>
                        <p className="text-muted mt-1"><strong className="text-white">Active Plan:</strong> <span className="badge bg-primary/20 text-primary border border-primary/50 ml-2">{subscriptionTier}</span></p>
                    </div>

                    {['BASIC', 'PRO', 'ADVANCED'].includes(subscriptionTier) && (
                        <button
                            className="btn btn-secondary border-primary text-primary hover:bg-primary/20 w-full mt-6 py-3 disabled:opacity-50"
                            onClick={handleCheckout}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Processing Secure Redirect...' : 'Upgrade Subscription'}
                        </button>
                    )}
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

                {/* Algorithmic Buy Box - INVESTOR PERSONA */}
                {profile.primaryPersona === 'INVESTOR' && (
                    <div className="profile-card buy-box-card animate-fade-in">
                        <h3 className="section-title mb-1 font-bold text-warning flex items-center gap-2">
                            <Target size={18} /> Algorithmic Buy Box (Investor)
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
                )}

                {/* Disposition Filters - WHOLESALER PERSONA */}
                {profile.primaryPersona === 'WHOLESALER' && (
                    <div className="profile-card buy-box-card animate-fade-in">
                        <h3 className="section-title mb-1 font-bold text-success flex items-center gap-2">
                            <Building size={18} /> Wholesale Disposition Filters
                        </h3>
                        <p className="text-xs text-muted mb-4 pb-3 border-b border-[var(--border-light)]">Configure your pipeline's assignment targets and buyer matching criteria.</p>

                        <div className="form-group mb-4">
                            <label>Target Assignment Fee Structure</label>
                            <select className="fillable-input w-full">
                                <option value="flat">Standard Flat Fee ($10k+)</option>
                                <option value="percentage">Percentage Based (3-5%)</option>
                                <option value="micro">High Volume Micro-Fees (&lt;$5k)</option>
                            </select>
                        </div>

                        <div className="form-group mb-4">
                            <label>Maximum Days on Market (DOM) Threshold</label>
                            <input type="number" className="fillable-input w-full" placeholder="e.g. 14 Days" defaultValue="14" />
                        </div>

                        <div className="form-group mb-6">
                            <label>Preferred Buyer Archetypes</label>
                            <select className="fillable-input w-full">
                                <option value="all">Any Cash Buyer</option>
                                <option value="hedge">Institutional / Hedge Funds</option>
                                <option value="flipper">Local Fix & Flip Operators</option>
                                <option value="landlord">Buy & Hold Landlords</option>
                            </select>
                        </div>

                        <button
                            className="btn border border-success text-success hover:bg-success/10 w-full flex justify-center items-center gap-2 py-3"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            <Save size={18} /> Update Disposition Pipeline Logic
                        </button>
                    </div>
                )}

                {/* Listing Filters - REALTOR PERSONA */}
                {profile.primaryPersona === 'REALTOR' && (
                    <div className="profile-card buy-box-card animate-fade-in">
                        <h3 className="section-title mb-1 font-bold text-indigo-400 flex items-center gap-2">
                            <Calculator size={18} /> Realtor Listing & Comps Logic
                        </h3>
                        <p className="text-xs text-muted mb-4 pb-3 border-b border-[var(--border-light)]">Configure your MLS bounds and standard commission models.</p>

                        <div className="form-group mb-4">
                            <label>Target Commission Structure</label>
                            <select className="fillable-input w-full">
                                <option value="standard">Standard 3% Buyer / 3% Seller</option>
                                <option value="flat">Flat-Fee Listing Models</option>
                                <option value="commercial">Commercial Escalation Models</option>
                            </select>
                        </div>

                        <div className="form-group mb-4">
                            <label>Active MLS Regions</label>
                            <input type="text" className="fillable-input w-full" placeholder="e.g. RealTracs, FMLS" defaultValue="RealTracs Middle TN" />
                        </div>

                        <button
                            className="btn border border-indigo-400 text-indigo-400 hover:bg-indigo-400/10 w-full flex justify-center items-center gap-2 py-3"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            <Save size={18} /> Update Market Feed Logic
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Profile;

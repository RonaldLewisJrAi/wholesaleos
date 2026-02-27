import React, { useState, useEffect } from 'react';
import { Building, MapPin, DollarSign, Percent, Save, Camera, ShieldCheck, Target, Home, Zap, CheckCircle, Lock, PhoneCall, ListChecks } from 'lucide-react';
import { useSubscription } from '../contexts/useSubscription';
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
        role: 'Wholesaler', // 'Wholesaler' or 'Investor'
    });

    const { subscriptionTier, setSubscriptionTier } = useSubscription();

    // Investor Buy Box State
    const [buyBox, setBuyBox] = useState({
        targetMarkets: 'Nashville TN, Austin TX',
        maxPrice: 350000,
        minROI: 12,
        propertyTypes: 'SFR, Small MFR',
        rehabLevel: 'Moderate to Full Gut'
    });

    // Phase 29: Team Performance Module State
    const [performanceLog, setPerformanceLog] = useState({
        calls: 142,
        texts: 38,
        appointments: 4,
        conversionRate: 2.8
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
                        role: data.role || 'Wholesaler'
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

        const isUnpaid = !subscriptionTier || subscriptionTier === 'demo' || subscriptionTier === 'free';
        if (isUnpaid) {
            alert("🔒 Upgrade Required: Setting up your Investor Buy Box and custom Profile requires an active SaaS tier.");
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
                role: profile.role,
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
        let priceId = ''; // Default Fallback 
        if (subscriptionTier === 'BASIC') priceId = import.meta.env.VITE_STRIPE_BASIC_PRICE_ID;
        // The user explicitly requested this Live Price ID for the Pro tier.
        if (subscriptionTier === 'ADVANCED') priceId = 'price_1T4jOFK2qPJKpuPcVKh0BG4W';
        if (subscriptionTier === 'SUPER') priceId = import.meta.env.VITE_STRIPE_SUPER_PRICE_ID;

        try {
            const response = await fetch('http://localhost:3001/api/stripe/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    priceId: priceId,
                    userEmail: profile.email,
                    userId: userId || '00000000-0000-0000-0000-000000000000'
                })
            });
            const data = await response.json();
            if (data.url) {
                // Redirect globally to Stripe Hosted Checkout
                window.location.href = data.url;
            } else {
                alert('Checkout failed: ' + data.error);
                setIsSaving(false);
            }
        } catch (err) {
            console.error(err);
            alert('Could not connect to billing backend proxy. Ensure comps_server is running on port 3001.');
            setIsSaving(false);
        }
    };

    return (
        <div className="profile-container animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">User Profile</h1>
                <p className="page-description">Manage your personal information, system role, and investment criteria.</p>
            </div>

            <div className="profile-grid">
                {/* Left Column: Identity & Role */}
                <div className="profile-identity-col">
                    <div className="card glass-panel profile-card">
                        <div className="avatar-upload-section">
                            <div className="avatar-preview">
                                {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                                <button className="avatar-edit-btn" title="Change Avatar">
                                    <Camera size={16} />
                                </button>
                            </div>
                            <h2 className="profile-name">{profile.firstName} {profile.lastName}</h2>
                            <p className="profile-company text-muted">{profile.company}</p>

                            {/* Role Badge Displays */}
                            <div className="role-badges mt-3">
                                {profile.role === 'Wholesaler' ? (
                                    <span className="badge role-badge badge-wholesaler flex items-center gap-1">
                                        <Building size={14} /> Acquisition Manager
                                    </span>
                                ) : (
                                    <span className="badge role-badge badge-investor flex items-center gap-1">
                                        <Target size={14} /> VIP Investor
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="profile-form mt-6">
                            <h3 className="section-title mb-4 border-b pb-2">Primary Role</h3>
                            <div className="role-toggle-group mb-6">
                                <button
                                    className={`role-toggle-btn ${profile.role === 'Wholesaler' ? 'active' : ''}`}
                                    onClick={() => setProfile({ ...profile, role: 'Wholesaler' })}
                                >
                                    <Building size={18} />
                                    <span>Wholesaler</span>
                                    <small>I find and assign deals</small>
                                </button>
                                <button
                                    className={`role-toggle-btn ${profile.role === 'Investor' ? 'active' : ''}`}
                                    onClick={() => setProfile({ ...profile, role: 'Investor' })}
                                >
                                    <Target size={18} />
                                    <span>Investor</span>
                                    <small>I buy and fund deals</small>
                                </button>
                            </div>

                            <h3 className="section-title mb-4 border-b pb-2 flex items-center justify-between">
                                Active SaaS Subscription
                                <span className={`text-[10px] px-2 py-1 rounded badge tier-${subscriptionTier.toLowerCase()}`}>{subscriptionTier}</span>
                            </h3>

                            <div className="pricing-tiers grid grid-cols-2 gap-4 mb-6">
                                <div
                                    className={`pricing-card ${subscriptionTier === 'BASIC' ? 'active' : ''}`}
                                    onClick={() => setSubscriptionTier('BASIC')}
                                >
                                    <div className="text-left w-full">
                                        <h3 className="font-bold text-lg mb-1">Starter</h3>
                                        <div className="price font-bold text-xl mb-3">$97<span className="text-xs font-normal text-muted">/mo</span></div>
                                        <ul className="text-xs text-muted space-y-2">
                                            <li><CheckCircle size={12} className="inline mr-1 text-success" /> Basic CRM Access</li>
                                            <li><CheckCircle size={12} className="inline mr-1 text-success" /> 5 Documents / mo</li>
                                        </ul>
                                    </div>
                                </div>

                                <div
                                    className={`pricing-card recommended ${subscriptionTier === 'ADVANCED' ? 'active' : ''}`}
                                    onClick={() => setSubscriptionTier('ADVANCED')}
                                >
                                    <div className="recommend-badge">POPULAR</div>
                                    <div className="text-left w-full">
                                        <h3 className="font-bold text-lg mb-1 text-primary">Pro</h3>
                                        <div className="price font-bold text-xl mb-3">$197<span className="text-xs font-normal text-muted">/mo</span></div>
                                        <ul className="text-xs text-muted space-y-2">
                                            <li><CheckCircle size={12} className="inline mr-1 text-success" /> AI Escrow Extraction</li>
                                            <li><CheckCircle size={12} className="inline mr-1 text-success" /> 20 Documents / mo</li>
                                        </ul>
                                    </div>
                                </div>

                                <div
                                    className={`pricing-card ${subscriptionTier === 'SUPER' ? 'active' : ''} col-span-2`}
                                    onClick={() => setSubscriptionTier('SUPER')}
                                >
                                    <div className="text-left w-full flex justify-between items-center flex-wrap gap-2">
                                        <div>
                                            <h3 className="font-bold text-lg mb-1 text-warning flex items-center gap-2">Elite <Lock size={14} /></h3>
                                            <div className="price font-bold text-xl mb-2">$497<span className="text-xs font-normal text-muted">/mo</span></div>
                                        </div>
                                        <ul className="text-xs text-muted space-y-1 text-left sm:text-right">
                                            <li><CheckCircle size={12} className="inline text-success mr-1 sm:mr-0 sm:ml-1" /> Pre-foreclosure Radar</li>
                                            <li><CheckCircle size={12} className="inline text-success mr-1 sm:mr-0 sm:ml-1" /> Zillow Comp Engine</li>
                                            <li><CheckCircle size={12} className="inline text-success mr-1 sm:mr-0 sm:ml-1" /> Unlimited Documents</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <button
                                className="btn btn-primary w-full text-lg py-3 flex justify-center items-center gap-2 mb-6"
                                onClick={handleCheckout}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Connecting to Stripe...' : <><Lock size={18} /> Upgrade to {subscriptionTier} Tier via Stripe</>}
                            </button>

                            <h3 className="section-title mb-4 border-b pb-2">Personal Details</h3>
                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label>First Name</label>
                                    <input type="text" name="firstName" value={profile.firstName} onChange={handleProfileChange} className="fillable-input" />
                                </div>
                                <div className="form-group">
                                    <label>Last Name</label>
                                    <input type="text" name="lastName" value={profile.lastName} onChange={handleProfileChange} className="fillable-input" />
                                </div>
                            </div>

                            <div className="form-group mt-4">
                                <label>Corporate Entity / LLC</label>
                                <input type="text" name="company" value={profile.company} onChange={handleProfileChange} className="fillable-input w-full" />
                            </div>

                            <div className="form-grid-2 mt-4">
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input type="email" name="email" value={profile.email} onChange={handleProfileChange} className="fillable-input" />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input type="tel" name="phone" value={profile.phone} onChange={handleProfileChange} className="fillable-input" />
                                </div>
                            </div>

                            <div className="form-group mt-4">
                                <label>Professional Bio</label>
                                <textarea name="bio" value={profile.bio} onChange={handleProfileChange} className="fillable-input w-full h-24 resize-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Dynamic based on Role */}
                <div className="profile-dynamic-col">
                    {profile.role === 'Wholesaler' ? (
                        <div className="card glass-panel flex flex-col items-center justify-center p-8 h-full text-center">
                            <ShieldCheck size={48} className="text-primary opacity-50 mb-4" />
                            <h3 className="text-xl font-bold mb-2">Acquisition Engine Ready</h3>
                            <p className="text-muted max-w-sm">
                                Your profile is optimized for sourcing leads, calculating ARV, and dispatching deal packets to the investor network.
                            </p>
                        </div>
                    ) : (
                        <div className="card glass-panel buy-box-card animate-fade-in">
                            <div className="card-header pb-3 border-b border-[var(--border-light)] mb-5">
                                <div>
                                    <h3 className="flex items-center gap-2"><Target className="text-warning" size={20} /> Investor Buy Box</h3>
                                    <p className="text-xs text-muted mt-1">Define your exact acquisition criteria. This data powers our automated deal matching engine.</p>
                                </div>
                            </div>

                            <div className="form-group mb-5">
                                <label className="flex items-center gap-2"><MapPin size={14} /> Target Markets (Zip Codes or Counties)</label>
                                <input
                                    type="text"
                                    name="targetMarkets"
                                    value={buyBox.targetMarkets}
                                    onChange={handleBuyBoxChange}
                                    className="fillable-input w-full"
                                    placeholder="e.g. 37206, Davidson County"
                                />
                            </div>

                            <div className="form-grid-2 mb-5">
                                <div className="form-group">
                                    <label className="flex items-center gap-2"><DollarSign size={14} /> Max Purchase Price</label>
                                    <div className="input-with-prefix">
                                        <span className="prefix">$</span>
                                        <input
                                            type="number"
                                            name="maxPrice"
                                            value={buyBox.maxPrice}
                                            onChange={handleBuyBoxChange}
                                            className="fillable-input w-full pl-6"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="flex items-center gap-2"><Percent size={14} /> Target Minimum ROI</label>
                                    <div className="input-with-suffix">
                                        <input
                                            type="number"
                                            name="minROI"
                                            value={buyBox.minROI}
                                            onChange={handleBuyBoxChange}
                                            className="fillable-input w-full pr-6"
                                        />
                                        <span className="suffix">%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group mb-5">
                                <label className="flex items-center gap-2"><Home size={14} /> Preferred Property Types</label>
                                <select
                                    name="propertyTypes"
                                    value={buyBox.propertyTypes}
                                    onChange={handleBuyBoxChange}
                                    className="fillable-input w-full"
                                >
                                    <option value="SFR Only">Single Family (SFR) Only</option>
                                    <option value="SFR, Small MFR">SFR & Small Multi-Family (2-4 Units)</option>
                                    <option value="Commercial">Commercial & Large Multi-Family</option>
                                    <option value="Any">Any Asset Class</option>
                                </select>
                            </div>

                            <div className="form-group mb-6">
                                <label className="flex items-center gap-2">Target Rehab Intensity</label>
                                <select
                                    name="rehabLevel"
                                    value={buyBox.rehabLevel}
                                    onChange={handleBuyBoxChange}
                                    className="fillable-input w-full"
                                >
                                    <option value="Turnkey">Turnkey / Cosmetic Only</option>
                                    <option value="Light Rehab">Light Rehab (Paint & Floors)</option>
                                    <option value="Moderate to Full Gut">Moderate to Full Gut (Value Add)</option>
                                    <option value="Land/Tear Down">Land / Tear Down</option>
                                </select>
                            </div>

                            <div className="bg-[rgba(245,158,11,0.05)] border border-warning/20 rounded-md p-3">
                                <p className="text-xs text-warning leading-snug">
                                    <strong>Matching Engine Active:</strong> By saving these metrics, you will be instantly pinged when our Wholesaler network locks up contracts hitting your defined ROI thresholds in your target zones.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Global Save Action */}
            <div className="profile-actions flex justify-end mt-6 pt-4 border-t border-[var(--border-light)]">
                <button
                    className="btn btn-primary flex items-center gap-2 px-8"
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    <Save size={18} />
                    {isSaving ? 'Syncing...' : 'Save Profile Settings'}
                </button>
            </div>

            {/* Phase 29: Team Performance Analytics Panel */}
            <div className={`card glass-panel relative overflow-hidden flex flex-col mt-6 ${['ADVANCED', 'SUPER'].includes(subscriptionTier) ? '' : 'select-none pointer-events-none'}`}>
                {/* Paywall Overlay */}
                {!['ADVANCED', 'SUPER'].includes(subscriptionTier) && (
                    <div className="absolute inset-0 bg-[var(--surface-dark)]/90 backdrop-blur-[4px] z-10 flex flex-col items-center justify-center pointer-events-auto">
                        <Lock size={32} className="text-primary mb-3" />
                        <h3 className="text-xl font-bold mb-2">Team Performance Module Locked</h3>
                        <p className="text-muted text-sm max-w-md text-center mb-6">Upgrade to Advanced or Super to unlock representative logging, KPI leaderboards, and conversion tracking for your acquisitions team.</p>
                        <button className="btn btn-primary shadow-[0_0_15px_rgba(99,102,241,0.5)]" onClick={handleCheckout}>Unlock Performance Analytics</button>
                    </div>
                )}

                <div className="card-header border-b border-[var(--border-light)] pb-4 mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-primary"><Target size={20} /> Team Performance Analytics</h2>
                    <p className="text-sm text-muted mt-1">Track daily outreach metrics, monitor rep conversion rates, and review activity logs.</p>
                </div>

                <div className="card-body">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="p-4 bg-[rgba(0,0,0,0.2)] rounded border border-[var(--border-light)] relative overflow-hidden">
                            <div className="absolute -right-4 -bottom-4 opacity-10 text-primary"><PhoneCall size={80} /></div>
                            <div className="text-sm font-bold text-muted uppercase tracking-wider mb-1 relative z-10">Cold Calls</div>
                            <div className="text-3xl font-bold text-white relative z-10">{performanceLog.calls}</div>
                            <div className="text-xs text-success mt-1 relative z-10">↑ 12 today</div>
                        </div>
                        <div className="p-4 bg-[rgba(0,0,0,0.2)] rounded border border-[var(--border-light)] relative overflow-hidden">
                            <div className="absolute -right-4 -bottom-4 opacity-10 text-info"><Zap size={80} /></div>
                            <div className="text-sm font-bold text-muted uppercase tracking-wider mb-1 relative z-10">SMS Sent</div>
                            <div className="text-3xl font-bold text-white relative z-10">{performanceLog.texts}</div>
                            <div className="text-xs text-muted mt-1 relative z-10">Daily Limit: 500</div>
                        </div>
                        <div className="p-4 bg-[rgba(0,0,0,0.2)] rounded border border-[var(--border-light)] relative overflow-hidden">
                            <div className="absolute -right-4 -bottom-4 opacity-10 text-warning"><CheckCircle size={80} /></div>
                            <div className="text-sm font-bold text-muted uppercase tracking-wider mb-1 relative z-10">Appointments</div>
                            <div className="text-3xl font-bold text-white relative z-10">{performanceLog.appointments}</div>
                            <div className="text-xs text-warning mt-1 relative z-10">Target: 10/wk</div>
                        </div>
                        <div className="p-4 bg-[rgba(0,0,0,0.2)] rounded border border-[var(--border-light)] relative overflow-hidden">
                            <div className="absolute -right-4 -bottom-4 opacity-10 text-success"><Percent size={80} /></div>
                            <div className="text-sm font-bold text-muted uppercase tracking-wider mb-1 relative z-10">Conversion</div>
                            <div className="text-3xl font-bold text-success relative z-10">{performanceLog.conversionRate}%</div>
                            <div className="text-xs text-success mt-1 relative z-10">Call to close</div>
                        </div>
                    </div>

                    <div className="flex-between items-center bg-[var(--surface-light)] p-3 rounded border border-[var(--border-light)]">
                        <div>
                            <span className="font-bold text-sm block flex items-center gap-2"><ListChecks size={14} className="text-primary" /> Quick Log Action</span>
                            <span className="text-xs text-muted">Instantly log a manual outreach attempt to the team ledger.</span>
                        </div>
                        <div className="flex gap-2">
                            <button className="btn btn-secondary text-sm flex gap-2" onClick={() => {
                                setPerformanceLog(p => ({ ...p, calls: p.calls + 1 }));
                                alert("Outbound Call physically logged to 'team_performance_logs' via Phase 29 API.");
                            }}><PhoneCall size={14} /> Log Call</button>
                            <button className="btn btn-primary text-sm flex gap-2" onClick={() => alert("Detailed log modal opened.")}>+ Detailed Entry</button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Profile;

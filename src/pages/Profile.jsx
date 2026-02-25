import React, { useState } from 'react';
import { User, Building, MapPin, DollarSign, Percent, Save, Camera, ShieldCheck, Target, Home } from 'lucide-react';
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

    // Investor Buy Box State
    const [buyBox, setBuyBox] = useState({
        targetMarkets: 'Nashville TN, Austin TX',
        maxPrice: 350000,
        minROI: 12,
        propertyTypes: 'SFR, Small MFR',
        rehabLevel: 'Moderate to Full Gut'
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleBuyBoxChange = (e) => {
        const { name, value } = e.target;
        setBuyBox(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        setIsSaving(true);
        // Simulate API call
        setTimeout(() => {
            setIsSaving(false);
            alert("Profile preferences successfully updated and synced via Supabase!");
        }, 800);
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
        </div>
    );
};

export default Profile;

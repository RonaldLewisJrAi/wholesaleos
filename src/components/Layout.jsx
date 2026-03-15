import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ScrollChevron from './ScrollChevron';
import OrgHealthWidget from './OrgHealthWidget';
import GlobalStatusBanner from './GlobalStatusBanner';
import { OSCARPanel } from './assistant/OSCARPanel';
import VerifiedClosingTicker from './ui/VerifiedClosingTicker';
import { useAuth } from '../contexts/useAuth';
import { useSubscription } from '../contexts/useSubscription';
import { useGuidance } from '../contexts/GuidanceContext';

const Layout = () => {
    const { user, loadingAuth, developerMode } = useAuth();
    const { systemRole, subscriptionStatus, subscriptionTier, loadingSub } = useSubscription();
    const { isAssistantOpen } = useGuidance();

    // 1. Loading Phase
    if (loadingAuth) {
        return <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-white">Authenticating Session...</div>;
    }

    // 2. Unauthenticated Guard
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 2.5 SaaS Gating Guard
    // Block the entire app for unpaid users, but allow Super Admins to bypass.
    // Also avoid infinite redirect logic if they are already on /pricing.
    const isPricingRoute = window.location.pathname.includes('/pricing');
    const isSubValid = subscriptionStatus === 'ACTIVE' || subscriptionStatus === 'DEMO' || subscriptionTier === 'BASIC';

    if (!loadingSub && !isSubValid && systemRole !== 'GLOBAL_SUPER_ADMIN') {
        if (!isPricingRoute) {
            return <Navigate to="/pricing" replace />;
        }
    }

    // 3. (Removed) Super Admin Route Bypassing allows the admin to roam freely inside the platform as a normal user if desired.

    // 4. Enterprise Feature Isolation (Phase 38.3)
    const isEnterpriseRoute = window.location.pathname.includes('/integrations') || window.location.pathname.includes('/api-keys') || window.location.pathname.includes('/webhooks');

    if (isEnterpriseRoute && systemRole !== 'GLOBAL_SUPER_ADMIN') {
        return (
            <div className="layout-container dark-vision-ui">
                <GlobalStatusBanner />
                <Sidebar />
                <div className={`main-wrapper ${isAssistantOpen ? 'assistant-open' : ''}`}>
                    <VerifiedClosingTicker />
                    <Header />
                    <main className="main-content flex items-center justify-center">
                        <div className="text-center py-16 px-8 glass-card max-w-lg border border-red-500/30 bg-red-500/5">
                            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Enterprise Control Panel Restricted</h2>
                            <p className="text-gray-400 mb-6">Integrations, APIs, and Webhooks are currently isolated to Global Super Administrators for the Phase 38 Beta environment.</p>
                            <button className="btn btn-primary" onClick={() => window.location.href = '/pipeline'}>Return to Workspace</button>
                        </div>
                    </main>
                </div>
                {isAssistantOpen && <OSCARPanel />}
            </div>
        );
    }

    return (
        <div className="layout-container dark-vision-ui">
            {developerMode && (
                <div className="bg-amber-500 text-black font-bold text-center py-1 text-sm tracking-widest uppercase shadow-[0_0_10px_rgba(245,158,11,0.5)] z-50 absolute w-full top-0">
                    Developer Mode Active — Sandbox Environment
                </div>
            )}
            <GlobalStatusBanner />
            <Sidebar />
            <div className={`main-wrapper flex-1 min-w-0 overflow-hidden ${isAssistantOpen ? 'assistant-open' : ''} ${developerMode ? 'mt-7' : ''}`}>
                <VerifiedClosingTicker />
                <Header />
                <div className="main-content p-4 min-h-screen flex flex-col items-center">
                    <div className="max-w-7xl w-full">
                        <Outlet />
                    </div>
                </div>
            </div>
            <ScrollChevron />
            <OrgHealthWidget />
            {isAssistantOpen && <OSCARPanel />}
        </div>
    );
};

export default Layout;

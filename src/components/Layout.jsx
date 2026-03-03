import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ScrollChevron from './ScrollChevron';
import OrgHealthWidget from './OrgHealthWidget';
import GlobalStatusBanner from './GlobalStatusBanner';
import GuidedTour from './GuidedTour';
import { useAuth } from '../contexts/useAuth';
import { useSubscription } from '../contexts/useSubscription';
import { Navigate } from 'react-router-dom';

const Layout = () => {
    const { user, loadingAuth } = useAuth();
    const { systemRole, loadingSub } = useSubscription();

    // 1. Loading Phase
    if (loadingAuth) {
        return <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-white">Authenticating Session...</div>;
    }

    // 2. Unauthenticated Guard
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 3. Super Admin Route Bypassing
    // Using window.location to strictly avoid rendering nested dashboards when on admin
    if (!loadingSub && systemRole === 'GLOBAL_SUPER_ADMIN' && !window.location.pathname.includes('/super-admin') && !window.location.pathname.includes('/profile')) {
        return <Navigate to="/super-admin" replace />;
    }

    return (
        <div className="layout-container">
            <GlobalStatusBanner />
            <Sidebar />
            <div className="main-wrapper">
                <Header />
                <main className="main-content">
                    <Outlet />
                </main>
            </div>
            <ScrollChevron />
            <OrgHealthWidget />
            <GuidedTour />
        </div>
    );
};

export default Layout;

import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import SuperAdminSidebar from './SuperAdminSidebar';
import Header from '../Header';
import GlobalStatusBanner from '../GlobalStatusBanner';
import { useAuth } from '../../contexts/useAuth';
import { useSubscription } from '../../contexts/useSubscription';

const SuperAdminLayout = () => {
    const { user, loadingAuth } = useAuth();
    const { systemRole, loadingSub } = useSubscription();

    // 1. Loading Phase
    if (loadingAuth || loadingSub) {
        return <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-white">Authenticating Admin Session...</div>;
    }

    // 2. Unauthenticated Guard
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 3. Strict Super Admin Guard
    if (systemRole !== 'GLOBAL_SUPER_ADMIN') {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="layout-container super-admin-theme">
            <GlobalStatusBanner />
            <SuperAdminSidebar />
            <div className="main-wrapper">
                <Header />
                <main className="main-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default SuperAdminLayout;

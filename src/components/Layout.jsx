import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ScrollChevron from './ScrollChevron';
import { useDemoMode } from '../contexts/DemoModeContext';

const Layout = () => {
    const { isDemoMode } = useDemoMode();

    useEffect(() => {
        const handleGlobalClick = (e) => {
            if (!isDemoMode) return;

            const button = e.target.closest('button');

            if (button) {
                // Intercept only critical action buttons to allow navigation/modals to still work
                const isActionButton =
                    button.classList.contains('btn-primary') ||
                    button.classList.contains('btn-secondary') ||
                    button.classList.contains('btn-success') ||
                    button.classList.contains('btn-danger') ||
                    button.classList.contains('add-deal-btn') ||
                    button.type === 'submit';

                if (isActionButton) {
                    e.preventDefault();
                    e.stopPropagation();
                    alert("This action is disabled in Demo Mode. Please switch to Live Data to execute system functions.");
                }
            }
        };

        // Use capture phase to intercept before React synthetic events fire
        document.addEventListener('click', handleGlobalClick, true);
        return () => document.removeEventListener('click', handleGlobalClick, true);
    }, [isDemoMode]);
    return (
        <div className="layout-container">
            <Sidebar />
            <div className="main-wrapper">
                <Header />
                <main className="main-content">
                    <Outlet />
                </main>
            </div>
            <ScrollChevron />
        </div>
    );
};

export default Layout;

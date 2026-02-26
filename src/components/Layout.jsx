import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ScrollChevron from './ScrollChevron';
import { useDemoMode } from '../contexts/DemoModeContext';
import UnlockLiveModeModal from './UnlockLiveModeModal';
import EnterpriseTermsModal from './EnterpriseTermsModal';
import OrgHealthWidget from './OrgHealthWidget';
import GlobalStatusBanner from './GlobalStatusBanner';

const Layout = () => {
    const { isDemoMode } = useDemoMode();
    const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

    // Phase 29: Enforce Legal Hardening on boot
    React.useEffect(() => {
        const hasAccepted = localStorage.getItem('wholesale_os_enterprise_terms_accepted');
        if (hasAccepted !== 'true') {
            setIsTermsModalOpen(true);
        }
    }, []);

    return (
        <div className={`layout-container ${isDemoMode ? 'demo-mode-active' : ''}`} style={isDemoMode ? { paddingTop: '35px' } : {}}>
            <GlobalStatusBanner />
            {isDemoMode && (
                <>
                    <div
                        className="demo-banner"
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100vw',
                            height: '35px',
                            backgroundColor: '#ef4444',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            zIndex: 999999,
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)',
                            pointerEvents: 'auto'
                        }}
                    >
                        ⚠️ ACTUAL DATA IS NOT AVAILABLE IN DEMO MODE ⚠️
                        <button
                            onClick={() => setIsUnlockModalOpen(true)}
                            style={{
                                marginLeft: '16px',
                                backgroundColor: '#10b981',
                                border: 'none',
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '0.75rem',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                transition: 'all 0.2s ease',
                                textTransform: 'uppercase'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            Unlock Live Mode
                        </button>
                    </div>
                    <div
                        className="demo-watermark"
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100vw',
                            height: '100vh',
                            pointerEvents: 'none',
                            zIndex: 999998,
                            display: 'flex',
                            justifyContent: 'space-around',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            overflow: 'hidden',
                            opacity: 0.08
                        }}
                    >
                        {[...Array(24)].map((_, i) => (
                            <div key={i} style={{
                                fontSize: '4rem',
                                fontWeight: '900',
                                color: '#ffffff',
                                transform: 'rotate(-45deg)',
                                whiteSpace: 'nowrap',
                                padding: '40px',
                                textTransform: 'uppercase',
                                letterSpacing: '4px',
                                userSelect: 'none'
                            }}>DEMO ONLY</div>
                        ))}
                    </div>
                </>
            )}
            <Sidebar />
            <div className="main-wrapper">
                <Header />
                <main className="main-content">
                    <Outlet />
                </main>
            </div>
            <ScrollChevron />
            <OrgHealthWidget />
            <UnlockLiveModeModal isOpen={isUnlockModalOpen} onClose={() => setIsUnlockModalOpen(false)} />

            {/* Phase 29: Enterprise Legal Containment */}
            <EnterpriseTermsModal
                isOpen={isTermsModalOpen}
                onAccept={() => setIsTermsModalOpen(false)}
            />
        </div>
    );
};

export default Layout;

import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ScrollChevron from './ScrollChevron';
import { useDemoMode } from '../contexts/DemoModeContext';

const Layout = () => {
    const { isDemoMode } = useDemoMode();

    return (
        <div className={`layout-container ${isDemoMode ? 'demo-mode-active' : ''}`} style={isDemoMode ? { paddingTop: '35px' } : {}}>
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
                            pointerEvents: 'none'
                        }}
                    >
                        ⚠️ ACTUAL DATA IS NOT AVAILABLE IN DEMO MODE ⚠️
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
        </div>
    );
};

export default Layout;

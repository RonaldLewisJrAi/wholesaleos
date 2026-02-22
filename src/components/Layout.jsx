import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ScrollChevron from './ScrollChevron';

const Layout = () => {
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

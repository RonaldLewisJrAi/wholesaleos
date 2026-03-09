import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
    LayoutDashboard, Users, FileText, CheckCircle, List, Activity, CreditCard, Settings
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import '../Sidebar.css';
import logoUrl from '../../assets/logo.png';

const SuperAdminSidebar = () => {
    const { user } = useAuth();

    const navItems = [
        { name: 'Platform Overview', path: '/super-admin', end: true, icon: <LayoutDashboard size={20} /> },
        { name: 'User Management', path: '/super-admin/users', end: false, icon: <Users size={20} /> },
        { name: 'Deal Audit Table', path: '/super-admin/deals', end: false, icon: <FileText size={20} /> },
        { name: 'Verification Queue', path: '/super-admin/verification', end: false, icon: <CheckCircle size={20} /> },
        { name: 'System Logs', path: '/super-admin/logs', end: false, icon: <List size={20} /> },
        { name: 'Exit to Platform', path: '/dashboard', end: false, icon: <Activity size={20} /> }
    ];

    return (
        <aside className="sidebar glass-panel border-r border-red-500/30">
            <div className="sidebar-header">
                <Link to="/" className="logo-link">
                    <div className="logo-container">
                        <img src={logoUrl} alt="Wholesale OS Logo" className="app-logo" />
                    </div>
                </Link>
                <div className="text-center mt-2">
                    <span className="badge bg-red-500/20 text-red-500 border border-red-500/50 text-[10px] uppercase tracking-wider">Super Admin Console</span>
                </div>
            </div>

            <nav className="sidebar-nav mt-4">
                <ul>
                    {navItems.map((item) => (
                        <li key={item.name}>
                            <NavLink
                                to={item.path}
                                end={item.end}
                                className={({ isActive }) => isActive ? 'nav-link active !bg-red-500/10 !text-red-400 !border-r-2 !border-red-500' : 'nav-link hover:!bg-red-500/5'}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                <span className="nav-text">{item.name}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="sidebar-footer flex flex-col gap-3">
                <Link to="/profile" className="user-profile-mini hover:bg-white/5 transition-colors cursor-pointer rounded-md p-2 mx-2 mb-2">
                    <div className="avatar bg-red-500/20 text-red-500">
                        {user?.user_metadata?.first_name ? user.user_metadata.first_name.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div className="user-info">
                        <span className="user-name">
                            {user?.user_metadata?.first_name
                                ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`
                                : 'Global Admin'}
                        </span>
                        <span className="user-role flex items-center gap-1 text-red-400">
                            God Mode
                        </span>
                    </div>
                </Link>
            </div>
        </aside>
    );
};

export default SuperAdminSidebar;

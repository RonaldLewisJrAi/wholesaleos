import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
    LayoutDashboard,
    Map,
    KanbanSquare,
    Users,
    FileText,
    Calculator,
    ShieldCheck,
    Activity,
    Calendar as CalendarIcon
} from 'lucide-react';
import './Sidebar.css';
import logoUrl from '../assets/logo.png';

const Sidebar = () => {
    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Properties', path: '/properties', icon: <Map size={20} /> },
        { name: 'Opportunity Radar', path: '/radar', icon: <Activity size={20} /> },
        { name: 'Calendar', path: '/calendar', icon: <CalendarIcon size={20} /> },
        { name: 'Pipeline', path: '/pipeline', icon: <KanbanSquare size={20} /> },
        { name: 'CRM (Leads & Buyers)', path: '/crm', icon: <Users size={20} /> },
        { name: 'Documents', path: '/documents', icon: <FileText size={20} /> },
        { name: 'Calculators', path: '/calculators', icon: <Calculator size={20} /> },
        { name: 'Compliance', path: '/compliance', icon: <ShieldCheck size={20} /> },
        // { name: 'Admin Dashboard', path: '/admin', icon: <Users size={20} /> },
    ];

    return (
        <aside className="sidebar glass-panel">
            <div className="sidebar-header">
                <Link to="/" className="logo-link">
                    <div className="logo-container">
                        <img src={logoUrl} alt="Wholesale OS Logo" className="app-logo" />
                    </div>
                </Link>
            </div>

            <nav className="sidebar-nav">
                <ul>
                    {navItems.map((item) => (
                        <li key={item.name}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                <span className="nav-text">{item.name}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="sidebar-footer">
                <div className="user-profile-mini">
                    <div className="avatar">RL</div>
                    <div className="user-info">
                        <span className="user-name">Ronald Lewis</span>
                        <span className="user-role">Administrator</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;

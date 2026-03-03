import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
    LayoutDashboard, Map, KanbanSquare, Users, FileText, Calculator,
    ShieldCheck, Activity, Calendar as CalendarIcon, Target, Search, FolderHeart,
    List, Briefcase, Inbox, PhoneCall, ListTodo, CheckSquare, Settings, Table, CreditCard, Webhook
} from 'lucide-react';
import { useSubscription } from '../contexts/useSubscription';
import { useAuth } from '../contexts/useAuth';
import './Sidebar.css';
import logoUrl from '../assets/logo.png';

const Sidebar = () => {
    const { currentViewPersona, subscriptionTier } = useSubscription();
    const { user } = useAuth();

    const personaNavs = {
        'WHOLESALER': [
            { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
            { name: 'Properties', path: '/properties', icon: <Map size={20} /> },
            { name: 'Opportunity Radar', path: '/radar', icon: <Activity size={20} /> },
            { name: 'Calendar', path: '/calendar', icon: <CalendarIcon size={20} /> },
            { name: 'Pipeline', path: '/pipeline', icon: <KanbanSquare size={20} /> },
            { name: 'CRM (Leads & Buyers)', path: '/crm', icon: <Users size={20} /> },
            { name: 'Documents', path: '/documents', icon: <FileText size={20} /> },
            { name: 'Spreadsheets', path: '/spreadsheets', icon: <Table size={20} /> },
            { name: 'Calculators', path: '/calculators', icon: <Calculator size={20} /> },
            { name: 'Compliance', path: '/compliance', icon: <ShieldCheck size={20} /> },
            { name: 'Billing & Plan', path: '/settings', icon: <CreditCard size={20} />, roleRequired: 'NON_ADMIN' },
            { name: 'Integration & API', path: '/integrations', icon: <Settings size={20} />, roleRequired: 'GLOBAL_SUPER_ADMIN' },
        ],
        'INVESTOR': [
            { name: 'Investor Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
            { name: 'Match Feed', path: '/match-feed', icon: <Target size={20} /> },
            { name: 'My Criteria', path: '/criteria', icon: <Search size={20} /> },
            { name: 'Saved Deals', path: '/saved', icon: <FolderHeart size={20} /> },
            { name: 'Spreadsheets', path: '/spreadsheets', icon: <Table size={20} /> },
            { name: 'Offers Submitted', path: '/offers', icon: <Briefcase size={20} /> },
            { name: 'Calendar', path: '/calendar', icon: <CalendarIcon size={20} /> }
        ],
        'REALTOR': [
            { name: 'Realtor Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
            { name: 'Referral Inbox', path: '/referrals', icon: <Inbox size={20} /> },
            { name: 'My Listings', path: '/listings', icon: <List size={20} /> },
            { name: 'CMA Tool', path: '/cma', icon: <Calculator size={20} /> },
            { name: 'Calendar', path: '/calendar', icon: <CalendarIcon size={20} /> }
        ],
        'COMPLIANCE': [
            { name: 'Compliance Console', path: '/dashboard', icon: <ShieldCheck size={20} /> },
            { name: 'Flagged Deals', path: '/flags', icon: <Activity size={20} /> },
            { name: 'Document Audit', path: '/documents', icon: <FileText size={20} /> }
        ],
        'ANALYST': [
            { name: 'Analyst Lab', path: '/dashboard', icon: <Activity size={20} /> },
            { name: 'Comp Engine', path: '/comps', icon: <Target size={20} /> },
            { name: 'Buyer Trends', path: '/buyers', icon: <Users size={20} /> },
            { name: 'Market Heatmap', path: '/heatmap', icon: <Map size={20} /> }
        ],
        'VIRTUAL_ASSISTANT': [
            { name: 'VA Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
            { name: 'Dialer & Scripts', path: '/dialer', icon: <PhoneCall size={20} /> },
            { name: 'Leads Queue', path: '/leads-queue', icon: <ListTodo size={20} /> },
            { name: 'Appointments Set', path: '/appointments', icon: <CheckSquare size={20} /> },
            { name: 'Calendar', path: '/calendar', icon: <CalendarIcon size={20} /> }
        ],
        'ACQUISITION': [
            { name: 'Acquisition Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
            { name: 'Lead Pipeline', path: '/pipeline', icon: <Users size={20} /> },
            { name: 'Deal Analyzer', path: '/analyzer', icon: <Calculator size={20} /> },
            { name: 'Calendar', path: '/calendar', icon: <CalendarIcon size={20} /> }
        ],
        'DISPOSITION': [
            { name: 'Disposition Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
            { name: 'Active Inventory', path: '/properties', icon: <Map size={20} /> },
            { name: 'Buyer Matches', path: '/buyers', icon: <Users size={20} /> },
            { name: 'Buyer Blasts', path: '/blasts', icon: <Activity size={20} /> }
        ],
        'ADMIN': [
            { name: 'Admin Command', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
            { name: 'Spreadsheets', path: '/spreadsheets', icon: <Table size={20} /> },
            { name: 'Billing & Plan', path: '/settings', icon: <CreditCard size={20} />, roleRequired: 'NON_ADMIN' },
            { name: 'API & Webhooks', path: '/integrations', icon: <Settings size={20} />, roleRequired: 'GLOBAL_SUPER_ADMIN' },
            { name: 'Team Roster', path: '/crm', icon: <Users size={20} /> },
            { name: 'System Logs', path: '/logs', icon: <List size={20} /> }
        ]
    };

    const baseNavItems = personaNavs[currentViewPersona] || personaNavs['WHOLESALER'];
    const navItems = baseNavItems.filter(item => {
        if (item.roleRequired === 'GLOBAL_SUPER_ADMIN') {
            return user?.user_metadata?.system_role === 'GLOBAL_SUPER_ADMIN';
        }
        if (item.roleRequired === 'NON_ADMIN') {
            return user?.user_metadata?.system_role !== 'GLOBAL_SUPER_ADMIN';
        }
        return true;
    });

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
                <Link to="/profile" className="user-profile-mini hover:bg-white/5 transition-colors cursor-pointer rounded-md p-2">
                    <div className="avatar">
                        {user?.user_metadata?.first_name ? user.user_metadata.first_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="user-info">
                        <span className="user-name">
                            {user?.user_metadata?.first_name
                                ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`
                                : user?.email || 'Authenticated User'}
                        </span>
                        <span className="user-role flex items-center gap-1">
                            {subscriptionTier === 'SUPER' ? 'Global Admin' : `${subscriptionTier} Tier`}
                        </span>
                    </div>
                </Link>
            </div>
        </aside>
    );
};

export default Sidebar;

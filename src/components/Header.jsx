import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, Settings, LogOut, User, Shield, ToggleLeft, ToggleRight, Radio, Sun, Moon, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import { useTheme } from '../contexts/ThemeContext';
import { useGuidance } from '../contexts/GuidanceContext';
import { useAuth } from '../contexts/useAuth';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
    const { theme, toggleTheme } = useTheme();
    const { guidanceMode, toggleInsightMode, toggleTourMode } = useGuidance();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [showNotifications, setShowNotifications] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Close dropdowns when clicking outside
    const headerRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (headerRef.current && !headerRef.current.contains(event.target)) {
                setShowNotifications(false);
                setShowSettings(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleNotifications = () => {
        setShowNotifications(!showNotifications);
        setShowSettings(false);
    };

    const toggleSettings = () => {
        setShowSettings(!showSettings);
        setShowNotifications(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login', { replace: true });
    };

    return (
        <header className="header glass-panel" ref={headerRef}>
            <div className="header-search">
                <Search className="search-icon" size={18} />
                <input
                    type="text"
                    placeholder="Search properties, leads, contacts..."
                    className="search-input"
                />
            </div>

            <div className="header-actions">
                <WorkspaceSwitcher />

                <div className="theme-toggle-container flex gap-2">
                    <button
                        className={`icon-btn ${guidanceMode !== 'off' ? 'text-primary animate-pulse shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]' : ''}`}
                        onClick={() => guidanceMode === 'tour' ? toggleTourMode() : toggleInsightMode()}
                        title="Guided Mode: Toggle holographic insights"
                    >
                        <Info size={20} />
                    </button>
                    <button className="icon-btn" onClick={toggleTheme} title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </div>

                <div className="dropdown-container">
                    <button className={`icon-btn ${showNotifications ? 'active' : ''}`} onClick={toggleNotifications}>
                        <Bell size={20} />
                        <span className="notification-badge">3</span>
                    </button>

                    {showNotifications && (
                        <div className="dropdown-menu notifications-dropdown animate-fade-in">
                            <div className="dropdown-header">
                                <h4>Notifications</h4>
                                <span className="text-xs text-accent cursor-pointer">Mark all as read</span>
                            </div>
                            <div className="dropdown-body">
                                <div className="notification-item unread">
                                    <div className="notif-icon bg-primary"><Bell size={14} /></div>
                                    <div className="notif-content">
                                        <p>New Lead: <strong>Michael Chen</strong></p>
                                        <span>2 mins ago</span>
                                    </div>
                                </div>
                                <div className="notification-item unread">
                                    <div className="notif-icon bg-warning"><Shield size={14} /></div>
                                    <div className="notif-content">
                                        <p>Compliance alert on <strong>456 Oak Ave</strong></p>
                                        <span>1 hour ago</span>
                                    </div>
                                </div>
                                <div className="notification-item">
                                    <div className="notif-icon bg-success"><Bell size={14} /></div>
                                    <div className="notif-content">
                                        <p>System updated successfully</p>
                                        <span>Yesterday</span>
                                    </div>
                                </div>
                            </div>
                            <div className="dropdown-footer">
                                <button className="btn-link w-full" onClick={() => alert("Opening Full Notification Center...")}>View all notifications</button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="dropdown-container">
                    <button className={`icon-btn ${showSettings ? 'active' : ''}`} onClick={toggleSettings}>
                        <Settings size={20} />
                    </button>

                    {showSettings && (
                        <div className="dropdown-menu settings-dropdown animate-fade-in">
                            <div className="dropdown-header">
                                <h4>Account</h4>
                                <span className="text-xs text-muted">
                                    {user?.user_metadata?.first_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}` : user?.email || 'Authenticated User'}
                                </span>
                            </div>
                            <div className="dropdown-body">
                                <Link to="/profile" className="dropdown-item" onClick={toggleSettings}>
                                    <User size={16} /> Profile Settings
                                </Link>
                                <button className="dropdown-item" onClick={() => alert("Navigating to Billing & Subscriptions...")}>
                                    <Settings size={16} /> Account Preferences
                                </button>
                                <div className="dropdown-divider"></div>
                                <button className="dropdown-item text-danger" onClick={handleLogout}>
                                    <LogOut size={16} /> Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, Settings, LogOut, User, Shield } from 'lucide-react';
import './Header.css';

const Header = () => {
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
                                <button className="btn-link w-full">View all notifications</button>
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
                                <h4>Ronald Lewis</h4>
                                <span className="text-xs text-muted">ronal@example.com</span>
                            </div>
                            <div className="dropdown-body">
                                <button className="dropdown-item">
                                    <User size={16} /> Profile Settings
                                </button>
                                <button className="dropdown-item">
                                    <Settings size={16} /> Account Preferences
                                </button>
                                <div className="dropdown-divider"></div>
                                <button className="dropdown-item text-danger">
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

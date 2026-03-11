import React, { useState, useEffect, useRef } from 'react';
import { Building, Target, Calculator, Headphones, ChevronDown, Lock, ShieldCheck, FileCheck } from 'lucide-react';
import { useSubscription } from '../contexts/useSubscription';
import { useAuth } from '../contexts/useAuth';

const WorkspaceSwitcher = () => {
    const { subscriptionTier, currentViewPersona, setCurrentViewPersona, allowedPersonas } = useSubscription();
    const { user } = useAuth();

    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const isBasicTier = !['PRO', 'SUPER', 'ADVANCED'].includes(subscriptionTier);

    // Close logic
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Hide the switcher completely if not allowed or if BASIC tier
    if (isBasicTier || !allowedPersonas || allowedPersonas.length <= 1) {
        return null;
    }

    const personas = {
        'WHOLESALER': { icon: <Building size={16} />, label: 'Wholesaler Workspace', desc: 'Acquisition & Underwriting' },
        'INVESTOR': { icon: <Target size={16} />, label: 'Investor Workspace', desc: 'Deal Matching Feed' },
        'REALTOR': { icon: <Calculator size={16} />, label: 'Realtor Workspace', desc: 'CMA & Analytics' },
        'VIRTUAL_ASSISTANT': { icon: <Headphones size={16} />, label: 'VA Workspace', desc: 'Dialer & Follow-Ups' },
        'TITLE_COMPANY': { icon: <FileCheck size={16} />, label: 'Title Workspace', desc: 'Closings & Verification' },
        'ADMIN': { icon: <ShieldCheck size={16} />, label: 'God-Mode Terminal', desc: 'System Telemetry' }
    };

    const handleSwitch = (persona) => {
        if (!allowedPersonas.includes(persona)) {
            alert('Your account is not authorized for this workspace.');
            return;
        }

        setCurrentViewPersona(persona);
        setIsOpen(false);
        // Dispatch custom event so the Sidebar layout can react to the persona swap
        window.dispatchEvent(new CustomEvent('personaChanged', { detail: { persona } }));
    };

    const activeConfig = personas[currentViewPersona] || personas['WHOLESALER'];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                className="flex items-center gap-2 bg-[var(--surface-dark)] border border-[var(--border-light)] hover:border-primary px-3 py-2 rounded-lg transition-colors w-full sm:w-auto"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="text-primary">{activeConfig.icon}</div>
                <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold leading-tight">{activeConfig.label}</div>
                    <div className="text-[10px] text-muted">{activeConfig.desc}</div>
                </div>
                <ChevronDown size={14} className={`text-muted transition-transform ml-auto ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-[#0B0F19] border border-gray-800 shadow-2xl rounded-lg overflow-hidden z-[100] animate-fade-in">
                    <div className="p-3 border-b border-gray-800 bg-[#131B2C] flex items-center gap-2">
                        <span className="text-xs font-bold text-muted uppercase tracking-wider">Switch Persona</span>
                        <span className="badge tier-pro text-[9px] px-1 py-0">{subscriptionTier} TIER</span>
                    </div>
                    <div className="p-1">
                        {Object.entries(personas).map(([key, config]) => {
                            if (key === 'ADMIN' && user?.user_metadata?.system_role !== 'GLOBAL_SUPER_ADMIN') {
                                return null;
                            }

                            const isAllowed = allowedPersonas.includes(key);
                            const isActive = key === currentViewPersona;

                            return (
                                <button
                                    key={key}
                                    className={`w-full flex items-center gap-3 p-3 rounded-md text-left transition-colors
                                        ${isActive ? 'bg-primary/20 border border-primary/30' : 'hover:bg-[#131B2C] border border-transparent'}
                                        ${!isAllowed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                    `}
                                    onClick={() => handleSwitch(key)}
                                    disabled={!isAllowed}
                                >
                                    <div className={`${isActive ? 'text-primary' : 'text-muted'}`}>
                                        {config.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className={`text-sm font-bold ${isActive ? 'text-white' : 'text-gray-300'}`}>
                                            {config.label}
                                        </div>
                                        <div className="text-xs text-muted">{config.desc}</div>
                                    </div>
                                    {!isAllowed && <Lock size={14} className="text-warning" />}
                                    {isActive && <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkspaceSwitcher;

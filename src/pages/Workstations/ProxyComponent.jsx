import React, { useState, useEffect } from 'react';
import { Lock, Construction, Code } from 'lucide-react';

const ProxyComponent = ({ moduleName }) => {
    const [dots, setDots] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="proxy-container animate-fade-in flex flex-col items-center justify-center min-h-[70vh] p-8 text-center bg-transparent">

            <div className="relative mb-8">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
                <div className="relative glass-panel p-6 rounded-2xl border border-primary/30 flex items-center justify-center">
                    <Construction size={48} className="text-primary" />
                </div>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-white">
                {moduleName} <span className="opacity-50 inline-block w-8 text-left">{dots}</span>
            </h1>

            <p className="text-muted text-lg max-w-xl mx-auto mb-8">
                This enterprise module is currently under active construction by the Wholesale OS engineering team. It will be unlocked in an upcoming Phase deployment.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl bg-[var(--surface-dark)] p-6 rounded-xl border border-[var(--border-light)] text-left">
                <div className="flex gap-3">
                    <Lock className="text-warning shrink-0 mt-1" size={18} />
                    <div>
                        <h4 className="font-bold text-white text-sm">Strict RLS Isolation</h4>
                        <p className="text-xs text-muted mt-1">This module will be cryptographically locked to your Organization UUID upon launch.</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Code className="text-info shrink-0 mt-1" size={18} />
                    <div>
                        <h4 className="font-bold text-white text-sm">Persona-Aware Wiring</h4>
                        <p className="text-xs text-muted mt-1">Telemetry will bypass irrelevant personas and aggregate strictly within your defined role.</p>
                    </div>
                </div>
            </div>

            <button className="btn btn-secondary mt-8 uppercase tracking-widest text-xs outline-none" onClick={() => window.history.back()}>
                ← Return to Previous Environment
            </button>
        </div>
    );
};

export default ProxyComponent;

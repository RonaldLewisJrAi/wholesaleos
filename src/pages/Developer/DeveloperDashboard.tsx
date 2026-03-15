import React from 'react';
import { useAuth } from '../../contexts/useAuth';
import { Navigate } from 'react-router-dom';
import { ShieldAlert, Code2, Database, MailX, SmartphoneNfc } from 'lucide-react';

export default function DeveloperDashboard() {
    const { user, developerMode } = useAuth();

    // Secondary defensive guard
    if (!developerMode) {
        return <Navigate to="/dashboard" replace />;
    }

    const testStripeSimulation = () => {
        alert("Action Intercepted: Stripe API is completely disabled in Developer Mode.");
    };

    const runMockOSINT = () => {
        alert("Mock OSINT Result:\nPhone: (555) 555-0123\nEmail: sandbox@example.com");
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] p-8">
            <div className="max-w-6xl mx-auto space-y-6">

                <header className="mb-10">
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-[var(--text-primary)]">
                        <Code2 size={32} className="text-emerald-500" />
                        Developer Environment
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-2 italic">
                        All infrastructure interactions (Stripe, Emails, OSINT) are heavily mocked in this workspace.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sandbox Controls */}
                    <div className="glass-panel p-6 border-l-4 border-l-purple-500">
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                            <Database size={20} className="text-purple-400" />
                            Mock Data Seeders
                        </h2>
                        <button className="w-full btn-ghost border border-white/10 hover:bg-white/5 py-3 rounded text-left mb-2">
                            Inject Mock Sandbox Deal
                        </button>
                        <button className="w-full btn-ghost border border-white/10 hover:bg-white/5 py-3 rounded text-left">
                            Inject Mock Investor Reservation
                        </button>
                    </div>

                    {/* Simulation Triggers */}
                    <div className="glass-panel p-6 border-l-4 border-l-rose-500">
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                            <ShieldAlert size={20} className="text-rose-400" />
                            Service Bypasses
                        </h2>

                        <div className="space-y-3">
                            <button
                                onClick={runMockOSINT}
                                className="w-full flex justify-between items-center bg-white/5 hover:bg-white/10 py-3 px-4 rounded transition-colors"
                            >
                                <span className="flex items-center gap-2">
                                    <SmartphoneNfc size={16} /> Fake Skip Trace API
                                </span>
                                <span className="text-xs bg-rose-500/20 text-rose-300 px-2 py-1 rounded">MOCKED</span>
                            </button>

                            <button
                                onClick={testStripeSimulation}
                                className="w-full flex justify-between items-center bg-white/5 hover:bg-white/10 py-3 px-4 rounded transition-colors"
                            >
                                <span className="flex items-center gap-2">
                                    <ShieldAlert size={16} /> Simulate Payment Gateway
                                </span>
                                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded">SAFE</span>
                            </button>

                            <button className="w-full flex justify-between items-center bg-white/5 hover:bg-white/10 py-3 px-4 rounded transition-colors">
                                <span className="flex items-center gap-2">
                                    <MailX size={16} /> Simulate Email Blast
                                </span>
                                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">SILENT</span>
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

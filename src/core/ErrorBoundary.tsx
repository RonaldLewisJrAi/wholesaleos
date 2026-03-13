import React from "react";

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        console.error("WholesaleOS Runtime Error:", error, info);

        // Attempt telemetry transmission silently
        fetch('http://127.0.0.1:9998/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                channel: 'app',
                level: 'error',
                message: 'FATAL REACT RENDER CRASH (Global Boundary)',
                metadata: {
                    name: error?.name,
                    message: error?.message,
                    stack: error?.stack,
                    componentStack: info?.componentStack
                }
            })
        }).catch(e => console.error("Telemetry proxy failed to record crash", e));
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-[#050816] text-[#E2E8F0] p-6 font-mono selection:bg-red-500/30">
                    <div className="max-w-3xl w-full glass-card p-8 border-red-900/40 relative overflow-hidden ring-1 ring-red-500/20">
                        {/* Dramatic Red Glow Background */}
                        <div className="absolute top-[-20%] left-[-10%] w-[130%] h-[150%] bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.08)_0%,transparent_60%)] pointer-events-none"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6 border-b border-red-900/30 pb-4">
                                <div className="w-10 h-10 rounded-full bg-red-950/50 flex flex-col justify-center items-center shadow-[0_0_15px_rgba(220,38,38,0.4)] border border-red-800/50 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-red-500/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                    <span className="text-red-400 font-bold text-xl drop-shadow-[0_0_8px_rgba(248,113,113,0.8)] z-10 leading-none mb-1">!</span>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight text-white mb-1 drop-shadow-md">System Crash Detected</h1>
                                    <p className="text-xs text-red-400/80 font-mono tracking-widest uppercase">WholesaleOS Core Render Failure</p>
                                </div>
                            </div>

                            <p className="text-sm text-gray-300 mb-6 leading-relaxed">
                                A critical error occurred during the React rendering cycle. The application state cannot be safely recovered.
                            </p>

                            {/* Error Details Payload */}
                            <div className="bg-[#02040A]/80 border border-slate-800 rounded-lg p-5 mb-8 overflow-x-auto custom-scrollbar">
                                <div className="text-xs text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500/50"></span>
                                    Exception Signature
                                </div>
                                <div className="font-mono text-red-300 text-sm whitespace-pre-wrap leading-relaxed break-words">
                                    {this.state.error && this.state.error.toString()}
                                </div>
                            </div>

                            <div className="flex justify-end pt-2 border-t border-slate-800/50">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-6 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-mono text-sm uppercase tracking-widest rounded transition-all duration-200 shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_20px_rgba(220,38,38,0.5)] border border-red-500/50 hover:-translate-y-0.5"
                                >
                                    Reboot Application
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

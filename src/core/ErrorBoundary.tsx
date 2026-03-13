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
                <div className="flex items-center justify-center h-screen bg-[#0B1F33] text-white">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold mb-4">WholesaleOS Error</h1>
                        <p className="text-gray-300">
                            Something unexpected happened. Please refresh the page.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

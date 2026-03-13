import React from 'react';

export class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Caught by GlobalErrorBoundary:", error, errorInfo);

        // Fire it blindly over the wire to our new telemetry backend
        fetch('http://127.0.0.1:9998/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                channel: 'app',
                level: 'error',
                message: 'FATAL REACT RENDER CRASH',
                metadata: {
                    name: error.name,
                    message: error.message,
                    stack: error.stack,
                    componentStack: errorInfo.componentStack
                }
            })
        }).catch(e => console.error("Telemetry proxy failed to record crash", e));
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', background: '#330000', color: 'white', minHeight: '100vh', fontFamily: 'monospace' }}>
                    <h2>Component Tree Crashed (Global Error Boundary)</h2>
                    <p>{this.state.error?.toString()}</p>
                    <pre style={{ overflowX: 'auto', background: 'rgba(0,0,0,0.5)', padding: '1rem', marginTop: '1rem' }}>
                        {this.state.error?.stack}
                        {'\n'}
                        {this.state.errorInfo?.componentStack}
                    </pre>
                </div>
            );
        }
        return this.props.children;
    }
}

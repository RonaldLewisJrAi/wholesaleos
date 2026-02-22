import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

const ScrollChevron = () => {
    const [isAtTop, setIsAtTop] = useState(true);

    useEffect(() => {
        const handleScroll = () => {
            // Check if we've scrolled down more than 100px
            if (window.scrollY > 100) {
                setIsAtTop(false);
            } else {
                setIsAtTop(true);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const scrollToBottom = () => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    };

    if (isAtTop) {
        return (
            <button
                onClick={scrollToBottom}
                style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    zIndex: 9999,
                    color: 'var(--text-primary)',
                    transition: 'all 0.2s ease'
                }}
                className="hover:scale-110"
                title="Scroll to Bottom"
            >
                <ChevronDown size={20} />
            </button>
        );
    }

    return (
        <button
            onClick={scrollToTop}
            style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                zIndex: 9999,
                color: 'var(--text-primary)',
                transition: 'all 0.2s ease'
            }}
            className="hover:scale-110"
            title="Scroll to Top"
        >
            <ChevronUp size={20} />
        </button>
    );
};

export default ScrollChevron;

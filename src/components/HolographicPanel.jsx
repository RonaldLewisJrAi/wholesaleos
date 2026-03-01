import React from 'react';
import './HolographicPanel.css';

/**
 * HolographicPanel
 * A reusable frosted glass component utilizing theme-aware variables for 
 * holographic visual effects (glow, shimmer, backdrop blur).
 * 
 * @param {ReactNode} children - Content of the panel
 * @param {string} className - Additional CSS classes
 * @param {object} style - Inline styles for positioning/overrides
 */
const HolographicPanel = ({ children, className = '', style = {} }) => {
    return (
        <div className={`hologram-panel hologram-fade-in ${className}`} style={style}>
            <div className="relative z-10 p-4">
                {children}
            </div>
        </div>
    );
};

export default HolographicPanel;

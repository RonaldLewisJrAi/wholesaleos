import React from 'react';
import { useSubscription } from '../contexts/useSubscription';
import { AlertCircle, PauseCircle, Clock, XCircle } from 'lucide-react';

const GlobalStatusBanner = () => {
    // Phase 31.5 org status
    const { subscriptionStatus } = useSubscription();
    // Example values: ACTIVE, GRACE_PERIOD, PAST_DUE, PAUSED, CANCELED, TERMINATED

    if (subscriptionStatus === 'ACTIVE' || !subscriptionStatus) return null;

    let bannerConfig = {
        icon: <AlertCircle size={16} />,
        bgColor: 'bg-warning',
        textColor: 'text-warning-content',
        message: 'System Status Alert',
        actionLabel: null,
        actionPath: null
    };

    // Phase 32 Countdown Timers (Mocked constraints for UI parsing)
    const retentionDaysLeft = 90;
    const graceDaysLeft = 5;
    const cancelDaysLeft = 14;

    switch (subscriptionStatus) {
        case 'GRACE_PERIOD':
            bannerConfig = {
                icon: <Clock size={16} />,
                bgColor: 'bg-warning/20 border-b border-warning/50',
                textColor: 'text-warning',
                message: `Grace Period: Your last payment failed. Please update your billing method to prevent service interruption in ${graceDaysLeft} days.`,
                actionLabel: 'Update Billing',
                actionPath: '/settings?tab=billing'
            };
            break;
        case 'PAST_DUE':
            bannerConfig = {
                icon: <AlertCircle size={16} />,
                bgColor: 'bg-danger border-b border-danger/50 shadow-lg',
                textColor: 'text-white font-bold',
                message: 'PAST DUE: Features Locked. Please update your payment method immediately to restore full system access.',
                actionLabel: 'Resolve Now',
                actionPath: '/settings?tab=billing'
            };
            break;
        case 'PAUSED':
            bannerConfig = {
                icon: <PauseCircle size={16} />,
                bgColor: 'bg-[var(--surface-light)] border-b border-[var(--border-light)]',
                textColor: 'text-muted',
                message: 'Organization is currently in PAUSED mode. Data is read-only. Billing is suspended.',
                actionLabel: 'Resume Plan',
                actionPath: '/settings?tab=billing'
            };
            break;
        case 'CANCELED':
            bannerConfig = {
                icon: <AlertCircle size={16} />,
                bgColor: 'bg-info/20 border-b border-info/50',
                textColor: 'text-info',
                message: `Canceled: Your subscription will downgrade to BASIC tier in ${cancelDaysLeft} days. Excess seats will be locked.`,
                actionLabel: 'Reactivate',
                actionPath: '/settings?tab=billing'
            };
            break;
        case 'TERMINATED':
            bannerConfig = {
                icon: <XCircle size={16} />,
                bgColor: 'bg-danger/30 border-b border-danger shadow-[0_0_20px_rgba(239,68,68,0.5)]',
                textColor: 'text-danger font-bold',
                message: `ACCOUNT TERMINATED. Data access is restricted to Admin only. Retained data will be permanently purged in ${retentionDaysLeft} days.`,
                actionLabel: 'Contact Support',
                actionPath: 'mailto:support@wholesaleos.com'
            };
            break;
        default:
            return null;
    }

    return (
        <div className={`w-full py-2 px-4 flex justify-center items-center gap-3 text-sm z-[9999] relative ${bannerConfig.bgColor} ${bannerConfig.textColor}`}>
            {bannerConfig.icon}
            <span>{bannerConfig.message}</span>
            {bannerConfig.actionLabel && (
                <button
                    onClick={() => window.location.href = bannerConfig.actionPath}
                    className={`ml-2 px-3 py-1 text-xs rounded uppercase tracking-wider font-bold transition-transform hover:scale-105 ${subscriptionStatus === 'PAST_DUE' ? 'bg-white text-danger' : 'bg-black/20 hover:bg-black/30'}`}
                >
                    {bannerConfig.actionLabel}
                </button>
            )}
        </div>
    );
};

export default GlobalStatusBanner;

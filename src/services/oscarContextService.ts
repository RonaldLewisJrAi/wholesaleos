import { useLocation } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";

// Gather live platform state to pass into the OSCAR Prompt
export const getOSCARContextSnapshot = () => {
    // We export a function that builds this snapshot on the fly 
    // when askOSCAR is called, to ensure fresh data.

    const locationPath = window.location.pathname;

    // Simulated local deal data (if we are on a deal page)
    let dealContext = {};
    if (locationPath.startsWith('/deal/')) {
        const dealId = locationPath.split('/')[2];
        // In a real scenario, this would intercept from a local store or hook.
        // For OSCAR base logic, we provide a generic template.
        dealContext = {
            dealId: dealId,
            dealScore: 82, // Placeholder
            escrowStatus: true,
            titleStatus: false,
            priorityDeal: true
        };
    }

    return {
        page: locationPath,
        activeDealData: Object.keys(dealContext).length > 0 ? dealContext : null,
        timestamp: new Date().toISOString()
    };
};

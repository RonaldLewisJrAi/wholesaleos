import { useLocation } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";

// Gather live platform state to pass into the OSCAR Prompt
export const getOSCARContextSnapshot = () => {
    // We export a function that builds this snapshot on the fly 
    // when askOSCAR is called, to ensure fresh data.

    const locationPath = window.location.pathname;

    let contextData: any = {
        page: locationPath,
        role: "investor" // Placeholder for auth role
    };

    if (locationPath.startsWith('/deal/')) {
        contextData = {
            ...contextData,
            dealScore: 82,
            escrowStatus: true,
            titleStatus: false
        };
    }

    return contextData;
};

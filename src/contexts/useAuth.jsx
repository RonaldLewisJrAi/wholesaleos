import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

// Simple fallback loading screen if UI is not available
const LoadingScreen = () => (
    <div className="flex items-center justify-center h-screen bg-[#0B1F33] text-white font-mono text-sm tracking-widest uppercase">
        <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            Authenticating Session...
        </div>
    </div>
);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const lastProcessedTokenObj = useRef(null);

    useEffect(() => {
        if (!supabase) {
            console.warn("Supabase client is null. Missing environment variables. Running in Unauthenticated Mode.");
            setTimeout(() => setLoadingAuth(false), 0);
            return;
        }

        let mounted = true;

        const handleSession = async (session) => {
            if (!mounted) return;
            if (session) {
                try {
                    console.info("[AUTH] Checking for existing user profile:", session.user.id);
                    const { data: profile, error } = await supabase
                        .from('profiles')
                        .select('*, organization_id, role')
                        .eq('id', session.user.id)
                        .maybeSingle();

                    if (error) {
                        console.error("[AUTH] Database profile fetch failed:", error);
                        setUser(session.user);
                    } else if (!profile) {
                        console.warn("[AUTH] No profile found. Auth Bootstrap Recovery Engaged.");
                        const { data: recovery, error: rpcError } = await supabase.rpc('bootstrap_recovery', {
                            p_user_id: session.user.id,
                            p_email: session.user.email,
                            p_meta: session.user.user_metadata || {}
                        });

                        if (!rpcError && recovery?.success) {
                            const { data: recoveredProfile } = await supabase.from('profiles').select('*, organization_id').eq('id', session.user.id).maybeSingle();
                            setUser({
                                ...session.user,
                                primary_persona: recoveredProfile?.primary_persona || session.user.user_metadata?.primary_persona || 'WHOLESALER',
                                organization_id: recoveredProfile?.organization_id || recovery.organization_id || null,
                                tier: recoveredProfile?.tier || 'none'
                            });
                        } else {
                            console.error("[AUTH] Bootstrap Recovery Failed:", rpcError || recovery?.error);
                            setUser(session.user);
                        }
                    } else {
                        const safeProfile = { ...profile };
                        if (safeProfile.role === 'developer') {
                            const restrictedKeys = ['stripe_account_id', 'bank_account_number', 'payout_amount', 'service_role_key', 'stripe_secret_key'];
                            restrictedKeys.forEach(key => {
                                safeProfile[key] = 'restricted';
                            });
                        }

                        console.info("[AUTH] Profile loaded correctly. Persona:", safeProfile.primary_persona);
                        setUser({
                            ...session.user,
                            ...safeProfile,
                            primary_persona: safeProfile?.primary_persona || 'WHOLESALER',
                            organization_id: safeProfile?.organization_id || null,
                            tier: safeProfile?.tier || 'none',
                            role: safeProfile?.role || 'user'
                        });
                    }
                } catch (err) {
                    console.error("Critical Auth Sync Exception:", err);
                    setUser(session.user);
                }
            } else {
                setUser(null);
            }
            if (mounted) setLoadingAuth(false);
        };

        const initSession = async () => {
            try {
                const { data, error } = await supabase.auth.getSession();
                if (error && error.name !== 'AbortError') console.error("[AUTH] Init error:", error);

                if (data?.session?.access_token !== lastProcessedTokenObj.current) {
                    lastProcessedTokenObj.current = data?.session?.access_token || null;
                    await handleSession(data?.session);
                } else if (!data?.session) {
                    await handleSession(null);
                }
            } catch (err) {
                if (err.name !== 'AbortError') console.error("[AUTH] Init Exception:", err);
                if (mounted) setLoadingAuth(false);
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'INITIAL_SESSION') return; // Handled by initSession

            const currentToken = session?.access_token || null;

            // Deduplicate rapid-fire redundant events (e.g. multiple SIGNED_IN or TOKEN_REFRESHED firing at once)
            if (currentToken === lastProcessedTokenObj.current) {
                return;
            }
            lastProcessedTokenObj.current = currentToken;
            handleSession(session);
        });

        initSession();

        return () => {
            mounted = false;
            if (subscription) subscription.unsubscribe();
        };
    }, []);

    // Phase 60: Extract Sandbox Flag
    const developerMode = user?.role === 'developer';

    // Phase 37 Safe Boot Loader Gate
    if (loadingAuth) {
        return <LoadingScreen />;
    }

    return (
        <AuthContext.Provider value={{ user, loadingAuth, developerMode }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    return useContext(AuthContext);
};

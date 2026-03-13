import React, { createContext, useContext, useEffect, useState } from 'react';
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

    useEffect(() => {
        if (!supabase) {
            console.warn("Supabase client is null. Missing environment variables. Running in Unauthenticated Mode.");
            setTimeout(() => setLoadingAuth(false), 0);
            return;
        }

        // Remove redundant getSession() call to prevent GoTrue token lock contention (AbortError)
        // onAuthStateChange already fires an 'INITIAL_SESSION' event automatically on mount.

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session) {
                    try {
                        // Attempt Primary Profile Fetch with maybeSingle to safely return null
                        console.info("[AUTH] Checking for existing user profile:", session.user.id);
                        const { data: profile, error } = await supabase
                            .from('profiles')
                            .select('*, organization_id')
                            .eq('id', session.user.id)
                            .maybeSingle();

                        if (error) {
                            console.error("[AUTH] Database profile fetch failed natively:", error);
                            setUser(session.user);
                            setLoadingAuth(false);
                            return; // Let the ErrorBoundary or Layout handle broken users
                        }

                        if (!profile) {
                            // No Rows Found - Trigger Bootstrap Recovery
                            console.warn("[AUTH] No profile found. Auth Bootstrap Recovery Engaged.");
                            const { data: recovery, error: rpcError } = await supabase.rpc('bootstrap_recovery', {
                                p_user_id: session.user.id,
                                p_email: session.user.email,
                                p_meta: session.user.user_metadata || {}
                            });

                            if (!rpcError && recovery?.success) {
                                console.info("[AUTH] Bootstrap Recovery Succeeded for user:", session.user.id);
                                // If recovery succeeded, retry fetching the profile once
                                const { data: recoveredProfile } = await supabase
                                    .from('profiles')
                                    .select('*, organization_id')
                                    .eq('id', session.user.id)
                                    .maybeSingle();

                                const augmentedUser = {
                                    ...session.user,
                                    primary_persona: recoveredProfile?.primary_persona || session.user.user_metadata?.primary_persona || 'WHOLESALER',
                                    organization_id: recoveredProfile?.organization_id || recovery.organization_id || null,
                                    tier: recoveredProfile?.tier || 'none'
                                };
                                setUser(augmentedUser);
                            } else {
                                console.error("[AUTH] Bootstrap Recovery Failed:", rpcError || recovery?.error);
                                setUser(session.user); // Fallback to raw GoTrue session
                            }

                        } else {
                            // Normal successful fetch
                            console.info("[AUTH] Profile loaded correctly. Persona:", profile.primary_persona);
                            const augmentedUser = {
                                ...session.user,
                                primary_persona: profile?.primary_persona || 'WHOLESALER',
                                organization_id: profile?.organization_id || null,
                                tier: profile?.tier || 'none'
                            };
                            setUser(augmentedUser);
                        }
                    } catch (err) {
                        console.error("Critical Auth Sync Exception:", err);
                        setUser(session.user);
                    }
                } else {
                    setUser(null);
                }
                setLoadingAuth(false);
            }
        );

        return () => {
            if (subscription) subscription.unsubscribe();
        };
    }, []);

    // Phase 37 Safe Boot Loader Gate
    if (loadingAuth) {
        return <LoadingScreen />;
    }

    return (
        <AuthContext.Provider value={{ user, loadingAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    return useContext(AuthContext);
};

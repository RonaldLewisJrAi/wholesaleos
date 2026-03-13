import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

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

        // MOCK AUTH BYPASS FOR BLACK SCREEN DEBUGGING (Removed - Normal Auth Restored)

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session) {
                    try {
                        // Attempt Primary Profile Fetch
                        const { data: profile, error } = await supabase
                            .from('profiles')
                            .select('*, organization_id')
                            .eq('id', session.user.id)
                            .single();

                        if (error && error.code === 'PGRST116') {
                            // PGRST116: No Rows Found - Trigger Bootstrap Recovery
                            console.warn("Auth Bootstrap Recovery Engaged. Identity token valid but relational profile missing.");
                            const { data: recovery, error: rpcError } = await supabase.rpc('bootstrap_recovery', {
                                p_user_id: session.user.id,
                                p_email: session.user.email,
                                p_meta: session.user.user_metadata || {}
                            });

                            if (!rpcError && recovery?.success) {
                                // If recovery succeeded, retry fetching the profile once
                                const { data: recoveredProfile } = await supabase
                                    .from('profiles')
                                    .select('*, organization_id')
                                    .eq('id', session.user.id)
                                    .single();

                                const augmentedUser = {
                                    ...session.user,
                                    primary_persona: recoveredProfile?.primary_persona || session.user.user_metadata?.primary_persona || 'WHOLESALER',
                                    organization_id: recoveredProfile?.organization_id || recovery.organization_id || null,
                                    tier: recoveredProfile?.tier || 'none'
                                };
                                setUser(augmentedUser);
                            } else {
                                console.error("Bootstrap Recovery Failed:", rpcError || recovery?.error);
                                setUser(session.user); // Fallback to raw GoTrue session
                            }

                        } else if (profile) {
                            // Normal successful fetch
                            const augmentedUser = {
                                ...session.user,
                                primary_persona: profile?.primary_persona || 'WHOLESALER',
                                organization_id: profile?.organization_id || null,
                                tier: profile?.tier || 'none'
                            };
                            setUser(augmentedUser);
                        } else {
                            // General error boundary
                            setUser(session.user);
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

    return (
        <AuthContext.Provider value={{ user, loadingAuth }}>
            {!loadingAuth && children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    return useContext(AuthContext);
};

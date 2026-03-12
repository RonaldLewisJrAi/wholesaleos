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


        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session) {
                    try {
                        // Refetch augmentation
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('*, organization_id')
                            .eq('id', session.user.id)
                            .single();

                        const augmentedUser = {
                            ...session.user,
                            primary_persona: profile?.primary_persona || 'WHOLESALER',
                            organization_id: profile?.organization_id || null,
                            tier: profile?.tier || 'none'
                        };
                        setUser(augmentedUser);
                    } catch (err) {
                        console.error("Profile fetch error:", err);
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

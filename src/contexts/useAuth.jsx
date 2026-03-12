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

        const getSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (!error && session) {
                // Fetch augmented user data
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
            }
            setLoadingAuth(false);
        };

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session) {
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
                } else {
                    setUser(null);
                }
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

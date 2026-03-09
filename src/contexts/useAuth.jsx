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
            // --- GLOBAL SUPER ADMIN BYPASS ---
            if (localStorage.getItem('super_admin_bypass') === 'true') {
                console.log("[useAuth] Bypassing Supabase Auth -> Forcing Super Admin Mock Session");
                setUser({
                    id: 'super-admin-mock-id',
                    email: 'ronald_lewis_jr@live.com',
                    user_metadata: { name: 'Super Admin' }
                });
                setLoadingAuth(false);
                return;
            }

            const { data: { session }, error } = await supabase.auth.getSession();
            if (!error && session) {
                setUser(session.user);
            }
            setLoadingAuth(false);
        };

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                // Ignore Auth changes if we are explicitly bypassing
                if (localStorage.getItem('super_admin_bypass') !== 'true') {
                    setUser(session?.user || null);
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

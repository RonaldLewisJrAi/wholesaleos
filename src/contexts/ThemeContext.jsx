import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const { user } = useAuth();

    // Default to dark, check local storage or system preference first before API hits
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme_preference');
        if (savedTheme) return savedTheme;
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
        return 'dark'; // Master design defaults to dark
    });

    // Handle root class injection for global CSS variable cascading
    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'light') {
            root.classList.add('light');
            root.classList.remove('dark');
        } else {
            root.classList.add('dark');
            root.classList.remove('light');
        }
        localStorage.setItem('theme_preference', theme);
    }, [theme]);

    // Pull from database on auth initialization 
    useEffect(() => {
        const fetchUserTheme = async () => {
            if (!user) return;
            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('theme_preference')
                    .eq('id', user.id)
                    .single();

                if (data && data.theme_preference) {
                    setTheme(data.theme_preference);
                }
            } catch (err) {
                console.error('Failed to pull user theme preference from DB', err);
            }
        };
        fetchUserTheme();
    }, [user]);

    const toggleTheme = async () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);

        if (user) {
            // Background sync to database
            supabase.from('profiles')
                .update({ theme_preference: newTheme })
                .eq('id', user.id)
                .then(({ error }) => {
                    if (error) console.error('Failed to sync theme preference to profile', error);
                });
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);

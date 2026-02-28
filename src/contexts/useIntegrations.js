import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth'; // Adjusted to use existing Auth context if applicable 

export const useIntegrations = () => {
    const { user } = useAuth();
    const [integrations, setIntegrations] = useState([]);
    const [featureFlags, setFeatureFlags] = useState([]);
    const [apiKeys, setApiKeys] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAll = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            // Get user's organization first
            const { data: userOrg, error: orgError } = await supabase
                .from('user_organizations')
                .select('organization_id, role')
                .eq('user_id', user.id)
                .single();

            if (orgError) throw orgError;

            const orgId = userOrg.organization_id;

            // Fetch Integrations
            const { data: ints, error: intError } = await supabase
                .from('integrations')
                .select('*')
                .eq('organization_id', orgId);

            if (!intError && ints) setIntegrations(ints);

            // Fetch Feature Flags
            const { data: flags, error: flagError } = await supabase
                .from('feature_flags')
                .select('*')
                .eq('organization_id', orgId);

            if (!flagError && flags) setFeatureFlags(flags);

            // Fetch API Keys
            const { data: keys, error: keyError } = await supabase
                .from('api_keys')
                .select('*')
                .eq('organization_id', orgId);

            if (!keyError && keys) setApiKeys(keys);

        } catch (err) {
            console.error("Error fetching integration data:", err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const saveIntegrationConfig = async (type, config, status = 'ACTIVE') => {
        try {
            const { data: userOrg } = await supabase
                .from('user_organizations')
                .select('organization_id')
                .eq('user_id', user.id)
                .single();

            const orgId = userOrg.organization_id;

            const { error } = await supabase
                .from('integrations')
                .upsert({
                    organization_id: orgId,
                    type,
                    config,
                    status,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'organization_id, type' });

            if (error) throw error;
            await fetchAll(); // Refresh
            return { success: true };
        } catch (err) {
            console.error("Save config error:", err);
            return { success: false, error: err.message };
        }
    };

    const toggleFeatureFlag = async (flagName, enabled) => {
        try {
            const { data: userOrg } = await supabase
                .from('user_organizations')
                .select('organization_id')
                .eq('user_id', user.id)
                .single();

            const orgId = userOrg.organization_id;

            const { error } = await supabase
                .from('feature_flags')
                .upsert({
                    organization_id: orgId,
                    flag_name: flagName,
                    enabled,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'organization_id, flag_name' });

            if (error) throw error;
            await fetchAll(); // Refresh
            return { success: true };
        } catch (err) {
            console.error("Toggle flag error:", err);
            return { success: false, error: err.message };
        }
    };

    return {
        integrations,
        featureFlags,
        apiKeys,
        loading,
        saveIntegrationConfig,
        toggleFeatureFlag,
        refresh: fetchAll
    };
};

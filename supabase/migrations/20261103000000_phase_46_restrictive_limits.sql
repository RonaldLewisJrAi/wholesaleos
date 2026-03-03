-- ==============================================================================
-- PHASE 46: RESTRICTIVE LIMITS
-- Objective: PostgreSQL evaluates `AS PERMISSIVE` (the default) RLS policies using `OR`.
-- If another policy says "users can insert deals", then the Deal Limit policy is 
-- bypassed completely! We must recreate the Subscription Limits as `AS RESTRICTIVE`
-- so PostgreSQL mandates them with an `AND` operator on top of all permissive checks.
-- ==============================================================================
-- 1. Redefine Leads Limit as RESTRICTIVE
DROP POLICY IF EXISTS "Enforce Lead Limit on Insert" ON leads;
CREATE POLICY "Enforce Lead Limit on Insert" ON leads AS RESTRICTIVE FOR
INSERT WITH CHECK (
        (
            SELECT subscription_tier
            FROM organizations
            WHERE id = organization_id
        ) != 'BASIC'
        OR get_active_lead_count(organization_id) < 25
    );
-- 2. Redefine Deals Limit as RESTRICTIVE
DROP POLICY IF EXISTS "Enforce Deal Limit on Insert" ON deals;
CREATE POLICY "Enforce Deal Limit on Insert" ON deals AS RESTRICTIVE FOR
INSERT WITH CHECK (
        (
            SELECT subscription_tier
            FROM organizations
            WHERE id = organization_id
        ) != 'BASIC'
        OR get_active_deal_count(organization_id) < 5
    );
-- 3. Redefine Spreadsheet Import Limit as RESTRICTIVE
DROP POLICY IF EXISTS "Enforce Spreadsheet Limit on Insert" ON staging_lead_imports;
CREATE POLICY "Enforce Spreadsheet Limit on Insert" ON staging_lead_imports AS RESTRICTIVE FOR
INSERT WITH CHECK (
        (
            SELECT subscription_tier
            FROM organizations
            WHERE id = organization_id
        ) != 'BASIC'
        OR (
            row_count <= 100
            AND (
                NOT EXISTS (
                    SELECT 1
                    FROM lead_import_logs
                    WHERE organization_id = staging_lead_imports.organization_id
                        AND created_at > (NOW() - INTERVAL '24 hours')
                )
            )
        )
    );
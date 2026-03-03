-- ==========================================
-- PHASE 38.5: TIER-BASED RECORD ENFORCEMENT
-- Objective: Physically cap BASIC (DEMO) tier
-- limits at the database layer using RLS.
-- RLS natively throws 403 Forbidden which aligns
-- with catching exactly 403 on the frontend.
-- ==========================================
-- Clean up any triggers from earlier drafts
DROP TRIGGER IF EXISTS trg_enforce_lead_limit ON leads;
DROP FUNCTION IF EXISTS enforce_lead_limit();
DROP TRIGGER IF EXISTS trg_enforce_deal_limit ON deals;
DROP FUNCTION IF EXISTS enforce_deal_limit();
DROP TRIGGER IF EXISTS trg_enforce_spreadsheet_limit ON staging_lead_imports;
DROP FUNCTION IF EXISTS enforce_spreadsheet_limit();
-- 1) LEAD INSERT GUARD RLS
-- Max 25 total leads for BASIC tier
DROP POLICY IF EXISTS "Enforce Lead Limit on Insert" ON leads;
CREATE POLICY "Enforce Lead Limit on Insert" ON leads FOR
INSERT WITH CHECK (
        (
            SELECT subscription_tier
            FROM organizations
            WHERE id = organization_id
        ) != 'BASIC'
        OR (
            SELECT COUNT(*)
            FROM leads l
            WHERE l.organization_id = organization_id
        ) < 25
    );
-- Note: Ensure RLS is active
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
-- 2) DEAL CREATION GUARD RLS
-- Max 5 active deals (status != 'Closed')
DROP POLICY IF EXISTS "Enforce Deal Limit on Insert" ON deals;
CREATE POLICY "Enforce Deal Limit on Insert" ON deals FOR
INSERT WITH CHECK (
        (
            SELECT subscription_tier
            FROM organizations
            WHERE id = organization_id
        ) != 'BASIC'
        OR (
            SELECT COUNT(*)
            FROM deals d
            WHERE d.organization_id = organization_id
                AND d.status != 'Closed'
        ) < 5
    );
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
-- 3) SPREADSHEET IMPORT GUARD RLS
-- Enforces Max 100 rows and 1 import per 24 hours on the staging table insertion
DROP POLICY IF EXISTS "Enforce Spreadsheet Limit on Insert" ON staging_lead_imports;
CREATE POLICY "Enforce Spreadsheet Limit on Insert" ON staging_lead_imports FOR
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
ALTER TABLE staging_lead_imports ENABLE ROW LEVEL SECURITY;
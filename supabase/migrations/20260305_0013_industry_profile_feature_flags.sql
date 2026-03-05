-- Migration: Add doc-level feature flags to industry profile defaults
-- Date: 2026-03-05

begin;

-- Merge in defaults for sub-features (idempotent)
update industry_profiles
set default_features = default_features
  || jsonb_build_object(
    'inventory', coalesce(default_features->'inventory', '{}'::jsonb) || '{"transactions":true,"transfers":true,"adjustments":true}'::jsonb,
    'sales', coalesce(default_features->'sales', '{}'::jsonb) || '{"quotations":true,"invoices":true,"returns":true}'::jsonb,
    'purchases', coalesce(default_features->'purchases', '{}'::jsonb) || '{"receipts":true,"vendorInvoices":true,"returns":true}'::jsonb,
    'hr', coalesce(default_features->'hr', '{}'::jsonb) || '{"attendance":true}'::jsonb
  );

commit;

-- Migration: Extend doc-level feature flags defaults (accounting/crm/settings)
-- Date: 2026-03-05

begin;

update industry_profiles
set default_features = default_features
  || jsonb_build_object(
    'accounting', coalesce(default_features->'accounting', '{}'::jsonb) || '{"accounts":true,"journal":true,"reports":true}'::jsonb,
    'crm', coalesce(default_features->'crm', '{}'::jsonb) || '{"leads":true,"contacts":true}'::jsonb,
    'settings', coalesce(default_features->'settings', '{}'::jsonb) || '{"users":true,"industryProfiles":true}'::jsonb
  );

commit;

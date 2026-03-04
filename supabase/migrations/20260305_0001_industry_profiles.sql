-- Migration: Industry profiles + company experience flags
-- Idempotent: safe to run on an existing schema.

-- Profiles define default enabled modules/workflows per company.
create table if not exists industry_profiles (
  code text primary key,
  name text not null,
  default_features jsonb not null default '{}'::jsonb,
  default_settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed base profiles.
insert into industry_profiles (code, name, default_features, default_settings)
values
  (
    'generic',
    'Generic',
    '{"modules":{"inventory":true,"accounting":true,"crm":true,"hr":true,"sales":true,"purchases":true}}'::jsonb,
    '{}'::jsonb
  ),
  (
    'retail_distribution',
    'Retail / Distribution',
    '{"modules":{"inventory":true,"accounting":true,"crm":true,"hr":false,"sales":true,"purchases":true}}'::jsonb,
    '{}'::jsonb
  ),
  (
    'services',
    'Services',
    '{"modules":{"inventory":false,"accounting":true,"crm":true,"hr":true,"sales":true,"purchases":false}}'::jsonb,
    '{}'::jsonb
  ),
  (
    'manufacturing',
    'Manufacturing',
    '{"modules":{"inventory":true,"accounting":true,"crm":true,"hr":true,"sales":true,"purchases":true,"manufacturing":true}}'::jsonb,
    '{}'::jsonb
  ),
  (
    'logistics',
    'Logistics / Warehousing',
    '{"modules":{"inventory":true,"accounting":false,"crm":false,"hr":false,"sales":true,"purchases":true,"logistics":true}}'::jsonb,
    '{}'::jsonb
  )
on conflict (code) do update
set
  name = excluded.name,
  default_features = excluded.default_features,
  default_settings = excluded.default_settings;

-- Company-level knobs for experience selection.
alter table companies
  add column if not exists industry_type text not null default 'generic',
  add column if not exists profile_version int not null default 1,
  add column if not exists features jsonb not null default '{}'::jsonb;

-- Backfill any existing NULLs just in case (defensive).
update companies set industry_type = 'generic' where industry_type is null;
update companies set profile_version = 1 where profile_version is null;
update companies set features = '{}'::jsonb where features is null;

-- Add FK if missing.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'fk_companies_industry_type'
  ) then
    alter table companies
      add constraint fk_companies_industry_type
      foreign key (industry_type) references industry_profiles(code);
  end if;
end $$;

create index if not exists ix_companies_industry_type on companies(industry_type);

-- Keep industry_profiles.updated_at current
-- (companies already has set_updated_at trigger)
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_industry_profiles_set_updated_at'
  ) then
    create trigger trg_industry_profiles_set_updated_at
    before update on industry_profiles
    for each row execute function set_updated_at();
  end if;
end $$;

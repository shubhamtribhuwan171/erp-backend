-- Dev-only: set known passwords for demo users (LOCAL ONLY)
-- Password: Passw0rd!

begin;

-- Update existing Acme users
update users
set password_hash = crypt('Passw0rd!', gen_salt('bf'))
where email in (
  'ananya.owner@acme-erp.com',
  'rahul.admin@acme-erp.com',
  'meera.manager@acme-erp.com',
  'karan.ops@acme-erp.com',
  'pooja.sales@acme-erp.com'
);

-- Update Beta user (if present)
update users
set password_hash = crypt('Passw0rd!', gen_salt('bf'))
where email = 'beta.owner@beta-erp.com';

commit;

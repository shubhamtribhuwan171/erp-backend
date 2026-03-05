-- Migration: HR attendance records
-- Date: 2026-03-05

begin;

create table if not exists attendance_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  attendance_date date not null,
  status text not null default 'present',
  notes text,
  created_by_user_id uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, employee_id, attendance_date)
);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_attendance_records_set_updated_at') then
    create trigger trg_attendance_records_set_updated_at
    before update on attendance_records
    for each row execute function set_updated_at();
  end if;
end $$;

create index if not exists ix_attendance_records_company_date on attendance_records(company_id, attendance_date);

-- Optional: restrict to known statuses
alter table attendance_records
  drop constraint if exists chk_attendance_records_status;

alter table attendance_records
  add constraint chk_attendance_records_status
  check (status = any (array['present','absent','leave']));

commit;

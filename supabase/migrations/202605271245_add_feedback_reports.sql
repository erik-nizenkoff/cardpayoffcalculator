create table if not exists public.feedback_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  uid text not null,
  report_type text not null default 'issue',
  message text not null,
  email text,
  page_url text,
  user_agent text,
  viewport jsonb not null default '{}'::jsonb,
  input_state jsonb not null default '{}'::jsonb,
  result_summary jsonb not null default '{}'::jsonb,
  sample_mode boolean not null default false,
  telemetry_opted_out boolean not null default false,
  constraint feedback_reports_type_check
    check (report_type in ('issue', 'comment', 'suggestion')),
  constraint feedback_reports_message_length_check
    check (char_length(btrim(message)) between 5 and 4000),
  constraint feedback_reports_email_length_check
    check (email is null or char_length(email) <= 254),
  constraint feedback_reports_email_format_check
    check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

create index if not exists feedback_reports_created_at_idx
  on public.feedback_reports (created_at desc);

create index if not exists feedback_reports_uid_idx
  on public.feedback_reports (uid);

alter table public.feedback_reports enable row level security;

grant usage on schema public to anon;
grant insert on table public.feedback_reports to anon;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'feedback_reports'
      and policyname = 'anon insert feedback reports'
  ) then
    create policy "anon insert feedback reports"
      on public.feedback_reports
      for insert
      to anon
      with check (true);
  end if;
end $$;

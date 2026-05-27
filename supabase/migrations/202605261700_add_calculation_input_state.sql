alter table public.calculations
  add column if not exists input_state jsonb not null default '{}'::jsonb;


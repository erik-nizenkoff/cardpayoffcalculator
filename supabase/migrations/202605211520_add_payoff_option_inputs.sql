alter table public.calculations
  add column if not exists payoff_options jsonb not null default '[]'::jsonb,
  add column if not exists num_payoff_options integer not null default 0,
  add column if not exists num_balance_transfer_options integer not null default 0,
  add column if not exists num_consolidation_loan_options integer not null default 0;

create index if not exists calculations_num_payoff_options_idx
  on public.calculations (num_payoff_options);


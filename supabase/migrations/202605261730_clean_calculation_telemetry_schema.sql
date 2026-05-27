truncate table public.calculations;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'calculations'
      and column_name = 'target_date'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'calculations'
      and column_name = 'target_month'
  ) then
    alter table public.calculations rename column target_date to target_month;
  end if;
end $$;

alter table public.calculations
  drop column if exists target_date,
  drop column if exists method,
  drop column if exists extra_payment,
  drop column if exists cards,
  drop column if exists loans,
  drop column if exists num_cards,
  drop column if exists num_loans,
  drop column if exists total_balance,
  drop column if exists avg_apr;

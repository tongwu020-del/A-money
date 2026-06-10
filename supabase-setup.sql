create table if not exists public.ledger_entries (
  id text primary key,
  group_id text,
  payer text not null,
  debtor text not null,
  amount numeric(12, 2) not null,
  note text not null,
  entry_created_at text not null,
  created_by text,
  is_seed boolean not null default false,
  inserted_at timestamptz not null default now()
);

-- 新一轮账本从空账开始；如果表里已有旧数据，运行本脚本会清空。
truncate table public.ledger_entries;

alter table public.ledger_entries enable row level security;

drop policy if exists "ledger read" on public.ledger_entries;
drop policy if exists "ledger insert" on public.ledger_entries;
drop policy if exists "ledger update" on public.ledger_entries;
drop policy if exists "ledger delete" on public.ledger_entries;

create policy "ledger read"
on public.ledger_entries
for select
to anon
using (true);

create policy "ledger insert"
on public.ledger_entries
for insert
to anon
with check (true);

create policy "ledger update"
on public.ledger_entries
for update
to anon
using (true)
with check (true);

create policy "ledger delete"
on public.ledger_entries
for delete
to anon
using (true);

alter table public.ledger_entries replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.ledger_entries;
  exception
    when duplicate_object then null;
  end;
end $$;

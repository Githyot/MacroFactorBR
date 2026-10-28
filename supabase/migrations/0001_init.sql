-- MacroFactorBR: banco do backend.
-- Dados de saúde são sensíveis (LGPD, art. 11): cada usuário só lê e escreve os próprios dados,
-- e a conta inteira pode ser apagada pela função delete-account.

-- Perfil público mínimo e plano.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  is_pro boolean not null default false,
  pro_until timestamptz,
  consent_at timestamptz,
  created_at timestamptz not null default now()
);

-- Estado completo do app (diário, pesos, receitas...) sincronizado entre aparelhos.
-- Um documento por usuário; o app resolve conflitos por updated_at (última escrita vence).
create table public.user_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Base compartilhada: cada rótulo lido por um usuário vira dado para todos.
-- Entra como "pending" e fica "verified" quando outros 2 usuários confirmam o mesmo produto.
create table public.shared_foods (
  id uuid primary key default gen_random_uuid(),
  barcode text not null check (barcode ~ '^[0-9]{8,14}$'),
  name text not null check (length(name) between 2 and 120),
  brand text check (length(brand) <= 80),
  per100g jsonb not null,
  serving_grams numeric check (serving_grams > 0 and serving_grams < 5000),
  serving_description text check (length(serving_description) <= 60),
  liquid boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  confirmations int not null default 0,
  rejections int not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index shared_foods_barcode_idx on public.shared_foods (barcode);
create unique index shared_foods_one_verified on public.shared_foods (barcode) where status = 'verified';

create table public.food_reports (
  food_id uuid not null references public.shared_foods (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  agrees boolean not null,
  created_at timestamptz not null default now(),
  primary key (food_id, user_id)
);

-- Uso de IA por dia (cota do plano grátis).
create table public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default current_date,
  kind text not null,
  count int not null default 0,
  primary key (user_id, day, kind)
);

-- Cria o perfil junto com o usuário.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Moderação automática da base compartilhada.
create function public.apply_food_report() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  yes int;
  no int;
  creator uuid;
  code text;
begin
  select created_by, barcode into creator, code from shared_foods where id = new.food_id;
  if creator = new.user_id then
    raise exception 'Quem cadastrou não pode confirmar o próprio alimento';
  end if;
  select count(*) filter (where agrees), count(*) filter (where not agrees)
    into yes, no from food_reports where food_id = new.food_id;
  update shared_foods set confirmations = yes, rejections = no where id = new.food_id;
  if no >= 2 and no > yes then
    update shared_foods set status = 'rejected' where id = new.food_id;
  elsif yes >= 2 and not exists (select 1 from shared_foods where barcode = code and status = 'verified') then
    update shared_foods set status = 'verified' where id = new.food_id;
  end if;
  return new;
end $$;
create trigger on_food_report after insert on public.food_reports
  for each row execute function public.apply_food_report();

-- RLS
alter table public.profiles enable row level security;
alter table public.user_state enable row level security;
alter table public.shared_foods enable row level security;
alter table public.food_reports enable row level security;
alter table public.ai_usage enable row level security;

create policy "perfil próprio" on public.profiles for select using (auth.uid() = id);
create policy "aceite LGPD" on public.profiles for update using (auth.uid() = id)
  with check (auth.uid() = id);
-- is_pro só muda pelo servidor (webhook de pagamento com service role).
revoke update on public.profiles from authenticated;
grant update (consent_at) on public.profiles to authenticated;

create policy "estado próprio" on public.user_state for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "ler base compartilhada" on public.shared_foods for select to authenticated
  using (status <> 'rejected');
create policy "cadastrar na base" on public.shared_foods for insert to authenticated
  with check (created_by = auth.uid() and status = 'pending' and confirmations = 0 and rejections = 0);

create policy "confirmar alimento" on public.food_reports for insert to authenticated
  with check (user_id = auth.uid());
create policy "ver minhas confirmações" on public.food_reports for select to authenticated
  using (user_id = auth.uid());

create policy "ver meu uso de IA" on public.ai_usage for select using (auth.uid() = user_id);

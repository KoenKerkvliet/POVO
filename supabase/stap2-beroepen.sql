-- ============================================================
-- Stap 2: beroepen en routes
-- Voer eerst schema.sql uit (stap 1). Plak dan dit bestand in Supabase > SQL Editor > Run.
-- Je kunt het veilig opnieuw uitvoeren: bestaande gegevens blijven staan.
-- ============================================================

-- Een beroep, bijvoorbeeld kapper of huisarts.
create table if not exists public.beroepen (
  id            uuid primary key default gen_random_uuid(),
  naam          text not null,
  omschrijving  text,
  aangemaakt_op timestamptz not null default now()
);

-- Een route naar een beroep. 'stappen' is de volgorde van onderdelen uit het schema,
-- ná de basisschool, bijvoorbeeld {vmbo-kbl,mbo3}. Een beroep kan meerdere routes hebben.
create table if not exists public.beroep_routes (
  id        uuid primary key default gen_random_uuid(),
  beroep_id uuid not null references public.beroepen (id) on delete cascade,
  stappen   text[] not null check (cardinality(stappen) between 1 and 8),
  volgorde  integer not null default 0
);

create index if not exists beroep_routes_beroep_idx on public.beroep_routes (beroep_id);

-- Beveiliging: iedereen leest, alleen de beheerder schrijft (functie is_beheerder() komt uit schema.sql).
alter table public.beroepen      enable row level security;
alter table public.beroep_routes enable row level security;

drop policy if exists "beroepen lezen"       on public.beroepen;
drop policy if exists "beroep_routes lezen"  on public.beroep_routes;
drop policy if exists "beroepen beheren"     on public.beroepen;
drop policy if exists "beroep_routes beheren" on public.beroep_routes;

create policy "beroepen lezen"      on public.beroepen      for select to anon, authenticated using (true);
create policy "beroep_routes lezen" on public.beroep_routes for select to anon, authenticated using (true);

create policy "beroepen beheren" on public.beroepen
  for all to authenticated
  using (public.is_beheerder()) with check (public.is_beheerder());

create policy "beroep_routes beheren" on public.beroep_routes
  for all to authenticated
  using (public.is_beheerder()) with check (public.is_beheerder());

grant select on public.beroepen, public.beroep_routes to anon, authenticated;
grant insert, update, delete on public.beroepen, public.beroep_routes to authenticated;

-- Twee voorbeelden om mee te beginnen. Alleen toegevoegd als er nog geen beroepen zijn.
-- Controleer ze en pas ze aan in het dashboard.
do $$
declare
  kapper   uuid;
  huisarts uuid;
begin
  if not exists (select 1 from public.beroepen) then
    insert into public.beroepen (naam, omschrijving)
    values ('Kapper', 'Een kapper knipt, kleurt en stylt haar. Je leert dit vooral in de praktijk, op het mbo.')
    returning id into kapper;

    insert into public.beroep_routes (beroep_id, stappen, volgorde) values
      (kapper, array['vmbo-bbl', 'mbo2'], 1),
      (kapper, array['vmbo-kbl', 'mbo3'], 2),
      (kapper, array['vmbo-tl',  'mbo4'], 3);

    insert into public.beroepen (naam, omschrijving)
    values ('Huisarts', 'Een huisarts is de dokter waar je als eerste naartoe gaat. Je studeert eerst geneeskunde op de universiteit en doet daarna nog een vervolgopleiding tot huisarts.')
    returning id into huisarts;

    insert into public.beroep_routes (beroep_id, stappen, volgorde) values
      (huisarts, array['vwo', 'wo'], 1),
      (huisarts, array['havo', 'vwo', 'wo'], 2),
      (huisarts, array['vmbo-tl', 'havo', 'vwo', 'wo'], 3);
  end if;
end $$;

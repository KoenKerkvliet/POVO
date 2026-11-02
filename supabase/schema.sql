-- ============================================================
-- Doorstroomschema POVO — database voor Supabase
-- Plak dit hele bestand in Supabase > SQL Editor en klik op "Run".
-- Je kunt het veilig opnieuw uitvoeren: bestaande gegevens blijven staan.
-- ============================================================

-- 1. Tabellen -------------------------------------------------

-- De onderdelen van het schema (pr.o., vmbo-leerwegen, havo, vwo, ...).
-- 'omschrijving' is leeg gelaten: dan gebruikt de website een standaardtekst.
-- Je kunt die tekst via het dashboard aanpassen.
create table if not exists public.niveaus (
  id            text primary key,
  naam          text    not null,
  heeft_scholen boolean not null default false,
  volgorde      integer not null default 0,
  omschrijving  text
);

-- De scholen in de regio.
create table if not exists public.scholen (
  id            uuid primary key default gen_random_uuid(),
  naam          text not null,
  plaats        text not null,
  adres         text,
  website       text,
  aangemaakt_op timestamptz not null default now()
);

-- Welke school welk niveau aanbiedt (een school kan er meerdere hebben).
create table if not exists public.school_niveaus (
  school_id uuid not null references public.scholen (id) on delete cascade,
  niveau_id text not null references public.niveaus (id) on delete restrict,
  primary key (school_id, niveau_id)
);

create index if not exists school_niveaus_niveau_idx on public.school_niveaus (niveau_id);

-- 2. Startgegevens: de niveaus ---------------------------------

insert into public.niveaus (id, naam, heeft_scholen, volgorde) values
  ('basisschool', 'Basisschool',                              false,  1),
  ('pro',         'Praktijkonderwijs',                        true,   2),
  ('vmbo',        'Vmbo',                                     false,  3),
  ('vmbo-bbl',    'Vmbo - basisberoepsgerichte leerweg',      true,   4),
  ('vmbo-kbl',    'Vmbo - kaderberoepsgerichte leerweg',      true,   5),
  ('vmbo-gl',     'Vmbo - gemengde leerweg',                  true,   6),
  ('vmbo-tl',     'Vmbo - theoretische leerweg (mavo)',       true,   7),
  ('havo',        'Havo',                                     true,   8),
  ('vwo',         'Vwo',                                      true,   9),
  ('mbo',         'Mbo',                                      false, 10),
  ('mbo1',        'Mbo niveau 1',                             false, 11),
  ('mbo2',        'Mbo niveau 2',                             false, 12),
  ('mbo3',        'Mbo niveau 3',                             false, 13),
  ('mbo4',        'Mbo niveau 4',                             false, 14),
  ('hbo',         'Hbo',                                      false, 15),
  ('wo',          'Wo (universiteit)',                        false, 16),
  ('werk',        'Werk of Werken',                           false, 17)
on conflict (id) do nothing;

-- 3. Beveiliging -----------------------------------------------
-- Iedereen mag de gegevens LEZEN (de kinderen zien het schema).
-- Alleen jij mag SCHRIJVEN: dat wordt gecontroleerd op je e-mailadres.
-- Wil je later een tweede beheerder? Voeg het e-mailadres toe in de lijst hieronder.

create or replace function public.is_beheerder()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'email', '') = any (array[
    'koenkerkvliet@gmail.com'
  ]);
$$;

alter table public.niveaus        enable row level security;
alter table public.scholen        enable row level security;
alter table public.school_niveaus enable row level security;

-- Lezen: iedereen
drop policy if exists "niveaus lezen"        on public.niveaus;
drop policy if exists "scholen lezen"        on public.scholen;
drop policy if exists "school_niveaus lezen" on public.school_niveaus;

create policy "niveaus lezen"        on public.niveaus        for select to anon, authenticated using (true);
create policy "scholen lezen"        on public.scholen        for select to anon, authenticated using (true);
create policy "school_niveaus lezen" on public.school_niveaus for select to anon, authenticated using (true);

-- Schrijven: alleen de beheerder
drop policy if exists "niveaus aanpassen"        on public.niveaus;
drop policy if exists "scholen beheren"          on public.scholen;
drop policy if exists "school_niveaus beheren"   on public.school_niveaus;

create policy "niveaus aanpassen" on public.niveaus
  for update to authenticated
  using (public.is_beheerder()) with check (public.is_beheerder());

create policy "scholen beheren" on public.scholen
  for all to authenticated
  using (public.is_beheerder()) with check (public.is_beheerder());

create policy "school_niveaus beheren" on public.school_niveaus
  for all to authenticated
  using (public.is_beheerder()) with check (public.is_beheerder());

-- Rechten op de tabellen zelf (nodig voor de Supabase-API)
grant usage on schema public to anon, authenticated;
grant select on public.niveaus, public.scholen, public.school_niveaus to anon, authenticated;
grant update on public.niveaus to authenticated;
grant insert, update, delete on public.scholen, public.school_niveaus to authenticated;

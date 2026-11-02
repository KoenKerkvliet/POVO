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
  informatie    text,
  tweetalig     boolean not null default false,
  aangemaakt_op timestamptz not null default now()
);

-- Voor wie schema.sql al eerder uitvoerde: voeg het vrije tekstveld 'informatie' toe.
alter table public.scholen add column if not exists informatie text;

-- Idem voor de keuze 'tweetalig onderwijs (tto)'.
alter table public.scholen add column if not exists tweetalig boolean not null default false;

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
  ('gymnasium',   'Gymnasium (vwo met Latijn en Grieks)',     true,  18),
  ('mbo',         'Mbo',                                      false, 10),
  ('mbo1',        'Mbo niveau 1',                             false, 11),
  ('mbo2',        'Mbo niveau 2',                             false, 12),
  ('mbo3',        'Mbo niveau 3',                             false, 13),
  ('mbo4',        'Mbo niveau 4',                             false, 14),
  ('hbo',         'Hbo',                                      false, 15),
  ('wo',          'Wo (universiteit)',                        false, 16),
  ('werk',        'Werk',                                     false, 17)
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

-- 4. Brugklassen -----------------------------------------------
-- Welke (brede) brugklassen een school heeft, bijvoorbeeld "havo/vwo, 2 jaar".
-- 'niveaus' zijn ids uit de tabel niveaus; 'jaren' is hoe lang de brede brugklas duurt.
create table if not exists public.school_brugklassen (
  id        uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.scholen (id) on delete cascade,
  niveaus   text[] not null check (cardinality(niveaus) between 1 and 6),
  jaren     smallint not null default 1 check (jaren between 1 and 3),
  volgorde  integer not null default 0
);

create index if not exists school_brugklassen_school_idx on public.school_brugklassen (school_id);

alter table public.school_brugklassen enable row level security;

drop policy if exists "school_brugklassen lezen"  on public.school_brugklassen;
drop policy if exists "school_brugklassen beheren" on public.school_brugklassen;

create policy "school_brugklassen lezen" on public.school_brugklassen
  for select to anon, authenticated using (true);

create policy "school_brugklassen beheren" on public.school_brugklassen
  for all to authenticated
  using (public.is_beheerder()) with check (public.is_beheerder());

grant select on public.school_brugklassen to anon, authenticated;
grant insert, update, delete on public.school_brugklassen to authenticated;

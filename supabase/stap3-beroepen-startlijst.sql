-- ============================================================
-- Beroepen en routes: een startlijst per niveau
-- Voer eerst schema.sql en stap2-beroepen.sql uit. Plak dit bestand daarna in Supabase > SQL Editor > Run.
-- Veilig opnieuw uit te voeren: een beroep dat al bestaat (op naam) wordt overgeslagen,
-- dus aanpassingen die je in het dashboard hebt gedaan blijven staan.
--
-- Praktijkonderwijs: vakkenvuller, schoonmaker, magazijnmedewerker, keukenhulp, medewerker groenvoorziening
-- Mbo niveau 1:      winkelassistent, bouwassistent, assistent in de zorg
-- Mbo niveau 2:      kapper, timmerman, kok, helpende in de zorg, verkoper
-- Mbo niveau 3:      pedagogisch medewerker, verzorgende, dierverzorger, elektricien, financieel-administratief medewerker
-- Mbo niveau 4:      verpleegkundige, doktersassistent, politieagent, software developer, onderwijsassistent
-- Hbo:               leraar basisonderwijs, fysiotherapeut, maatschappelijk werker, docent, ergotherapeut, journalist, bouwkundig ingenieur
-- Wo:                dierenarts, advocaat, psycholoog, apotheker, tandarts, rechter, wetenschappelijk onderzoeker
-- ============================================================

do $$
declare
  r record;
  nieuw uuid;
begin
  for r in
    select * from (values
    ('Vakkenvuller', 'Een vakkenvuller zorgt dat de schappen in de supermarkt vol liggen. Je pakt dozen uit en zet de producten op de goede plek.', array['pro,werk', 'pro,mbo1']),
    ('Schoonmaker', 'Een schoonmaker maakt gebouwen schoon, zoals scholen, kantoren en ziekenhuizen. Je werkt netjes en precies, meestal in een team.', array['pro,werk']),
    ('Magazijnmedewerker', 'In een magazijn pak je bestellingen in, zet je dozen klaar en laad je vrachtwagens. Voor een heftruck haal je eerst een certificaat.', array['pro,werk', 'pro,mbo1']),
    ('Keukenhulp', 'Een keukenhulp helpt in een restaurant of een grote keuken. Je snijdt groente, ruimt op en maakt de keuken schoon.', array['pro,werk', 'pro,mbo1']),
    ('Medewerker groenvoorziening', 'Je zorgt voor parken, tuinen en sportvelden. Je maait, snoeit, plant en haalt onkruid weg. Je werkt veel buiten.', array['pro,werk', 'pro,mbo1']),
    ('Winkelassistent', 'Een winkelassistent helpt klanten in de winkel, vult de schappen aan en werkt achter de kassa.', array['pro,mbo1']),
    ('Bouwassistent', 'Je helpt op de bouwplaats of bij het onderhoud van huizen. Je zet materiaal klaar en helpt bij timmeren, schilderen of metselen.', array['pro,mbo1']),
    ('Assistent in de zorg', 'Je helpt in de zorg en bij dienstverlening, bijvoorbeeld bij schoonmaken, eten uitdelen en gezelschap houden.', array['pro,mbo1']),
    ('Kapper', 'Een kapper knipt, kleurt en stylt haar. Je leert dit vooral in de praktijk, op het mbo.', array['vmbo-bbl,mbo2', 'vmbo-kbl,mbo3', 'vmbo-tl,mbo4']),
    ('Timmerman', 'Een timmerman bouwt en repareert dingen van hout, zoals vloeren, deuren, kozijnen en daken. Je werkt op de bouwplaats of in een werkplaats.', array['vmbo-bbl,mbo2', 'pro,mbo1,mbo2']),
    ('Kok', 'Een kok maakt gerechten in een restaurant, hotel of zorginstelling. Je leert koken, netjes werken en samenwerken in een keuken.', array['vmbo-bbl,mbo2', 'pro,mbo1,mbo2', 'vmbo-kbl,mbo3']),
    ('Helpende in de zorg', 'Een helpende ondersteunt mensen bij dagelijkse dingen, zoals wassen, aankleden en eten. Je werkt in een zorginstelling of bij mensen thuis.', array['vmbo-bbl,mbo2', 'pro,mbo1,mbo2']),
    ('Verkoper', 'Een verkoper helpt klanten in een winkel, vertelt over producten en rekent af.', array['vmbo-bbl,mbo2', 'pro,mbo1,mbo2']),
    ('Pedagogisch medewerker kinderopvang', 'Je zorgt voor kinderen op de kinderopvang of de buitenschoolse opvang. Je speelt, leest voor en begeleidt de kinderen.', array['vmbo-kbl,mbo3', 'vmbo-gl,mbo3', 'vmbo-bbl,mbo2,mbo3']),
    ('Verzorgende', 'Een verzorgende helpt mensen die zorg nodig hebben, bijvoorbeeld ouderen. Je helpt bij wassen en aankleden en doet ook medische handelingen, zoals medicijnen geven. Je werkt in een verpleeghuis, de thuiszorg of een ziekenhuis.', array['vmbo-kbl,mbo3', 'vmbo-gl,mbo3', 'vmbo-bbl,mbo2,mbo3']),
    ('Dierverzorger', 'Een dierverzorger zorgt voor dieren, bijvoorbeeld in een dierenasiel, dierentuin of dierenwinkel. Je geeft eten, houdt de verblijven schoon en let op hoe het met de dieren gaat.', array['vmbo-kbl,mbo3', 'vmbo-gl,mbo3', 'vmbo-bbl,mbo2,mbo3']),
    ('Elektricien', 'Een elektricien legt kabels, stopcontacten en lampen aan en repareert storingen. Je werkt in huizen, scholen en bedrijven.', array['vmbo-kbl,mbo3', 'vmbo-gl,mbo3', 'vmbo-bbl,mbo2,mbo3']),
    ('Financieel-administratief medewerker', 'Je houdt de administratie van een bedrijf bij. Je maakt facturen, boekt betalingen en houdt de cijfers bij.', array['vmbo-kbl,mbo3', 'vmbo-gl,mbo3', 'vmbo-bbl,mbo2,mbo3']),
    ('Verpleegkundige', 'Een verpleegkundige verzorgt zieke mensen in een ziekenhuis, een verpleeghuis of bij mensen thuis. Je kunt dit worden via het mbo (niveau 4) of via het hbo.', array['vmbo-gl,mbo4', 'vmbo-tl,mbo4', 'havo,mbo4', 'vmbo-tl,mbo4,hbo', 'havo,hbo', 'vwo,hbo']),
    ('Doktersassistent', 'Een doktersassistent werkt bij de huisarts. Je ontvangt patiënten, doet kleine onderzoeken en helpt de dokter.', array['vmbo-gl,mbo4', 'vmbo-tl,mbo4', 'havo,mbo4']),
    ('Politieagent', 'Een politieagent zorgt voor veiligheid en helpt mensen die in problemen zitten. Je moet minstens 18 jaar zijn om met de opleiding te beginnen.', array['vmbo-gl,mbo4', 'vmbo-tl,mbo4', 'havo,mbo4']),
    ('Software developer', 'Een software developer bouwt apps, websites en computerprogramma''s. Dit kun je worden via het mbo (niveau 4) of via het hbo.', array['vmbo-gl,mbo4', 'vmbo-tl,mbo4', 'havo,mbo4', 'vmbo-tl,mbo4,hbo', 'havo,hbo', 'vwo,hbo']),
    ('Onderwijsassistent', 'Een onderwijsassistent helpt de leraar in de klas. Je begeleidt kleine groepjes leerlingen en helpt kinderen die extra hulp nodig hebben.', array['vmbo-kbl,mbo4', 'vmbo-gl,mbo4', 'vmbo-tl,mbo4', 'havo,mbo4']),
    ('Leraar basisonderwijs', 'Een leraar op de basisschool geeft les aan kinderen van groep 1 tot en met 8. Je leert dit op de pabo, een opleiding op het hbo. Wie van het mbo komt, moet vaak eerst een toets doen.', array['havo,hbo', 'vwo,hbo', 'vmbo-tl,mbo4,hbo', 'vmbo-tl,havo,hbo']),
    ('Fysiotherapeut', 'Een fysiotherapeut helpt mensen die pijn hebben of niet goed kunnen bewegen, bijvoorbeeld na een blessure. Je leert dit op het hbo.', array['havo,hbo', 'vwo,hbo', 'vmbo-tl,havo,hbo']),
    ('Maatschappelijk werker', 'Een maatschappelijk werker helpt mensen met problemen, bijvoorbeeld thuis, met geld of op school. Je leert dit op het hbo.', array['havo,hbo', 'vwo,hbo', 'vmbo-tl,mbo4,hbo', 'vmbo-tl,havo,hbo']),
    ('Docent middelbare school (tweedegraads)', 'Een docent op de middelbare school geeft les in een vak, bijvoorbeeld wiskunde of Engels. Met een hbo-diploma mag je lesgeven in de onderbouw van alle schooltypen en op het vmbo.', array['havo,hbo', 'vwo,hbo', 'vmbo-tl,havo,hbo']),
    ('Ergotherapeut', 'Een ergotherapeut helpt mensen om dagelijkse dingen weer te kunnen doen, zoals koken, werken of spelen, ook als ze een beperking hebben. Je leert dit op het hbo.', array['havo,hbo', 'vwo,hbo', 'vmbo-tl,havo,hbo']),
    ('Journalist', 'Een journalist zoekt uit wat er gebeurt en vertelt dat in een krant, op een website, op de radio of op tv. Je leert dit op het hbo.', array['havo,hbo', 'vwo,hbo', 'vmbo-tl,mbo4,hbo', 'vmbo-tl,havo,hbo']),
    ('Bouwkundig ingenieur', 'Een bouwkundig ingenieur bedenkt en tekent gebouwen en zorgt dat ze goed gebouwd worden. Je leert dit op het hbo.', array['havo,hbo', 'vwo,hbo', 'vmbo-tl,mbo4,hbo', 'vmbo-gl,mbo4,hbo']),
    ('Dierenarts', 'Een dierenarts maakt zieke dieren beter. Je studeert diergeneeskunde op de universiteit. Voor deze studie is er vaak selectie of loting.', array['vwo,wo', 'havo,vwo,wo', 'vmbo-tl,havo,vwo,wo']),
    ('Advocaat', 'Een advocaat helpt mensen of bedrijven met juridische problemen en staat hen bij de rechter bij. Je studeert rechten op de universiteit en leert daarna het vak bij een advocatenkantoor.', array['vwo,wo', 'havo,vwo,wo']),
    ('Psycholoog', 'Een psycholoog helpt mensen met problemen in hun gedachten of gevoel. Je studeert psychologie op de universiteit. Voor sommige werkplekken volgt daarna nog een extra opleiding.', array['vwo,wo', 'havo,vwo,wo', 'havo,hbo,wo']),
    ('Apotheker', 'Een apotheker weet alles over medicijnen en geeft advies over het gebruik ervan. Je studeert farmacie op de universiteit.', array['vwo,wo', 'havo,vwo,wo']),
    ('Tandarts', 'Een tandarts zorgt voor gezonde tanden en kiezen. Je studeert tandheelkunde op de universiteit. Voor deze studie is er vaak selectie of loting.', array['vwo,wo', 'havo,vwo,wo']),
    ('Rechter', 'Een rechter beslist in een rechtszaak wat eerlijk is. Je studeert rechten op de universiteit en volgt daarna een opleiding tot rechter.', array['vwo,wo', 'havo,vwo,wo']),
    ('Wetenschappelijk onderzoeker', 'Een onderzoeker zoekt uit hoe dingen werken, bijvoorbeeld in de natuur, het lichaam of de maatschappij. Je studeert op de universiteit en gaat daarna vaak promoveren.', array['vwo,wo', 'havo,vwo,wo'])
    ) as t(naam, omschrijving, routes)
  loop
    if not exists (select 1 from public.beroepen where lower(naam) = lower(r.naam)) then
      insert into public.beroepen (naam, omschrijving)
      values (r.naam, r.omschrijving)
      returning id into nieuw;

      -- Elke route is een lijst stappen, gescheiden door komma's, bijvoorbeeld 'vmbo-kbl,mbo3'.
      insert into public.beroep_routes (beroep_id, stappen, volgorde)
      select nieuw, string_to_array(u.route, ','), u.nr
      from unnest(r.routes) with ordinality as u(route, nr);
    end if;
  end loop;
end $$;

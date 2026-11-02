// Gegevens ophalen uit Supabase (alleen lezen, zonder inloggen).
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { DEMO_SCHOLEN, DEMO_BEROEPEN } from './schema-data.js';

export const IS_GEKOPPELD = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

async function haal(pad) {
  const antwoord = await fetch(`${SUPABASE_URL}/rest/v1/${pad}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  if (!antwoord.ok) throw new Error(`Supabase gaf status ${antwoord.status}`);
  return antwoord.json();
}

// Geeft { scholen: [{id, naam, plaats, adres, website, informatie, tweetalig, niveaus: [id]}], beroepen: [{id, naam, omschrijving, routes: [{id, stappen}]}],
//         omschrijvingen: {id: tekst}, demo: boolean }
export async function laadGegevens() {
  if (!IS_GEKOPPELD) return { scholen: DEMO_SCHOLEN, beroepen: DEMO_BEROEPEN, omschrijvingen: {}, demo: true };

  // select=* neemt alle kolommen mee die er zijn, ook als er later velden (informatie, tweetalig) bij komen.
  const [scholen, niveaus] = await Promise.all([
    haal('scholen?select=*,school_niveaus(niveau_id)&order=plaats.asc,naam.asc'),
    haal('niveaus?select=id,omschrijving'),
  ]);

  // Brugklassen staan in een eigen tabel; bestaat die nog niet, dan tonen we gewoon geen brugklassen.
  const brugklassen = await haal('school_brugklassen?select=*&order=volgorde.asc').catch(() => []);

  // Beroepen zijn een aparte stap: ontbreken de tabellen nog, dan werkt de rest gewoon door.
  const beroepen = await haal('beroepen?select=id,naam,omschrijving,beroep_routes(id,stappen,volgorde)&order=naam.asc')
    .then((rijen) => rijen.map((b) => ({
      id: b.id,
      naam: b.naam,
      omschrijving: b.omschrijving || '',
      routes: [...b.beroep_routes].sort((x, y) => x.volgorde - y.volgorde).map((r) => ({ id: r.id, stappen: r.stappen })),
    })))
    .catch(() => []);

  return {
    beroepen,
    scholen: scholen.map((s) => ({
      id: s.id,
      naam: s.naam,
      plaats: s.plaats,
      adres: s.adres || '',
      informatie: s.informatie || '',
      tweetalig: Boolean(s.tweetalig),
      brugklassen: brugklassen.filter((b) => b.school_id === s.id).map((b) => ({ niveaus: b.niveaus, jaren: b.jaren })),
      website: s.website || '',
      niveaus: s.school_niveaus.map((n) => n.niveau_id),
    })),
    omschrijvingen: Object.fromEntries(niveaus.filter((n) => n.omschrijving).map((n) => [n.id, n.omschrijving])),
    demo: false,
  };
}

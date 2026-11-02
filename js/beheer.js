// Beheerdashboard: scholen en teksten aanpassen. Inloggen via Supabase Auth.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY, REGIO } from './config.js';
import { h, veiligeUrl } from './dom.js';
import {
  LEERWEGEN, NIVEAU_INFO, STANDAARD_OMSCHRIJVING, START_OPTIES, volgendeStappen,
  BRUGKLAS_NIVEAUS, BRUGKLAS_VOORBEELDEN, brugklasLabel,
} from './schema-data.js';

const inhoud = document.querySelector('#inhoud');
const meldingEl = document.querySelector('#melding');
const uitlogKnop = document.querySelector('#uitloggen');

const sb = SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const staat = { tab: 'scholen', scholen: [], teksten: {}, beroepen: [], beroepenFout: null, zoek: '', ingelogd: null, heeftInformatie: true, heeftTweetalig: true, heeftBrugklassen: true,
  niveausInDb: new Set() };

// Welke niveaus je bij een school kunt aanvinken.
const KEUZES = [
  { id: 'pro', label: 'Praktijkonderwijs' },
  { groep: 'Vmbo', leden: LEERWEGEN.map((lw) => ({ id: lw.id, label: NIVEAU_INFO[lw.id].naam.replace('Vmbo - ', '') })) },
  { id: 'havo', label: 'Havo' },
  { id: 'vwo', label: 'Vwo' },
  { id: 'gymnasium', label: 'Gymnasium' },
];

// Het gymnasium kan pas gekozen worden als het niveau in de database staat (schema.sql opnieuw uitvoeren).
const beschikbaar = (id) => id !== 'gymnasium' || staat.niveausInDb.has('gymnasium');
const KORT = Object.fromEntries(Object.entries(NIVEAU_INFO).map(([id, i]) => [id, i.kort]));

let meldingTimer;
function melding(tekst, fout = false) {
  meldingEl.textContent = tekst;
  meldingEl.classList.toggle('fout', fout);
  meldingEl.hidden = false;
  clearTimeout(meldingTimer);
  meldingTimer = setTimeout(() => { meldingEl.hidden = true; }, fout ? 7000 : 3000);
}

function foutTekst(fout) {
  if (fout?.code === '42501' || /row-level security/i.test(fout?.message || '')) {
    return 'Dit mag niet: je e-mailadres staat niet in de lijst met beheerders (zie schema.sql).';
  }
  if (fout?.code === '42P01' || fout?.code === 'PGRST205') return 'De tabellen bestaan nog niet. Voer eerst schema.sql uit in Supabase.';
  return fout?.message || 'Er ging iets mis.';
}

// ---------- Inloggen ----------

function toonNietGekoppeld() {
  inhoud.replaceChildren(h('section', { class: 'blok-kaart' },
    h('h2', {}, 'Supabase is nog niet gekoppeld'),
    h('p', {}, 'Vul in ', h('code', {}, 'js/config.js'), ' de publieke sleutel (anon / publishable key) in. Zie de README voor de stappen.')));
}

function toonInloggen() {
  uitlogKnop.hidden = true;
  const email = h('input', { type: 'email', id: 'email', autocomplete: 'username', required: true });
  const wachtwoord = h('input', { type: 'password', id: 'wachtwoord', autocomplete: 'current-password', required: true });
  const knop = h('button', { type: 'submit', class: 'knop' }, 'Inloggen');

  const formulier = h('form', {
    class: 'blok-kaart',
    onsubmit: async (e) => {
      e.preventDefault();
      knop.disabled = true;
      const { error } = await sb.auth.signInWithPassword({ email: email.value.trim(), password: wachtwoord.value });
      knop.disabled = false;
      if (error) melding('Inloggen mislukt: controleer je e-mailadres en wachtwoord.', true);
    },
  },
  h('h2', {}, 'Inloggen'),
  h('p', {}, 'Alleen de beheerder kan scholen aanpassen.'),
  h('label', { for: 'email' }, 'E-mailadres'), email,
  h('label', { for: 'wachtwoord' }, 'Wachtwoord'), wachtwoord,
  h('div', { class: 'rij' }, knop));

  inhoud.replaceChildren(formulier);
  email.focus();
}

// ---------- Gegevens ----------

async function laadScholen() {
  // 'informatie' en 'tweetalig' zijn later toegevoegd: ontbreekt een kolom nog, dan werkt het beheer zonder dat veld.
  const bestaat = async (kolom) => !(await sb.from('scholen').select(kolom).limit(1)).error;
  [staat.heeftInformatie, staat.heeftTweetalig] = await Promise.all([bestaat('informatie'), bestaat('tweetalig')]);

  const { data, error } = await sb.from('scholen').select('*,school_niveaus(niveau_id)').order('plaats').order('naam');
  if (error) throw error;

  // Brugklassen staan in een eigen tabel; bestaat die nog niet, dan werkt het beheer zonder.
  const bk = await sb.from('school_brugklassen').select('*').order('volgorde');
  staat.heeftBrugklassen = !bk.error;
  const brugklassen = bk.error ? [] : bk.data;

  staat.scholen = data.map((s) => ({
    ...s,
    informatie: s.informatie || '',
    tweetalig: Boolean(s.tweetalig),
    niveaus: s.school_niveaus.map((n) => n.niveau_id),
    brugklassen: brugklassen.filter((b) => b.school_id === s.id).map((b) => ({ id: b.id, niveaus: b.niveaus, jaren: b.jaren })),
  }));
}

async function laadTeksten() {
  const { data, error } = await sb.from('niveaus').select('id,omschrijving');
  if (error) throw error;
  staat.teksten = Object.fromEntries(data.map((n) => [n.id, n.omschrijving || '']));
  staat.niveausInDb = new Set(data.map((n) => n.id));
}

async function laadBeroepen() {
  const { data, error } = await sb.from('beroepen')
    .select('id,naam,omschrijving,beroep_routes(id,stappen,volgorde)').order('naam');
  if (error) {
    staat.beroepenFout = error;
    staat.beroepen = [];
    return;
  }
  staat.beroepenFout = null;
  staat.beroepen = data.map((b) => ({
    id: b.id,
    naam: b.naam,
    omschrijving: b.omschrijving || '',
    routes: [...b.beroep_routes].sort((x, y) => x.volgorde - y.volgorde).map((r) => ({ id: r.id, stappen: r.stappen })),
  }));
}

// ---------- Hoofdscherm ----------

async function toonBeheer() {
  uitlogKnop.hidden = false;
  inhoud.replaceChildren(h('p', {}, 'Laden...'));
  try {
    await Promise.all([laadScholen(), laadTeksten(), laadBeroepen()]);
  } catch (fout) {
    inhoud.replaceChildren(h('p', {}, foutTekst(fout)));
    return;
  }
  tekenBeheer();
}

function tekenBeheer() {
  const tab = (id, label) => h('button', {
    type: 'button', class: 'tab', role: 'tab', 'aria-selected': String(staat.tab === id),
    onclick: () => { staat.tab = id; tekenBeheer(); },
  }, label);

  inhoud.replaceChildren(
    h('div', { class: 'tabs', role: 'tablist' },
      tab('scholen', 'Scholen'), tab('beroepen', 'Beroepen'), tab('teksten', 'Teksten per niveau')),
    { scholen: tekenScholen, beroepen: tekenBeroepenBeheer, teksten: tekenTeksten }[staat.tab]());
}

// ---------- Scholen ----------

function tekenScholen() {
  const zoek = staat.zoek.trim().toLowerCase();
  const zichtbaar = staat.scholen.filter((s) => !zoek || `${s.naam} ${s.plaats}`.toLowerCase().includes(zoek));

  const zoekveld = h('input', {
    type: 'search', placeholder: 'Zoek op naam of plaats', 'aria-label': 'Zoek op naam of plaats', value: staat.zoek,
    oninput: (e) => {
      staat.zoek = e.target.value;
      const cursor = e.target.selectionStart;
      tekenBeheer();
      const nieuw = inhoud.querySelector('input[type="search"]');
      nieuw.focus();
      nieuw.setSelectionRange(cursor, cursor);
    },
  });

  const rijen = zichtbaar.map((s) => h('tr', {},
    h('td', {}, h('strong', {}, s.naam), s.tweetalig && h('span', { class: 'tag-tweetalig' }, 'tweetalig')),
    h('td', {}, s.plaats),
    h('td', { class: 'niveaus' },
      s.niveaus.length ? volgordeNiveaus(s.niveaus).map((n) => KORT[n]).join(', ') : 'geen niveau gekozen',
      ...s.brugklassen.map((b) => h('div', {}, brugklasLabel(b.niveaus, b.jaren)))),
    h('td', { class: 'actie' }, h('button', { type: 'button', class: 'knop zacht', onclick: () => openFormulier(s) }, 'Bewerken'))));

  return h('section', { class: 'blok-kaart' },
    h('h2', {}, `Scholen in ${REGIO}`),
    h('p', {}, 'Kies bij elke school welke niveaus er worden aangeboden. De kinderen zien dit meteen in het schema.'),
    h('div', { class: 'werkbalk' }, zoekveld,
      h('button', { type: 'button', class: 'knop', onclick: () => openFormulier(null) }, 'Nieuwe school')),
    staat.scholen.length === 0
      ? h('p', {}, 'Er zijn nog geen scholen. Klik op "Nieuwe school" om te beginnen.')
      : h('table', { class: 'tabel' },
        h('thead', {}, h('tr', {}, h('th', {}, 'School'), h('th', {}, 'Plaats'), h('th', {}, 'Niveaus'), h('th', {}))),
        h('tbody', {}, ...rijen)));
}

const NIVEAU_VOLGORDE = ['pro', 'vmbo-bbl', 'vmbo-kbl', 'vmbo-gl', 'vmbo-tl', 'havo', 'vwo', 'gymnasium'];
const volgordeNiveaus = (lijst) => [...lijst].sort((a, b) => NIVEAU_VOLGORDE.indexOf(a) - NIVEAU_VOLGORDE.indexOf(b));

function sluit(dialoog) {
  dialoog.close();
  dialoog.remove();
}

// Keuzevakje voor tweetalig onderwijs (tto).
function tweetaligVeld(school) {
  if (!staat.heeftTweetalig) {
    return [h('p', { class: 'hint' }, 'De keuze "Tweetalig onderwijs" is er nog niet: voer supabase/schema.sql opnieuw uit in Supabase.')];
  }
  return [h('label', { class: 'vink', style: 'margin-top:14px' },
    h('input', { type: 'checkbox', id: 'f-tweetalig', checked: Boolean(school?.tweetalig) }),
    'Deze school biedt tweetalig onderwijs (tto) aan')];
}

// Vrij tekstveld voor extra informatie, bijvoorbeeld welke klassen een school heeft.
function informatieVeld(school) {
  if (!staat.heeftInformatie) {
    return [h('p', { class: 'hint' }, 'Het veld "Meer informatie" is er nog niet: voer supabase/schema.sql opnieuw uit in Supabase.')];
  }
  const tekst = h('textarea', {
    id: 'f-informatie', rows: 5,
    placeholder: 'Bijvoorbeeld: welke klassen de school heeft, open dag, bijzonderheden...',
  });
  tekst.value = school?.informatie || '';
  return [h('label', { for: 'f-informatie' }, 'Meer informatie (niet verplicht)'), tekst];
}

// Invoer van brugklassen: per brugklas kies je de niveaus (knoppen) en hoe lang de brede brugklas duurt.
const bkKort = (id) => NIVEAU_INFO[id].kort.replace('vmbo ', '');

function brugklassenEditor(school, dialoog) {
  const rijen = (school?.brugklassen || []).map((b) => ({ niveaus: [...b.niveaus], jaren: b.jaren }));
  const lijst = h('div', { class: 'brugklassen-editor' });

  // Een niveau in een brugklas betekent dat de school dat niveau aanbiedt: vink het bovenaan alvast aan.
  const vinkNiveauAan = (id) => {
    const vak = dialoog.querySelector(`input[name="niveau"][value="${id}"]`);
    if (vak) vak.checked = true;
  };

  // Knop die in één klik een brugklas met deze niveaus toevoegt.
  const snelKnop = (niveaus) => h('button', {
    type: 'button', class: 'knop zacht klein',
    onclick: () => { rijen.push({ niveaus: [...niveaus], jaren: 2 }); niveaus.forEach(vinkNiveauAan); teken(); },
  }, niveaus.map(bkKort).join('/'));

  function teken(focus) {
    lijst.replaceChildren(
      ...rijen.map((rij, i) => h('div', { class: 'brugklas-rij' },
        h('div', { class: 'keuze-chips', role: 'group', 'aria-label': `Brugklas ${i + 1}: niveaus` },
          ...BRUGKLAS_NIVEAUS.filter(beschikbaar).map((id) => h('button', {
            type: 'button', class: 'keuze-chip', 'data-id': id, 'aria-pressed': String(rij.niveaus.includes(id)),
            onclick: () => {
              const erin = rij.niveaus.includes(id);
              rij.niveaus = erin ? rij.niveaus.filter((n) => n !== id) : [...rij.niveaus, id];
              if (!erin) vinkNiveauAan(id);
              teken({ i, id });
            },
          }, bkKort(id)))),
        rij.niveaus.length > 1 && h('label', { class: 'jaren' }, 'Duur',
          h('select', { onchange: (e) => { rij.jaren = Number(e.target.value); } },
            ...[...new Set([1, 2, 3, rij.jaren])].sort().map((j) =>
              h('option', { value: String(j), selected: rij.jaren === j }, `${j} jaar`)))),
        h('button', {
          type: 'button', class: 'knop gevaar klein',
          'aria-label': `Verwijder brugklas ${i + 1}`,
          onclick: () => { rijen.splice(i, 1); teken(); },
        }, 'Verwijderen'))),
      ...(rijen.length === 0 ? [h('p', { class: 'hint' }, 'Nog geen brugklassen ingevoerd.')] : []),
      h('div', { class: 'voorbeelden' },
        h('span', { class: 'hint' }, 'Eén niveau:'),
        ...BRUGKLAS_NIVEAUS.filter(beschikbaar).map((id) => snelKnop([id]))),
      h('div', { class: 'voorbeelden' },
        h('span', { class: 'hint' }, 'Combinatie:'),
        ...BRUGKLAS_VOORBEELDEN.filter((niveaus) => niveaus.every(beschikbaar)).map(snelKnop),
        h('button', {
          type: 'button', class: 'knop zacht klein',
          onclick: () => { rijen.push({ niveaus: [], jaren: 2 }); teken(); },
        }, 'Eigen combinatie')));

    if (focus) lijst.querySelectorAll('.brugklas-rij')[focus.i]?.querySelector(`[data-id="${focus.id}"]`)?.focus();
  }

  teken();
  return { element: lijst, waarden: () => rijen };
}

function openFormulier(school) {
  const bestaand = new Set(school?.niveaus || []);
  const dialoog = h('dialog', { 'aria-labelledby': 'dialoog-titel' });

  const veld = (id, label, waarde, type = 'text', eisen = {}) => [
    h('label', { for: id }, label),
    h('input', { type, id, value: waarde || '', ...eisen }),
  ];

  const vink = (id, label, sub = false) => h('label', { class: `vink${sub ? ' sub' : ''}` },
    h('input', { type: 'checkbox', name: 'niveau', value: id, checked: bestaand.has(id) }), label);

  const niveauVelden = KEUZES.filter((k) => k.groep || beschikbaar(k.id)).map((k) => k.groep
    ? [
      h('label', { class: 'vink' },
        h('input', {
          type: 'checkbox', 'aria-label': 'Alle vmbo-leerwegen',
          onchange: (e) => dialoog.querySelectorAll('input[name="niveau"][value^="vmbo-"]').forEach((c) => { c.checked = e.target.checked; }),
        }), h('strong', {}, 'Vmbo (alle leerwegen)')),
      ...k.leden.map((lid) => vink(lid.id, lid.label, true)),
    ]
    : vink(k.id, k.label));

  const brugklassen = staat.heeftBrugklassen ? brugklassenEditor(school, dialoog) : null;
  const opslaan = h('button', { type: 'submit', class: 'knop' }, 'Opslaan');

  const formulier = h('form', {
    method: 'dialog',
    onsubmit: async (e) => {
      e.preventDefault();
      const naam = formulier.querySelector('#f-naam').value.trim();
      const plaats = formulier.querySelector('#f-plaats').value.trim();
      const adres = formulier.querySelector('#f-adres').value.trim();
      const websiteInvoer = formulier.querySelector('#f-website').value.trim();
      const website = websiteInvoer ? veiligeUrl(websiteInvoer) : '';
      if (websiteInvoer && !website) { melding('Dit websiteadres klopt niet.', true); return; }
      const gekozen = [...formulier.querySelectorAll('input[name="niveau"]:checked')].map((c) => c.value);

      const informatie = formulier.querySelector('#f-informatie')?.value.trim();
      const waarden = { naam, plaats, adres: adres || null, website: website || null };
      if (staat.heeftInformatie) waarden.informatie = informatie || null;
      if (staat.heeftTweetalig) waarden.tweetalig = formulier.querySelector('#f-tweetalig').checked;

      let brugklasRijen;
      if (brugklassen) {
        brugklasRijen = brugklassen.waarden();
        if (brugklasRijen.some((r) => r.niveaus.length === 0)) {
          melding('Kies bij elke brugklas minstens één niveau, of verwijder de brugklas.', true);
          return;
        }
      }

      opslaan.disabled = true;
      try {
        await bewaarSchool(school, waarden, gekozen, brugklasRijen);
        sluit(dialoog);
        melding(school ? 'School opgeslagen.' : 'School toegevoegd.');
        await laadScholen();
        tekenBeheer();
      } catch (fout) {
        melding(foutTekst(fout), true);
      } finally {
        opslaan.disabled = false;
      }
    },
  },
  h('h2', { id: 'dialoog-titel' }, school ? 'School bewerken' : 'Nieuwe school'),
  ...veld('f-naam', 'Naam van de school', school?.naam, 'text', { required: true }),
  ...veld('f-plaats', 'Plaats', school?.plaats, 'text', { required: true }),
  ...veld('f-adres', 'Adres (niet verplicht)', school?.adres),
  ...veld('f-website', 'Website (niet verplicht)', school?.website, 'text', { placeholder: 'www.voorbeeld.nl' }),
  h('fieldset', {}, h('legend', {}, 'Dit niveau wordt aangeboden'), ...niveauVelden.flat(),
    ...(beschikbaar('gymnasium') ? [] : [h('p', { class: 'hint' }, 'Gymnasium kun je kiezen nadat je supabase/schema.sql opnieuw hebt uitgevoerd.')])),
  brugklassen
    ? h('fieldset', {},
      h('legend', {}, 'Brugklassen'),
      h('p', { class: 'hint' }, 'Een brede brugklas combineert niveaus. Kies per brugklas de niveaus en hoe lang hij duurt.'),
      brugklassen.element)
    : h('p', { class: 'hint' }, 'Brugklassen invoeren kan nog niet: voer supabase/schema.sql opnieuw uit in Supabase.'),
  ...tweetaligVeld(school),
  ...informatieVeld(school),
  h('div', { class: 'rij' },
    opslaan,
    h('button', { type: 'button', class: 'knop zacht', onclick: () => sluit(dialoog) }, 'Annuleren'),
    school && h('button', {
      type: 'button', class: 'knop gevaar rechts',
      onclick: async () => {
        if (!confirm(`"${school.naam}" definitief verwijderen?`)) return;
        const { error } = await sb.from('scholen').delete().eq('id', school.id);
        if (error) { melding(foutTekst(error), true); return; }
        sluit(dialoog);
        melding('School verwijderd.');
        await laadScholen();
        tekenBeheer();
      },
    }, 'Verwijderen')));

  dialoog.append(formulier);
  dialoog.addEventListener('close', () => dialoog.remove());
  document.body.append(dialoog);
  dialoog.showModal();
}

async function bewaarSchool(school, waarden, gekozen, brugklasRijen) {
  let id = school?.id;
  if (id) {
    const { error } = await sb.from('scholen').update(waarden).eq('id', id);
    if (error) throw error;
  } else {
    const { data, error } = await sb.from('scholen').insert(waarden).select('id').single();
    if (error) throw error;
    id = data.id;
  }

  const oud = new Set(school?.niveaus || []);
  const nieuw = new Set(gekozen);
  const weg = [...oud].filter((n) => !nieuw.has(n));
  const erbij = [...nieuw].filter((n) => !oud.has(n));

  if (weg.length) {
    const { error } = await sb.from('school_niveaus').delete().eq('school_id', id).in('niveau_id', weg);
    if (error) throw error;
  }
  if (erbij.length) {
    const { error } = await sb.from('school_niveaus').insert(erbij.map((niveau_id) => ({ school_id: id, niveau_id })));
    if (error) throw error;
  }

  // Brugklassen: eerst de nieuwe opslaan, dan pas de oude weghalen, zodat er niets verloren gaat als er iets misgaat.
  if (brugklasRijen) {
    if (brugklasRijen.length) {
      const rijen = brugklasRijen.map((r, i) => ({
        school_id: id,
        niveaus: [...r.niveaus].sort((a, b) => BRUGKLAS_NIVEAUS.indexOf(a) - BRUGKLAS_NIVEAUS.indexOf(b)),
        jaren: r.niveaus.length > 1 ? r.jaren : 1,
        volgorde: i + 1,
      }));
      const { error } = await sb.from('school_brugklassen').insert(rijen);
      if (error) throw error;
    }
    const oudeIds = (school?.brugklassen || []).map((b) => b.id);
    if (oudeIds.length) {
      const { error } = await sb.from('school_brugklassen').delete().in('id', oudeIds);
      if (error) throw error;
    }
  }
}

// ---------- Beroepen en routes ----------

const stapNaam = (id) => NIVEAU_INFO[id]?.kort || id;
const routeTekst = (stappen) => ['basisschool', ...stappen].map(stapNaam).join(' → ');

function tekenBeroepenBeheer() {
  if (staat.beroepenFout) {
    return h('section', { class: 'blok-kaart' },
      h('h2', {}, 'Beroepen'),
      h('p', {}, 'De tabellen voor beroepen bestaan nog niet. Plak ', h('code', {}, 'supabase/stap2-beroepen.sql'),
        ' in de Supabase SQL Editor en klik op Run. Ververs daarna deze pagina.'));
  }

  const rijen = staat.beroepen.map((b) => h('tr', {},
    h('td', {}, h('strong', {}, b.naam)),
    h('td', { class: 'niveaus' }, b.routes.length
      ? b.routes.map((r) => h('div', {}, routeTekst(r.stappen)))
      : 'nog geen routes'),
    h('td', { class: 'actie' }, h('button', { type: 'button', class: 'knop zacht', onclick: () => openBeroepFormulier(b) }, 'Bewerken'))));

  return h('section', { class: 'blok-kaart' },
    h('h2', {}, 'Beroepen en routes'),
    h('p', {}, 'Kinderen kiezen een beroep en zien in het schema welke wegen er naartoe leiden. Een beroep kan meerdere routes hebben.'),
    h('div', { class: 'werkbalk' },
      h('button', { type: 'button', class: 'knop', onclick: () => openBeroepFormulier(null) }, 'Nieuw beroep')),
    staat.beroepen.length === 0
      ? h('p', {}, 'Er zijn nog geen beroepen.')
      : h('table', { class: 'tabel' },
        h('thead', {}, h('tr', {}, h('th', {}, 'Beroep'), h('th', {}, 'Routes'), h('th', {}))),
        h('tbody', {}, ...rijen)));
}

function openBeroepFormulier(beroep) {
  const routes = (beroep?.routes || []).map((r) => [...r.stappen]);
  const dialoog = h('dialog', { 'aria-labelledby': 'dialoog-titel' });
  const routesEl = h('div', { class: 'routes-editor' });

  function tekenRoutes() {
    routesEl.replaceChildren(
      ...routes.map((stappen, i) => {
        const opties = stappen.length === 0 ? START_OPTIES : volgendeStappen(stappen[stappen.length - 1]);
        const volgende = opties.length > 0 && h('select', {
          'aria-label': `Route ${i + 1}: volgende stap`,
          onchange: (e) => {
            if (!e.target.value) return;
            stappen.push(e.target.value);
            tekenRoutes();
            routesEl.querySelectorAll('select')[i]?.focus();
          },
        },
        h('option', { value: '' }, stappen.length === 0 ? '+ Eerste stap na de basisschool' : '+ Volgende stap'),
        ...opties.map((o) => h('option', { value: o }, NIVEAU_INFO[o].naam)));

        return h('div', { class: 'route-editor' },
          h('strong', {}, `Route ${i + 1}`),
          h('div', { class: 'keten' },
            h('span', { class: 'keten-stap vast' }, 'basisschool'),
            ...stappen.flatMap((stap) => [
              h('span', { class: 'pijltje', 'aria-hidden': 'true' }, '→'),
              h('span', { class: 'keten-stap', style: `--kleur: ${NIVEAU_INFO[stap].kleur}` }, stapNaam(stap)),
            ]),
            volgende),
          h('div', { class: 'rij', style: 'margin-top:6px' },
            stappen.length > 0 && h('button', {
              type: 'button', class: 'knop zacht klein',
              onclick: () => { stappen.pop(); tekenRoutes(); },
            }, 'Laatste stap weg'),
            h('button', {
              type: 'button', class: 'knop gevaar klein',
              onclick: () => { routes.splice(i, 1); tekenRoutes(); },
            }, 'Route verwijderen')));
      }),
      ...(routes.length === 0 ? [h('p', { class: 'hint' }, 'Nog geen routes. Voeg er een toe.')] : []),
      h('button', {
        type: 'button', class: 'knop zacht',
        onclick: () => { routes.push([]); tekenRoutes(); routesEl.querySelectorAll('select')[routes.length - 1]?.focus(); },
      }, 'Route toevoegen'));
  }

  const naam = h('input', { type: 'text', id: 'b-naam', required: true, value: beroep?.naam || '' });
  const omschrijving = h('textarea', { id: 'b-omschrijving', rows: 3 });
  omschrijving.value = beroep?.omschrijving || '';
  const opslaan = h('button', { type: 'submit', class: 'knop' }, 'Opslaan');

  const formulier = h('form', {
    method: 'dialog',
    onsubmit: async (e) => {
      e.preventDefault();
      if (routes.some((r) => r.length === 0)) { melding('Elke route heeft minstens één stap nodig.', true); return; }
      opslaan.disabled = true;
      try {
        await bewaarBeroep(beroep, { naam: naam.value.trim(), omschrijving: omschrijving.value.trim() || null }, routes);
        sluit(dialoog);
        melding(beroep ? 'Beroep opgeslagen.' : 'Beroep toegevoegd.');
        await laadBeroepen();
        tekenBeheer();
      } catch (fout) {
        melding(foutTekst(fout), true);
      } finally {
        opslaan.disabled = false;
      }
    },
  },
  h('h2', { id: 'dialoog-titel' }, beroep ? 'Beroep bewerken' : 'Nieuw beroep'),
  h('label', { for: 'b-naam' }, 'Naam van het beroep'), naam,
  h('label', { for: 'b-omschrijving' }, 'Korte uitleg voor de kinderen (niet verplicht)'), omschrijving,
  h('fieldset', {}, h('legend', {}, 'Routes na de basisschool'), routesEl),
  h('div', { class: 'rij' },
    opslaan,
    h('button', { type: 'button', class: 'knop zacht', onclick: () => sluit(dialoog) }, 'Annuleren'),
    beroep && h('button', {
      type: 'button', class: 'knop gevaar rechts',
      onclick: async () => {
        if (!confirm(`"${beroep.naam}" definitief verwijderen?`)) return;
        const { error } = await sb.from('beroepen').delete().eq('id', beroep.id);
        if (error) { melding(foutTekst(error), true); return; }
        sluit(dialoog);
        melding('Beroep verwijderd.');
        await laadBeroepen();
        tekenBeheer();
      },
    }, 'Verwijderen')));

  tekenRoutes();
  dialoog.append(formulier);
  dialoog.addEventListener('close', () => dialoog.remove());
  document.body.append(dialoog);
  dialoog.showModal();
}

async function bewaarBeroep(beroep, waarden, routes) {
  let id = beroep?.id;
  if (id) {
    const { error } = await sb.from('beroepen').update(waarden).eq('id', id);
    if (error) throw error;
  } else {
    const { data, error } = await sb.from('beroepen').insert(waarden).select('id').single();
    if (error) throw error;
    id = data.id;
  }

  // Eerst de nieuwe routes opslaan, dan pas de oude weghalen: zo gaat er niets verloren als er iets misgaat.
  if (routes.length) {
    const { error } = await sb.from('beroep_routes')
      .insert(routes.map((stappen, i) => ({ beroep_id: id, stappen, volgorde: i + 1 })));
    if (error) throw error;
  }
  if (beroep?.routes.length) {
    const { error } = await sb.from('beroep_routes').delete().in('id', beroep.routes.map((r) => r.id));
    if (error) throw error;
  }
}

// ---------- Teksten ----------

function tekenTeksten() {
  const items = Object.keys(NIVEAU_INFO).map((id) => {
    const standaard = STANDAARD_OMSCHRIJVING[id] || '';
    const veld = h('textarea', { id: `t-${id}`, rows: 3 });
    veld.value = staat.teksten[id] || standaard;

    const sla = async (nieuweTekst) => {
      const tekst = nieuweTekst.trim();
      const waarde = !tekst || tekst === standaard ? null : tekst;
      const { data, error } = await sb.from('niveaus').update({ omschrijving: waarde }).eq('id', id).select('id');
      if (error) { melding(foutTekst(error), true); return; }
      if (!data.length) { melding('Dit niveau staat niet in de database. Voer schema.sql opnieuw uit.', true); return; }
      staat.teksten[id] = waarde || '';
      veld.value = waarde || standaard;
      melding('Tekst opgeslagen.');
    };

    return h('div', { class: 'tekst-item' },
      h('h3', {}, h('label', { for: `t-${id}`, style: 'margin:0' }, NIVEAU_INFO[id].naam)),
      veld,
      h('div', { class: 'rij', style: 'margin-top:8px' },
        h('button', { type: 'button', class: 'knop', onclick: () => sla(veld.value) }, 'Opslaan'),
        h('button', { type: 'button', class: 'knop zacht', onclick: () => sla('') }, 'Standaardtekst terugzetten')));
  });

  return h('section', { class: 'blok-kaart' },
    h('h2', {}, 'Teksten per niveau'),
    h('p', {}, 'Dit is de uitleg die de kinderen zien als ze op een blok klikken. Pas aan wat je anders zou zeggen.'),
    ...items);
}

// ---------- Start ----------

uitlogKnop.addEventListener('click', async () => {
  await sb.auth.signOut();
});

if (!sb) {
  toonNietGekoppeld();
} else {
  sb.auth.onAuthStateChange((gebeurtenis, sessie) => {
    if (!['INITIAL_SESSION', 'SIGNED_IN', 'SIGNED_OUT'].includes(gebeurtenis)) return;
    if (Boolean(sessie) === staat.ingelogd) return; // niets veranderd (bijv. INITIAL_SESSION gevolgd door SIGNED_IN)
    staat.ingelogd = Boolean(sessie);
    // Niet in de callback zelf awaiten: Supabase raadt dat af.
    setTimeout(() => (sessie ? toonBeheer() : toonInloggen()), 0);
  });
}

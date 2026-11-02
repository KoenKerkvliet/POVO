// Het doorstroomschema voor de klas.
import { REGIO } from './config.js';
import { laadGegevens } from './data.js';
import { h, svg, veiligeUrl } from './dom.js';
import {
  BLOKKEN, VMBO, MBO, LEERWEGEN, MBO_NIVEAUS, PIJLEN, GROEPEN,
  JAAR_PX, GROND_Y, NIVEAU_INFO, STANDAARD_OMSCHRIJVING, MET_SCHOLEN, brugklasDelen, SCHOOL_NIVEAU_VOLGORDE,
  leerwegGeometrie, mboGeometrie, hoekVan, SCHEMA_VIEWBOX,
} from './schema-data.js';

const schemaEl = document.querySelector('#schema');
const paneelEl = document.querySelector('#paneel');
const beroepKeuzeEl = document.querySelector('#beroep-keuze');
const beroepSelectEl = document.querySelector('#beroep-select');
const infoKnopEl = document.querySelector('#info-knop');
const infoEl = document.querySelector('#info');

// Welke scholen uitgeklapt zijn, onthouden we in de browser (standaard is alles ingeklapt).
const OPEN_SLEUTEL = 'povo-open-scholen';

function laadOpenScholen() {
  try {
    const lijst = JSON.parse(localStorage.getItem(OPEN_SLEUTEL) || '[]');
    return new Set(Array.isArray(lijst) ? lijst : []);
  } catch {
    return new Set();
  }
}

function bewaarOpenScholen() {
  try {
    localStorage.setItem(OPEN_SLEUTEL, JSON.stringify([...staat.openScholen]));
  } catch {
    // opslag niet beschikbaar (bijv. privévenster): de stand geldt dan alleen tot je de pagina ververst
  }
}

// Of de hele sectie 'Scholen' uitgeklapt is (standaard dicht, zodat de kaart de aandacht krijgt).
const SECTIE_SLEUTEL = 'povo-scholen-sectie-open';

function laadScholenSectieOpen() {
  try {
    return localStorage.getItem(SECTIE_SLEUTEL) === '1';
  } catch {
    return false;
  }
}

function zetScholenSectieOpen(open) {
  if (open === staat.scholenOpen) return;
  staat.scholenOpen = open;
  try {
    localStorage.setItem(SECTIE_SLEUTEL, open ? '1' : '0');
  } catch {
    // opslag niet beschikbaar: de stand geldt dan alleen tot je de pagina ververst
  }
}

function zetSchoolOpen(id, open) {
  if (open === staat.openScholen.has(id)) return;
  if (open) staat.openScholen.add(id);
  else staat.openScholen.delete(id);
  bewaarOpenScholen();
}

const staat = {
  gekozen: null, plaats: null, scholen: [], omschrijvingen: {}, demo: false,
  beroepen: [], beroep: null, route: 0, alleenTweetalig: false, openScholen: laadOpenScholen(), scholenOpen: laadScholenSectieOpen(),
};

// ---------- Hulpfuncties ----------

const leden = (id) => GROEPEN[id] || [id];

function pijlenVan(id) {
  const set = new Set(leden(id));
  return PIJLEN.filter((p) => set.has(p.van));
}

function hierna(id) {
  const eigen = new Set(leden(id));
  const doelen = [];
  for (const p of pijlenVan(id)) {
    if (!eigen.has(p.naar) && !doelen.includes(p.naar)) doelen.push(p.naar);
  }
  return doelen;
}

function scholenVoor(id) {
  const set = new Set(leden(id));
  return staat.scholen.filter((s) => s.niveaus.some((n) => set.has(n)));
}

const huidigBeroep = () => staat.beroepen.find((b) => b.id === staat.beroep) || null;

// De gekozen route als lijst van onderdelen (na de basisschool).
function huidigeRoute() {
  const beroep = huidigBeroep();
  const route = beroep?.routes[staat.route];
  return route ? route.stappen : null;
}

const omschrijving = (id) => staat.omschrijvingen[id] || STANDAARD_OMSCHRIJVING[id] || '';

// ---------- Schema tekenen ----------

function tekenTekst(regels, cx) {
  return regels.map(([tekst, y, grootte, vet]) =>
    svg('text', { x: cx, y, 'font-size': grootte, 'font-weight': vet ? 800 : 600, 'text-anchor': 'middle' }, tekst));
}

function maakBlok(def, extra = []) {
  const { id, kleur, x, y, w, h: hoogte } = def;
  return svg('g', {
    class: 'blok', 'data-id': id, tabindex: 0, role: 'button', 'aria-pressed': 'false',
    'aria-label': NIVEAU_INFO[id].naam,
  },
  def.verlenging && svg('rect', {
    class: 'verlenging', x: x + 2, y: def.verlenging.y + 2, width: w - 4, height: def.verlenging.h + 2,
    rx: 14, stroke: kleur,
  }),
  svg('rect', { class: 'vorm', x, y, width: w, height: hoogte, rx: 14, fill: kleur }),
  ...tekenTekst(def.tekst, x + w / 2),
  ...extra);
}

function tekenSchema() {
  schemaEl.setAttribute('viewBox', SCHEMA_VIEWBOX);
  const defs = svg('defs', {},
    ...[['kop-grijs', '#94a3b8'], ['kop-donker', '#0f172a'], ['kop-route', '#b45309']].map(([id, kleur]) =>
      svg('marker', {
        id, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 16, markerHeight: 16,
        markerUnits: 'userSpaceOnUse', orient: 'auto',
      }, svg('path', { d: 'M0,0 L10,5 L0,10 z', fill: kleur }))));

  // Tijdlijn aan de zijkant: elk jaar een streepje, met stippellijnen door het schema.
  const tijdlijn = svg('g', { class: 'tijdlijn', 'aria-hidden': 'true' },
    svg('line', { class: 'as', x1: 78, x2: 78, y1: GROND_Y, y2: GROND_Y - 6 * JAAR_PX }),
    ...[0, 1, 2, 3, 4, 5, 6].flatMap((jaar) => {
      const y = GROND_Y - jaar * JAAR_PX;
      return [
        jaar > 0 && svg('line', { class: 'hulplijn', x1: 78, x2: 1200, y1: y, y2: y }),
        svg('line', { class: 'streep', x1: 72, x2: 84, y1: y, y2: y }),
        svg('text', { class: 'jaar', x: 66, y: y + 5, 'text-anchor': 'end' }, jaar === 0 ? 'start' : `${jaar} jaar`),
      ];
    }),
    svg('text', { class: 'titel', transform: `translate(16 ${GROND_Y - 3 * JAAR_PX}) rotate(-90)`, 'text-anchor': 'middle' },
      'Leertijd in jaren'));

  const pijlen = svg('g', { class: 'pijlen', 'aria-hidden': 'true' },
    ...PIJLEN.map((p, i) => svg('path', { class: 'pijl', 'data-van': p.van, 'data-naar': p.naar, 'data-index': i, d: p.d })));

  // vmbo met vier leerwegen
  const leerwegen = LEERWEGEN.map((lw, i) => {
    const g = leerwegGeometrie(i);
    return svg('g', {
      class: 'blok cel', 'data-id': lw.id, tabindex: 0, role: 'button', 'aria-pressed': 'false',
      'aria-label': NIVEAU_INFO[lw.id].naam,
    },
    svg('rect', { class: 'vorm', x: g.x, y: g.y, width: g.w, height: g.h, rx: 10 }),
    svg('text', { x: g.x + g.w / 2, y: g.y + 34, 'font-size': 26, 'font-weight': 800, 'text-anchor': 'middle' }, lw.kort),
    ...lw.regels.map((regel, r) =>
      svg('text', { x: g.x + g.w / 2, y: g.y + 66 + r * 19, 'font-size': 14, 'font-weight': 600, 'text-anchor': 'middle' }, regel)));
  });
  const vmbo = maakBlok(VMBO, leerwegen);

  // mbo-balk met vier niveaus
  const mboNiveaus = MBO_NIVEAUS.map((n, i) => {
    const g = mboGeometrie(i);
    return svg('g', {
      class: 'blok cel', 'data-id': n.id, tabindex: 0, role: 'button', 'aria-pressed': 'false',
      'aria-label': NIVEAU_INFO[n.id].naam,
    },
    svg('rect', { class: 'vorm', x: g.x, y: g.y, width: g.w, height: g.h, rx: 10 }),
    svg('text', { x: g.x + g.w / 2, y: g.y + 38, 'font-size': 18, 'font-weight': 800, 'text-anchor': 'middle' }, `niveau ${n.nummer}`),
    svg('text', { x: g.x + g.w / 2, y: g.y + 62, 'font-size': 14, 'font-weight': 600, 'text-anchor': 'middle' }, n.duur));
  });
  const mbo = maakBlok(MBO, mboNiveaus);

  schemaEl.replaceChildren(defs, tijdlijn, pijlen, ...BLOKKEN.map((b) => maakBlok(b)), vmbo, mbo,
    svg('g', { class: 'stapnummers', 'aria-hidden': 'true' }));
}

// ---------- Selecteren ----------

function kies(id) {
  staat.gekozen = staat.gekozen === id ? null : id;
  staat.plaats = null;
  werkSchemaBij();
  tekenPaneel();
}

function werkSchemaBij() {
  const id = staat.gekozen;
  const actiefeBlokken = new Set(id ? [id] : []);
  schemaEl.classList.toggle('heeft-keuze', Boolean(id));

  schemaEl.querySelectorAll('.blok').forEach((blok) => {
    const actief = actiefeBlokken.has(blok.dataset.id);
    blok.classList.toggle('actief', actief);
    blok.setAttribute('aria-pressed', String(actief));
  });

  const vanSet = new Set(id ? leden(id) : []);
  schemaEl.querySelectorAll('.pijl').forEach((pijl) => {
    pijl.classList.toggle('actief', vanSet.has(pijl.dataset.van));
  });

  tekenRoute();
}

// Markeer de gekozen route: blokken, pijlen en stapnummers.
function tekenRoute() {
  const route = huidigeRoute();
  const opRoute = new Set(route || []);
  const paren = new Set((route || []).slice(1).map((stap, i) => `${route[i]}>${stap}`));
  schemaEl.classList.toggle('heeft-route', Boolean(route));

  schemaEl.querySelectorAll('.blok').forEach((blok) => {
    const bid = blok.dataset.id;
    const bevatRoute = (GROEPEN[bid] || []).some((lid) => opRoute.has(lid));
    blok.classList.toggle('op-route', opRoute.has(bid));
    blok.classList.toggle('gedimd', Boolean(route) && !opRoute.has(bid) && !bevatRoute && bid !== 'basisschool');
  });
  schemaEl.querySelectorAll('.pijl').forEach((pijl) => {
    pijl.classList.toggle('route', paren.has(`${pijl.dataset.van}>${pijl.dataset.naar}`));
  });

  const nummers = (route || []).map((bid, i) => {
    const hoek = hoekVan(bid);
    return hoek && svg('g', { class: 'stapnummer', transform: `translate(${hoek.x} ${hoek.y})` },
      svg('circle', { r: 15 }),
      svg('text', { y: 6, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 800 }, String(i + 1)));
  });
  schemaEl.querySelector('.stapnummers').replaceChildren(...nummers.filter(Boolean));
}

// ---------- Paneel bovenin ----------

function tekenInfo(id) {
  const info = NIVEAU_INFO[id];
  const doelen = hierna(id);
  return h('div', { class: 'info', style: `--kleur: ${info.kleur}` },
    h('div', { class: 'kop-rij' },
      h('h2', {}, info.naam, info.duur && h('span', { class: 'duur' }, info.duur)),
      h('button', { type: 'button', class: 'sluit', 'aria-label': `Sluit ${info.kort}`, onclick: () => kies(id) }, '×')),
    h('p', {}, omschrijving(id)),
    doelen.length > 0 && h('div', { class: 'hierna' },
      h('span', { class: 'hierna-label' }, 'Hierna kun je naar:'),
      ...doelen.map((doel) =>
        h('button', { type: 'button', class: 'chip', style: `--kleur: ${NIVEAU_INFO[doel].kleur}`, onclick: () => kies(doel) },
          NIVEAU_INFO[doel].kort))));
}

function tekenScholen(id) {
  const alle = scholenVoor(id);
  const plaatsen = [...new Set(alle.map((s) => s.plaats))].sort((a, b) => a.localeCompare(b, 'nl'));
  const heeftTweetalig = alle.some((s) => s.tweetalig);
  const filterTweetalig = staat.alleenTweetalig && heeftTweetalig;
  const getoond = alle.filter((s) => (!staat.plaats || s.plaats === staat.plaats) && (!filterTweetalig || s.tweetalig));
  const relevant = new Set(leden(id)); // het aangeklikte niveau komt in de kaart extra naar voren

  const kaarten = getoond.map((s) => {
    const url = veiligeUrl(s.website);
    const brugklassen = s.brugklassen || [];
    const niveaus = SCHOOL_NIVEAU_VOLGORDE.filter((n) => s.niveaus.includes(n));
    return h('li', { class: 'school' },
      h('details', {
        class: 'school-details',
        open: staat.openScholen.has(s.id),
        ontoggle: (e) => zetSchoolOpen(s.id, e.target.open),
      },
      h('summary', {},
        h('strong', {}, s.naam),
        s.tweetalig && h('span', { class: 'tag-tweetalig' }, 'Tweetalig'),
        h('span', { class: 'plaats' }, s.plaats)),
      h('div', { class: 'school-body' },
        s.adres && h('span', { class: 'adres' }, s.adres),
        brugklassen.length > 0 && h('div', { class: 'sectie' },
          h('h4', { class: 'sectie-titel' }, 'Brugklas'),
          h('ul', { class: 'brugklassen' },
            ...brugklassen.map((b) => {
              const { combinatie, duur } = brugklasDelen(b.niveaus, b.jaren);
              return h('li', { class: b.niveaus.some((n) => relevant.has(n)) ? 'bk bk-hier' : 'bk' },
                h('span', { class: 'bk-naam' }, combinatie),
                duur && h('span', { class: 'bk-duur' }, duur));
            }))),
        niveaus.length > 0 && h('div', { class: 'sectie' },
          h('h4', { class: 'sectie-titel' }, 'Niveaus'),
          h('ul', { class: 'niveau-chips' },
            ...niveaus.map((n) => h('li', {
              class: relevant.has(n) ? 'niveau-chip hier' : 'niveau-chip',
              style: `--kleur: ${NIVEAU_INFO[n].kleur}`,
            }, NIVEAU_INFO[n].kort)))),
        s.informatie && h('details', { class: 'meer' },
          h('summary', {}, 'Meer informatie'),
          h('p', { class: 'meer-tekst' }, s.informatie)),
        url && h('a', { href: url, target: '_blank', rel: 'noopener noreferrer' }, 'Website'))));
  });

  // Alles in één keer uit- of inklappen.
  const allesOpen = getoond.length > 0 && getoond.every((sch) => staat.openScholen.has(sch.id));

  return h('div', { class: 'scholen' },
    h('details', {
      class: 'scholen-sectie',
      open: staat.scholenOpen,
      ontoggle: (e) => zetScholenSectieOpen(e.target.open),
    },
    h('summary', {},
      h('h3', {}, `Scholen in ${REGIO}`),
      h('span', { class: 'aantal' }, String(getoond.length))),
    h('div', { class: 'scholen-kop' },
      plaatsen.length > 1 && h('div', { class: 'plaatsen', role: 'group', 'aria-label': 'Filter op plaats' },
        h('button', {
          type: 'button', class: 'filter', 'aria-pressed': String(!staat.plaats),
          onclick: () => { staat.plaats = null; tekenPaneel(); },
        }, 'Alle plaatsen'),
        ...plaatsen.map((p) =>
          h('button', {
            type: 'button', class: 'filter', 'aria-pressed': String(staat.plaats === p),
            onclick: () => { staat.plaats = staat.plaats === p ? null : p; tekenPaneel(); },
          }, p))),
      heeftTweetalig && h('button', {
        type: 'button', class: 'filter filter-tweetalig', 'aria-pressed': String(filterTweetalig),
        onclick: () => { staat.alleenTweetalig = !staat.alleenTweetalig; tekenPaneel(); },
      }, 'Tweetalig'),
      getoond.length > 1 && h('button', {
        type: 'button', class: 'alles-knop',
        onclick: () => {
          getoond.forEach((sch) => (allesOpen ? staat.openScholen.delete(sch.id) : staat.openScholen.add(sch.id)));
          bewaarOpenScholen();
          tekenPaneel();
        },
      }, allesOpen ? 'Alles inklappen' : 'Alles uitklappen')),
    getoond.length > 0
      ? h('ul', { class: 'school-lijst' }, ...kaarten)
      : h('p', { class: 'leeg' }, 'Hier zijn nog geen scholen ingevoerd.')));
}

// ---------- Beroepen ----------

function kiesBeroep(id) {
  staat.beroep = id || null;
  staat.route = 0;
  beroepSelectEl.value = staat.beroep || '';
  werkSchemaBij();
  tekenPaneel();
}

// Klik op een stap in een route: toon die route in het schema en de uitleg + scholen van die stap.
function kiesStap(routeIndex, id) {
  staat.route = routeIndex;
  staat.gekozen = id;
  staat.plaats = null;
  werkSchemaBij();
  tekenPaneel();
}

function vulBeroepKeuze() {
  beroepKeuzeEl.hidden = staat.beroepen.length === 0;
  beroepSelectEl.replaceChildren(
    h('option', { value: '' }, 'Kies een beroep...'),
    ...staat.beroepen.map((b) => h('option', { value: b.id }, b.naam)));
  beroepSelectEl.value = staat.beroep || '';
}

function tekenBeroep(beroep) {
  const routes = beroep.routes.map((route, i) => {
    const stappen = route.stappen;
    return h('li', { class: 'route', 'data-gekozen': String(i === staat.route) },
      h('button', {
        type: 'button', class: 'route-knop', 'aria-pressed': String(i === staat.route),
        onclick: () => { staat.route = i; werkSchemaBij(); tekenPaneel(); },
      }, `Route ${i + 1}`),
      ...stappen.flatMap((stap, n) => [
        n > 0 && h('span', { class: 'pijltje', 'aria-hidden': 'true' }, '→'),
        h('button', {
          type: 'button', class: 'stap', style: `--kleur: ${NIVEAU_INFO[stap].kleur}`,
          onclick: () => kiesStap(i, stap),
        }, h('b', {}, String(n + 1)), NIVEAU_INFO[stap].kort),
      ]),
      h('span', { class: 'pijltje', 'aria-hidden': 'true' }, '→'),
      h('span', { class: 'stap eind' }, beroep.naam));
  });

  return h('div', { class: 'beroep' },
    h('h2', {}, beroep.naam),
    beroep.omschrijving && h('p', {}, beroep.omschrijving),
    routes.length === 0
      ? h('p', { class: 'leeg' }, 'Voor dit beroep zijn nog geen routes ingevoerd.')
      : h('p', { class: 'hierna-label' },
        routes.length > 1 ? 'Er zijn meerdere wegen na de basisschool. Kies een route of klik op een stap:' : 'Zo kom je er na de basisschool:'),
    h('ul', { class: 'routes' }, ...routes));
}

function tekenPaneel() {
  const id = staat.gekozen;
  const beroep = huidigBeroep();
  const delen = [];

  if (beroep) delen.push(tekenBeroep(beroep));
  if (id) {
    delen.push(tekenInfo(id));
    if (MET_SCHOLEN.includes(id)) delen.push(tekenScholen(id));
  }
  if (delen.length === 0) {
    delen.push(h('div', { class: 'leeg-paneel' },
      h('p', { class: 'leeg-kop' }, 'Hier komt de uitleg'),
      h('p', {}, 'Kies een blok in de kaart of een beroep bovenin.')));
  }

  paneelEl.replaceChildren(
    ...delen.map((deel) => h('section', { class: 'paneel-deel' }, deel)),
    ...(staat.demo ? [h('p', { class: 'demo' }, 'Voorbeeldgegevens: Supabase is nog niet gekoppeld.')] : []));
}

// ---------- Info-icoon in de kop ----------

function zetInfo(open) {
  infoEl.hidden = !open;
  infoKnopEl.setAttribute('aria-expanded', String(open));
}

infoKnopEl.addEventListener('click', (e) => {
  e.stopPropagation();
  zetInfo(infoEl.hidden);
});
document.addEventListener('click', (e) => {
  if (!infoEl.hidden && !infoEl.contains(e.target)) zetInfo(false);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !infoEl.hidden) {
    zetInfo(false);
    infoKnopEl.focus();
  }
});

beroepSelectEl.addEventListener('change', () => kiesBeroep(beroepSelectEl.value));
document.querySelectorAll('[data-regio]').forEach((el) => { el.textContent = REGIO; });

// ---------- Start ----------

schemaEl.addEventListener('click', (e) => {
  const blok = e.target.closest('.blok');
  if (blok) kies(blok.dataset.id);
});
schemaEl.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const blok = e.target.closest('.blok');
  if (!blok) return;
  e.preventDefault();
  kies(blok.dataset.id);
});

tekenSchema();
tekenPaneel();

laadGegevens()
  .then((gegevens) => {
    Object.assign(staat, gegevens);
    vulBeroepKeuze();
    tekenPaneel();
  })
  .catch((fout) => {
    console.error(fout);
    paneelEl.replaceChildren(h('p', { class: 'fout' }, 'De scholen konden niet worden geladen. Probeer de pagina te verversen.'));
  });

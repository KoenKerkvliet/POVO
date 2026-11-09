// Het doorstroomschema voor de klas.
import { REGIO } from './config.js';
import { laadGegevens } from './data.js';
import { h, svg, veiligeUrl } from './dom.js';
import {
  BLOKKEN, VMBO, MBO, LEERWEGEN, MBO_NIVEAUS, PIJLEN, GROEPEN,
  JAAR_PX, GROND_Y, NIVEAU_INFO, STANDAARD_OMSCHRIJVING, MET_SCHOLEN, brugklasDelen, SCHOOL_NIVEAU_VOLGORDE,
  leerwegGeometrie, mboGeometrie, hoekVan, SCHEMA_VIEWBOX, paletStijl, paletVan, leerwegBeeld, AFBEELDINGEN, paneelAfbeelding, LEERLING_BREEDTE,
} from './schema-data.js';

const schemaEl = document.querySelector('#schema');
const paneelEl = document.querySelector('#paneel');
const beroepKeuzeEl = document.querySelector('#beroep-keuze');
const beroepSelectEl = document.querySelector('#beroep-select');
const infoKnopEl = document.querySelector('#info-knop');
const infoEl = document.querySelector('#info');
const printKnopEl = document.querySelector('#print-knop');
const printLegendaEl = document.querySelector('#print-legenda');
const printGekozenEl = document.querySelector('#print-gekozen');
const printDatumEl = document.querySelector('#print-datum');

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

// Of de sectie met beroepen bij een Werk-vakje uitgeklapt is (standaard dicht).
const WERK_SLEUTEL = 'povo-werk-beroepen-open';

function laadWerkSectieOpen() {
  try {
    return localStorage.getItem(WERK_SLEUTEL) === '1';
  } catch {
    return false;
  }
}

function zetWerkSectieOpen(open) {
  if (open === staat.werkOpen) return;
  staat.werkOpen = open;
  try {
    localStorage.setItem(WERK_SLEUTEL, open ? '1' : '0');
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
  beroepen: [], beroep: null, route: 0, alleenTweetalig: false, openScholen: laadOpenScholen(), scholenOpen: laadScholenSectieOpen(), werkOpen: laadWerkSectieOpen(),
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

// Elke route eindigt met werk: na het praktijkonderwijs, het mbo, het hbo of de universiteit komt het bijbehorende
// Werk-vakje als laatste stap. In de database staan alleen de opleidingsstappen; dit vult het aan.
const WERK_NA_OPLEIDING = {
  pro: 'werk', mbo1: 'werk-mbo', mbo2: 'werk-mbo', mbo3: 'werk-mbo', mbo4: 'werk-mbo', hbo: 'werk-hbo', wo: 'werk-wo',
};

function metWerk(stappen) {
  const laatste = stappen[stappen.length - 1];
  const werk = WERK_NA_OPLEIDING[laatste];
  return werk ? [...stappen, werk] : stappen;
}

// De gekozen route als lijst van onderdelen (na de basisschool).
function huidigeRoute() {
  const beroep = huidigBeroep();
  const route = beroep?.routes[staat.route];
  return route ? metWerk(route.stappen) : null;
}

const omschrijving = (id) => staat.omschrijvingen[id] || STANDAARD_OMSCHRIJVING[id] || '';

// ---------- Schema tekenen ----------

function tekenTekst(regels, cx) {
  return regels.map(([tekst, y, grootte, vet]) =>
    svg('text', {
      x: cx, y, 'font-size': grootte, 'font-weight': vet ? 800 : 400, 'fill-opacity': vet ? 1 : 0.8, 'text-anchor': 'middle',
    }, tekst));
}

// Een lichte rand om een blok dat je daarna kunt kiezen; alleen zichtbaar als dat blok 'dichtbij' is.
const maakRing = (x, y, w, hoogte, r) => svg('rect', {
  class: 'ring', x: x - 3, y: y - 3, width: w + 6, height: hoogte + 6, rx: r + 3,
});

// Een leerling onderaan een kolom, alsof hij of zij daar staat. Wordt bijgesneden op de afgeronde hoeken van het blok.
function maakAfbeelding(def) {
  const { id, x, y, w, h: hoogte, afbeelding } = def;
  const breedte = LEERLING_BREEDTE;
  const beeldHoogte = breedte * afbeelding.verhouding;
  const knip = `knip-${id}`;
  return svg('g', { class: 'afbeelding', 'aria-hidden': 'true' },
    svg('clipPath', { id: knip }, svg('rect', { x, y, width: w, height: hoogte, rx: 18 })),
    svg('image', {
      href: afbeelding.src, x: x + (w - breedte) / 2, y: y + hoogte - beeldHoogte, width: breedte, height: beeldHoogte,
      preserveAspectRatio: 'xMidYMax meet', 'clip-path': `url(#${knip})`,
    }));
}

function maakBlok(def, extra = []) {
  const { id, x, y, w, h: hoogte } = def;
  return svg('g', {
    class: GROEPEN[id] && id !== 'vwo' ? 'blok container' : 'blok', 'data-id': id, tabindex: 0, role: 'button', 'aria-pressed': 'false',
    'aria-label': NIVEAU_INFO[id].naam, style: paletStijl(id),
  },
  maakRing(x, y, w, hoogte, 18),
  def.verlenging && svg('rect', {
    class: 'verlenging', x: x + 2, y: def.verlenging.y + 2, width: w - 4, height: def.verlenging.h + 2,
    rx: 18,
  }),
  svg('rect', { class: 'vorm', x, y, width: w, height: hoogte, rx: 18 }),
  def.afbeelding && maakAfbeelding(def),
  ...tekenTekst(def.tekst, x + w / 2),
  ...extra);
}

function tekenSchema() {
  schemaEl.setAttribute('viewBox', SCHEMA_VIEWBOX);
  const defs = svg('defs', {},
    ...[['kop-grijs', 'oklch(0.68 0.025 265)', 10], ['kop-donker', 'oklch(0.25 0.04 265)', 12]]
      .map(([id, kleur, grootte]) =>
        svg('marker', {
          id, viewBox: '0 0 10 10', refX: 7, refY: 5, markerWidth: grootte, markerHeight: grootte,
          markerUnits: 'userSpaceOnUse', orient: 'auto',
        }, svg('path', {
          d: 'M1 1 L8 5 L1 9', fill: 'none', stroke: kleur, 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        }))));

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
      'LEERTIJD IN JAREN'));

  const pijlen = svg('g', { class: 'pijlen', 'aria-hidden': 'true' },
    ...PIJLEN.map((p, i) => svg('path', { class: 'pijl', 'data-van': p.van, 'data-naar': p.naar, 'data-index': i, d: p.d })));

  // vmbo met vier leerwegen
  const leerwegen = LEERWEGEN.map((lw, i) => {
    const g = leerwegGeometrie(i);
    const beeld = leerwegBeeld(i);
    return svg('g', {
      class: 'blok cel', 'data-id': lw.id, tabindex: 0, role: 'button', 'aria-pressed': 'false',
      'aria-label': NIVEAU_INFO[lw.id].naam, style: paletStijl(lw.id),
    },
    maakRing(g.x, g.y, g.w, g.h, 12),
    svg('rect', { class: 'vorm', x: g.x, y: g.y, width: g.w, height: g.h, rx: 12 }),
    svg('text', { x: g.x + g.w / 2, y: g.y + 34, 'font-size': 26, 'font-weight': 800, 'text-anchor': 'middle' }, lw.kort),
    ...lw.regels.map((regel, r) =>
      svg('text', {
        x: g.x + g.w / 2, y: g.y + 66 + r * 19, 'font-size': 14, 'font-weight': 400, 'fill-opacity': 0.85, 'text-anchor': 'middle',
      }, regel)),
    svg('g', { class: 'afbeelding', 'aria-hidden': 'true' },
      svg('image', {
        href: AFBEELDINGEN[lw.id], x: beeld.x, y: beeld.y, width: beeld.w, height: beeld.h, preserveAspectRatio: 'xMidYMax meet',
      })));
  });
  const vmbo = maakBlok(VMBO, leerwegen);

  // mbo-balk met vier niveaus
  const mboNiveaus = MBO_NIVEAUS.map((n, i) => {
    const g = mboGeometrie(i);
    return svg('g', {
      class: 'blok cel', 'data-id': n.id, tabindex: 0, role: 'button', 'aria-pressed': 'false',
      'aria-label': NIVEAU_INFO[n.id].naam, style: paletStijl(n.id),
    },
    maakRing(g.x, g.y, g.w, g.h, 12),
    svg('rect', { class: 'vorm', x: g.x, y: g.y, width: g.w, height: g.h, rx: 12 }),
    svg('text', { x: g.x + g.w / 2, y: g.y + 38, 'font-size': 18, 'font-weight': 800, 'text-anchor': 'middle' }, `niveau ${n.nummer}`),
    svg('text', {
      x: g.x + g.w / 2, y: g.y + 62, 'font-size': 14, 'font-weight': 400, 'fill-opacity': 0.8, 'text-anchor': 'middle',
    }, n.duur));
  });
  const mbo = maakBlok(MBO, mboNiveaus);

  schemaEl.replaceChildren(defs, tijdlijn, pijlen, ...BLOKKEN.map((b) => maakBlok(b)), vmbo, mbo,
    // Labels bij instroompijlen (bijv. 'instroom klas 4'): alleen zichtbaar als je het vertrekblok aanklikt.
    svg('g', { class: 'pijl-labels', 'aria-hidden': 'true' },
      ...PIJLEN.filter((p) => p.label).map((p) => svg('g', {
        class: 'pijl-label', 'data-van': p.van, transform: `translate(${p.label.x} ${p.label.y})`,
      },
      svg('rect', { x: 0, y: -12, width: 112, height: 24, rx: 12 }),
      svg('text', { x: 56, y: 5, 'text-anchor': 'middle' }, p.label.tekst)))),
    svg('g', { class: 'stapnummers', 'aria-hidden': 'true' }));
}

// ---------- Selecteren ----------

function kies(id) {
  staat.gekozen = staat.gekozen === id ? null : id;
  staat.plaats = null;
  werkSchemaBij();
  tekenPaneel();
}

// Welke blokken horen bij de keuze? 'aan' = het gekozen blok, 'dichtbij' = waar je daarna naartoe kunt,
// 'uit' = de rest (die wordt gedimd). Het vmbo en het mbo bevatten blokjes: die blijven gewoon zichtbaar.
const CONTAINERS = { vmbo: GROEPEN.vmbo, mbo: GROEPEN.mbo };
const OUDER = Object.fromEntries(Object.entries(CONTAINERS).flatMap(([ouder, kinderen]) => kinderen.map((k) => [k, ouder])));

function bepaalStand(id) {
  if (!id) return () => 'rust';
  const dichtbij = new Set(CONTAINERS[id] || []);
  for (const p of pijlenVan(id)) {
    dichtbij.add(p.van);
    dichtbij.add(p.naar);
  }
  return (bid) => {
    if (bid === id) return 'aan';
    if (dichtbij.has(bid)) return 'dichtbij';
    if ((CONTAINERS[bid] || []).some((kind) => kind === id || dichtbij.has(kind))) return 'rust';
    if (OUDER[bid] === id) return 'rust';
    return 'uit';
  };
}

function werkSchemaBij() {
  const id = staat.gekozen;
  const actiefeBlokken = new Set(id ? [id] : []);
  schemaEl.classList.toggle('heeft-keuze', Boolean(id));

  // Bij een gekozen route krijgt de route de aandacht (zie tekenRoute), anders de gekozen kaart.
  const stand = huidigeRoute() ? bepaalStand(null) : bepaalStand(id);

  schemaEl.querySelectorAll('.blok').forEach((blok) => {
    const actief = actiefeBlokken.has(blok.dataset.id);
    const s = stand(blok.dataset.id);
    blok.classList.toggle('actief', actief);
    blok.classList.toggle('dichtbij', s === 'dichtbij');
    blok.classList.toggle('uit', s === 'uit');
    blok.setAttribute('aria-pressed', String(actief));
  });

  const vanSet = new Set(id ? leden(id) : []);
  schemaEl.querySelectorAll('.pijl').forEach((pijl) => {
    pijl.classList.toggle('actief', vanSet.has(pijl.dataset.van));
  });

  schemaEl.querySelectorAll('.pijl-label').forEach((label) => {
    label.classList.toggle('zichtbaar', label.dataset.van === id);
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
      svg('circle', { r: 12 }),
      svg('text', { y: 5, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 800 }, String(i + 1)));
  });
  schemaEl.querySelector('.stapnummers').replaceChildren(...nummers.filter(Boolean));
}

// ---------- Paneel bovenin ----------

// Knop naar een ander onderdeel: wit met een gekleurd vierkantje ervoor.
const kiesKnop = (doel) => h('button', {
  type: 'button', class: 'chip', onclick: () => kies(doel),
}, h('span', { class: 'stip', style: `background: ${NIVEAU_INFO[doel].kleur}` }), NIVEAU_INFO[doel].kort);

function tekenInfo(id) {
  const info = NIVEAU_INFO[id];
  const palet = paletVan(id);
  const doelen = hierna(id);
  const beeld = paneelAfbeelding(id);
  return h('div', { class: 'info', style: `--solid: ${palet.solid}; --tint: ${palet.tint}; --ink: ${palet.ink}` },
    beeld && h('div', { class: 'info-beeld' }, h('img', { src: beeld, alt: '', loading: 'lazy' })),
    h('div', { class: 'kop-rij' },
      h('div', { class: 'info-kop' },
        h('span', { class: 'kleurbalk' }),
        h('h2', {}, info.titel || info.naam),
        info.sub && h('p', { class: 'sub' }, info.sub)),
      h('button', { type: 'button', class: 'sluit', 'aria-label': `Sluit ${info.kort}`, onclick: () => kies(id) }, '×')),
    info.duur && h('p', { class: 'duur-rij' }, h('span', { class: 'duur-pil' }, `Duur: ${info.duur}`)),
    h('p', { class: 'uitleg' }, omschrijving(id)),
    doelen.length > 0 && h('div', { class: 'hierna' },
      h('div', { class: 'label' }, 'Daarna kun je naar'),
      h('div', { class: 'chips' }, ...doelen.map(kiesKnop))));
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

// In de keuzelijst staat elk beroep onder het laagste niveau waarmee je het kunt bereiken.
const BEROEP_GROEPEN = [
  { label: 'Praktijkonderwijs', ids: ['pro', 'werk'] },
  { label: 'Mbo niveau 1', ids: ['mbo1'] },
  { label: 'Mbo niveau 2', ids: ['mbo2'] },
  { label: 'Mbo niveau 3', ids: ['mbo3'] },
  { label: 'Mbo niveau 4', ids: ['mbo4'] },
  { label: 'Hbo', ids: ['hbo'] },
  { label: 'Wo (universiteit)', ids: ['wo'] },
];

function beroepGroep(beroep) {
  const nummers = beroep.routes
    .map((route) => BEROEP_GROEPEN.findIndex((g) => g.ids.includes(route.stappen[route.stappen.length - 1])))
    .filter((n) => n >= 0);
  return nummers.length ? Math.min(...nummers) : BEROEP_GROEPEN.length;
}

function vulBeroepKeuze() {
  beroepKeuzeEl.hidden = staat.beroepen.length === 0;

  const perGroep = new Map();
  for (const beroep of staat.beroepen) {
    const nummer = beroepGroep(beroep);
    if (!perGroep.has(nummer)) perGroep.set(nummer, []);
    perGroep.get(nummer).push(beroep);
  }
  const groepen = [...perGroep.entries()].sort((x, y) => x[0] - y[0]).map(([nummer, beroepen]) =>
    h('optgroup', { label: BEROEP_GROEPEN[nummer]?.label || 'Overig' },
      ...beroepen.sort((x, y) => x.naam.localeCompare(y.naam, 'nl')).map((b) => h('option', { value: b.id }, b.naam))));

  beroepSelectEl.replaceChildren(h('option', { value: '' }, 'Kies een beroep...'), ...groepen);
  beroepSelectEl.value = staat.beroep || '';
}

function tekenBeroep(beroep) {
  const pijltje = () => h('span', { class: 'pijltje', 'aria-hidden': 'true' }, '→');

  const routes = beroep.routes.map((route, i) => {
    const gekozen = i === staat.route;
    return h('li', { class: 'route', 'data-gekozen': String(gekozen) },
      h('button', {
        type: 'button', class: 'route-knop', 'aria-pressed': String(gekozen),
        onclick: () => { staat.route = i; werkSchemaBij(); tekenPaneel(); },
      }, `Route ${i + 1}`),
      h('div', { class: 'keten' },
        // Pijltje en stap blijven samen op één regel, zodat een pijltje nooit alleen aan het eind van een regel staat.
        ...metWerk(route.stappen).map((stap, n) => h('span', { class: 'schakel' },
          n > 0 && pijltje(),
          h('button', {
            type: 'button', class: 'stap', style: paletStijl(stap), onclick: () => kiesStap(i, stap),
          }, h('b', {}, String(n + 1)), NIVEAU_INFO[stap].kort))),
        h('span', { class: 'schakel' }, pijltje(), h('span', { class: 'stap eind' }, beroep.naam))));
  });

  return h('div', { class: 'beroep', style: paletStijl('werk') },
    h('div', { class: 'kop-rij' },
      h('div', { class: 'beroep-kop' },
        h('span', { class: 'kleurbalk' }),
        h('div', { class: 'label' }, 'Beroep'),
        h('h2', {}, beroep.naam)),
      // Kruisje: het beroep deselecteren zonder de keuzelijst te gebruiken.
      h('button', { type: 'button', class: 'sluit', 'aria-label': `Sluit ${beroep.naam}`, onclick: () => kiesBeroep(null) }, '×')),
    beroep.omschrijving && h('p', { class: 'uitleg' }, beroep.omschrijving),
    routes.length === 0
      ? h('p', { class: 'leeg' }, 'Voor dit beroep zijn nog geen routes ingevoerd.')
      : h('p', { class: 'route-uitleg' },
        routes.length > 1 ? 'Er zijn meerdere wegen na de basisschool. Kies een route of klik op een stap:' : 'Zo kom je er na de basisschool:'),
    h('ul', { class: 'routes' }, ...routes));
}

// Welke beroepen horen bij een Werk-vakje: die je kunt bereiken via een route die op dat niveau eindigt.
const WERK_NA = {
  werk: { titel: 'Beroepen na het praktijkonderwijs', niveaus: ['werk'] },
  'werk-mbo': { titel: 'Beroepen na het mbo', niveaus: ['mbo1', 'mbo2', 'mbo3', 'mbo4'] },
  'werk-hbo': { titel: 'Beroepen na het hbo', niveaus: ['hbo'] },
  'werk-wo': { titel: 'Beroepen na de universiteit', niveaus: ['wo'] },
};

function tekenWerkBeroepen(id) {
  const na = WERK_NA[id];
  if (!na || staat.beroepen.length === 0) return null;

  // Per beroep: het laagste niveau (van dit Werk-vakje) waarop een route eindigt.
  const passend = staat.beroepen
    .map((b) => {
      const plekken = b.routes.map((r) => na.niveaus.indexOf(r.stappen[r.stappen.length - 1])).filter((n) => n >= 0);
      return plekken.length ? { beroep: b, plek: Math.min(...plekken) } : null;
    })
    .filter(Boolean)
    .sort((x, y) => x.plek - y.plek || x.beroep.naam.localeCompare(y.beroep.naam, 'nl'));

  const knop = (b) => h('button', {
    type: 'button', class: 'chip', 'aria-pressed': String(staat.beroep === b.id), onclick: () => kiesBeroep(b.id),
  }, h('span', { class: 'stip', style: 'background: var(--amber)' }), b.naam);

  // Bij het mbo staan de beroepen onder hun niveau; bij de andere vakjes is er één lijst.
  const metNiveaus = na.niveaus.length > 1;
  const inhoud = passend.length === 0
    ? [h('p', { class: 'leeg' }, 'Hier zijn nog geen beroepen voor ingevoerd.')]
    : metNiveaus
      ? na.niveaus.flatMap((niveau, i) => {
        const hier = passend.filter((p) => p.plek === i);
        return hier.length === 0 ? [] : [
          h('h4', { class: 'sectie-titel' }, NIVEAU_INFO[niveau].naam),
          h('div', { class: 'chips beroep-chips' }, ...hier.map((p) => knop(p.beroep))),
        ];
      })
      : [h('div', { class: 'chips beroep-chips' }, ...passend.map((p) => knop(p.beroep)))];

  return h('div', { class: 'scholen' },
    h('details', {
      class: 'scholen-sectie',
      open: staat.werkOpen,
      ontoggle: (e) => zetWerkSectieOpen(e.target.open),
    },
    h('summary', {}, h('h3', {}, na.titel), h('span', { class: 'aantal' }, String(passend.length))),
    h('p', { class: 'werk-hint' }, 'Kies een beroep om de route ernaartoe te zien.'),
    ...inhoud));
}

function tekenPaneel() {
  const id = staat.gekozen;
  const beroep = huidigBeroep();
  const delen = [];

  if (beroep) delen.push(tekenBeroep(beroep));
  if (id) {
    delen.push(tekenInfo(id));
    if (MET_SCHOLEN.includes(id)) delen.push(tekenScholen(id));
    const werkBeroepen = tekenWerkBeroepen(id);
    if (werkBeroepen) delen.push(werkBeroepen);
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

// ---------- Printen of opslaan als pdf ----------

// Kleuren onderaan de uitleg op de print.
function vulPrintLegenda() {
  const items = [
    ['pro', 'Praktijkonderwijs'], ['vmbo', 'Vmbo'], ['havo', 'Havo'], ['vwo', 'Vwo'],
    ['mbo', 'Mbo'], ['hbo', 'Hbo'], ['wo', 'Wo (universiteit)'], ['werk', 'Werk'],
  ];
  printLegendaEl.replaceChildren(...items.map(([id, naam]) =>
    h('li', {}, h('span', { class: 'print-stip', style: `background: ${NIVEAU_INFO[id].kleur}` }), naam)));
}

// Het gekozen beroep (met zijn routes) of de gekozen kaart komt mee op de print.
function vulPrintGekozen() {
  const beroep = huidigBeroep();
  const id = staat.gekozen;
  const delen = [];

  if (beroep) {
    delen.push(h('h3', {}, `Beroep: ${beroep.naam}`));
    if (beroep.omschrijving) delen.push(h('p', {}, beroep.omschrijving));
    delen.push(h('ol', { class: 'print-routes' }, ...beroep.routes.map((route) =>
      h('li', {}, [...metWerk(route.stappen).map((stap) => NIVEAU_INFO[stap].kort), beroep.naam].join(' \u2192 ')))));
  }
  if (id) {
    const info = NIVEAU_INFO[id];
    delen.push(h('h3', {}, info.titel || info.naam));
    if (info.duur) delen.push(h('p', { class: 'print-duur' }, `Duur: ${info.duur}`));
    delen.push(h('p', {}, omschrijving(id)));
  }
  printGekozenEl.replaceChildren(...delen);
  printGekozenEl.hidden = delen.length === 0;
}

window.addEventListener('beforeprint', () => {
  printDatumEl.textContent = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  vulPrintGekozen();
});
printKnopEl.addEventListener('click', () => window.print());

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
vulPrintLegenda();
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

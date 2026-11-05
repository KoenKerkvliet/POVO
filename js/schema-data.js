// De vorm van het doorstroomschema: blokken, pijlen en standaardteksten.
// De hoogte van de kolommen = aantal leerjaren (JAAR_PX per jaar, grondlijn op y = GROND_Y).
// Alle hoogtes zijn afgeleid van de constanten hieronder, zodat het schema met JAAR_PX meegroeit.

export const JAAR_PX = 100;

const WERK_RIJ_Y = 20; // bovenste rij: 'Werk' na het mbo, hbo en wo
const WERK_RIJ_H = 56;
const RIJ_Y = 130; // rij daaronder: werk (na pr.o.), de mbo-balk, hbo en wo
const RIJ_H = 100; // hoogte van werk, hbo en wo
const MBO_H = 140; // hoogte van de mbo-balk
const PIJL_RUIMTE = 66; // ruimte voor de pijl tussen vwo en wo

export const GROND_Y = RIJ_Y + RIJ_H + PIJL_RUIMTE + 6 * JAAR_PX;
const jaarY = (jaren) => GROND_Y - jaren * JAAR_PX;

const BASIS_Y = GROND_Y + 16;
const BASIS_H = 66;

export const SCHEMA_VIEWBOX = [0, WERK_RIJ_Y - 10, 1230, BASIS_Y + BASIS_H + 14 - (WERK_RIJ_Y - 10)].join(' ');

// Elke route heeft een eigen kleur (tint en helderheid zijn voor alle routes gelijk). Bewust geen kleurverloop
// van licht naar donker, zodat geen enkel blok "belangrijker" lijkt dan een ander.
// Per kleur: [tint (0-360), kleurkracht]. Alle andere tinten van een kleur worden daaruit afgeleid.
const PALET = {
  basisschool: [255, 0.04],
  pro: [185, 0.11],
  vmbo: [45, 0.16],
  mbo: [150, 0.14],
  havo: [300, 0.17],
  vwo: [262, 0.17],
  hbo: [15, 0.17],
  wo: [345, 0.15],
  werk: [70, 0.13],
};

// Welke kleur hoort bij een onderdeel (leerwegen horen bij het vmbo, mbo-niveaus bij het mbo, enzovoort).
function paletSleutel(id) {
  if (id.startsWith('vmbo')) return 'vmbo';
  if (id.startsWith('mbo')) return 'mbo';
  if (id.startsWith('werk')) return 'werk';
  if (id === 'gymnasium') return 'vwo';
  return PALET[id] ? id : 'basisschool';
}

// Alle tinten van de kleur van een onderdeel, als CSS-kleuren.
export function paletVan(id) {
  const [h, c] = PALET[paletSleutel(id)];
  return {
    tint: `oklch(0.955 ${c * 0.25} ${h})`, // zachte vulling
    line: `oklch(0.85 ${c * 0.5} ${h})`, // rand
    ink: `oklch(0.38 ${c * 0.8} ${h})`, // tekst
    solid: `oklch(0.6 ${c} ${h})`, // volle kleur (aangeklikt)
    deep: `oklch(0.47 ${c} ${h})`, // donkere rand
    ring: `oklch(0.88 ${c * 0.45} ${h})`, // lichte gloed
    schaduw: `oklch(0.4 ${c} ${h} / 0.45)`,
  };
}

// CSS-variabelen van een onderdeel, voor in een style-attribuut.
export function paletStijl(id) {
  return Object.entries(paletVan(id)).map(([naam, waarde]) => `--${naam}: ${waarde}`).join('; ');
}

export const KLEUREN = {
  basis: paletVan('basisschool').solid,
  pro: paletVan('pro').solid,
  vmbo: paletVan('vmbo').solid,
  havo: paletVan('havo').solid,
  vwo: paletVan('vwo').solid,
  mbo: paletVan('mbo').solid,
  hbo: paletVan('hbo').solid,
  wo: paletVan('wo').solid,
  werk: paletVan('werk').solid,
};

const VMBO_X = 270;
const LEERWEG_B = 130;

export const LEERWEGEN = [
  { id: 'vmbo-bbl', kort: 'bbl', regels: ['basis', 'beroepsgerichte', 'leerweg'] },
  { id: 'vmbo-kbl', kort: 'kbl', regels: ['kader', 'beroepsgerichte', 'leerweg'] },
  { id: 'vmbo-gl', kort: 'gl', regels: ['gemengde', 'leerweg'] },
  { id: 'vmbo-tl', kort: 'tl', regels: ['theoretische', 'leerweg', '(mavo)'] },
];

export const MBO_NIVEAUS = [
  { id: 'mbo1', nummer: 1, duur: '1 jaar' },
  { id: 'mbo2', nummer: 2, duur: '2 jaar' },
  { id: 'mbo3', nummer: 3, duur: '2-3 jaar' },
  { id: 'mbo4', nummer: 4, duur: '3-4 jaar' },
];

// Eenvoudige blokken. 'tekst': [regel, y, lettergrootte, vet?]
export const BLOKKEN = [
  { id: 'basisschool', kleur: KLEUREN.basis, x: 90, y: BASIS_Y, w: 1110, h: BASIS_H,
    tekst: [['basisschool', BASIS_Y + 30, 26, true], ['8 jaar', BASIS_Y + 54, 16, false]] },
  { id: 'pro', kleur: KLEUREN.pro, x: 90, y: jaarY(5), w: 140, h: 5 * JAAR_PX,
    afbeelding: { src: 'img/pro.webp', verhouding: 1.5 }, // staande leerling onderaan de kolom (breedte : hoogte = 2 : 3)
    verlenging: { y: jaarY(6), h: JAAR_PX }, // gestippeld stuk: sommige leerlingen doen er een jaar langer over
    tekst: [['praktijk', jaarY(5) + 44, 22, true], ['onderwijs', jaarY(5) + 70, 22, true], ['5/6 jaar', jaarY(5) + 100, 16, false]] },
  { id: 'havo', kleur: KLEUREN.havo, x: 846, y: jaarY(5), w: 150, h: 5 * JAAR_PX,
    afbeelding: { src: 'img/havo.webp', verhouding: 1.5 },
    tekst: [['havo', jaarY(5) + 46, 30, true], ['5 jaar', jaarY(5) + 74, 16, false]] },
  { id: 'vwo', kleur: KLEUREN.vwo, x: 1050, y: jaarY(6), w: 150, h: 6 * JAAR_PX,
    afbeelding: { src: 'img/vwo.webp', verhouding: 1.5 },
    tekst: [['vwo', jaarY(6) + 46, 30, true], ['6 jaar', jaarY(6) + 74, 16, false]] },
  { id: 'werk', kleur: KLEUREN.werk, x: 90, y: WERK_RIJ_Y, w: 140, h: WERK_RIJ_H,
    tekst: [['Werk', WERK_RIJ_Y + WERK_RIJ_H / 2 + 8, 24, true]] },
  ...[['werk-mbo', 270, 520], ['werk-hbo', 846, 150], ['werk-wo', 1050, 150]].map(([id, x, w]) => ({
    id, kleur: KLEUREN.werk, x, y: WERK_RIJ_Y, w, h: WERK_RIJ_H,
    tekst: [['Werk', WERK_RIJ_Y + WERK_RIJ_H / 2 + 8, 24, true]],
  })),
  { id: 'hbo', kleur: KLEUREN.hbo, x: 846, y: RIJ_Y, w: 150, h: RIJ_H,
    tekst: [['hbo', RIJ_Y + 50, 30, true], ['hogeschool', RIJ_Y + 76, 15, false]] },
  { id: 'wo', kleur: KLEUREN.wo, x: 1050, y: RIJ_Y, w: 150, h: RIJ_H,
    tekst: [['wo', RIJ_Y + 50, 30, true], ['universiteit', RIJ_Y + 76, 15, false]] },
];

const LEERWEG_Y = jaarY(4) + 14;
const LEERWEG_H = 152;

export const VMBO = { id: 'vmbo', kleur: KLEUREN.vmbo, x: VMBO_X, y: jaarY(4), w: 520, h: 4 * JAAR_PX,
  tekst: [['vmbo', LEERWEG_Y + LEERWEG_H + 30, 30, true], ['4 jaar', LEERWEG_Y + LEERWEG_H + 54, 16, false]] };

export const MBO = { id: 'mbo', kleur: KLEUREN.mbo, x: VMBO_X, y: RIJ_Y, w: 520, h: MBO_H,
  tekst: [['mbo', RIJ_Y + 30, 22, true]] };

export function leerwegGeometrie(i) {
  return { x: VMBO_X + 6 + LEERWEG_B * i, y: LEERWEG_Y, w: LEERWEG_B - 12, h: LEERWEG_H };
}
// Alle leerlingen in het schema zijn even groot, zodat er geen verschil in 'groter' of 'kleiner' ontstaat tussen de niveaus.
// Ze staan allemaal op dezelfde grondlijn (onderkant van hun kolom of van het vmbo-blok).
export const LEERLING_BREEDTE = 110;

// Plek van de leerling onder een leerweg-blokje, onderaan het vmbo-blok.
export function leerwegBeeld(i) {
  const cel = leerwegGeometrie(i);
  const breedte = LEERLING_BREEDTE;
  const hoogte = breedte * 1.5;
  return { x: cel.x + (cel.w - breedte) / 2, y: VMBO.y + VMBO.h - hoogte, w: breedte, h: hoogte };
}

export function mboGeometrie(i) {
  return { x: VMBO_X + 6 + LEERWEG_B * i, y: RIJ_Y + 44, w: LEERWEG_B - 12, h: 86 };
}

// ---------- Pijlen ----------

const KOP = 6; // afstand tussen een blok en het begin of de punt van een pijl
const rijOnder = RIJ_Y + RIJ_H + KOP; // onderkant van werk, hbo en wo (+ ruimte)
const mboOnder = RIJ_Y + MBO_H + KOP;
const werkOnder = WERK_RIJ_Y + WERK_RIJ_H + KOP; // onderkant van de bovenste rij met werk-vakjes
const mboMidden = RIJ_Y + 112; // hoogte waarop pijlen de zijkant van de mbo-balk raken
const lijnY = RIJ_Y + 50; // vaste hoogte van de pijlen tussen mbo, hbo en wo

// Gebogen pijl omhoog van het vmbo naar de mbo-balk.
function omhoog(van, naar) {
  const y0 = jaarY(4) - KOP;
  const y1 = mboOnder;
  const stap = y0 - y1;
  return `M ${van} ${y0} C ${van} ${y0 - 0.41 * stap}, ${naar} ${y0 - 0.61 * stap}, ${naar} ${y1}`;
}
// Kleine boog boven de mbo-balk (van niveau n naar n+1).
const boog = (van, naar) => `M ${van} ${RIJ_Y - 4} C ${van + 3} ${RIJ_Y - 40}, ${naar - 3} ${RIJ_Y - 40}, ${naar} ${RIJ_Y - 3}`;

// Hoogte van het midden van een klas (1 = eerste klas) in een kolom. Instroompijlen eindigen op de juiste klas.
const klasY = (klas) => GROND_Y - (klas - 0.5) * JAAR_PX;

// Rechte pijl omhoog van de rij met mbo, hbo en wo naar het werk-vakje erboven.
const werkPijl = (x) => `M ${x} ${RIJ_Y - KOP} L ${x} ${WERK_RIJ_Y + WERK_RIJ_H + KOP}`;

// van = blok waar de pijl uit komt, naar = blok waar je terechtkomt.
export const PIJLEN = [
  { van: 'pro', naar: 'werk', d: `M 160 ${jaarY(6) - KOP} L 160 ${werkOnder}` },
  { van: 'pro', naar: 'mbo1', d: `M 205 ${jaarY(6) - KOP} C 205 ${mboMidden}, 225 ${mboMidden}, 262 ${mboMidden}` },

  { van: 'vmbo-bbl', naar: 'mbo2', d: omhoog(335, 465) },
  { van: 'vmbo-kbl', naar: 'mbo3', d: omhoog(445, 575) },
  { van: 'vmbo-kbl', naar: 'mbo4', d: omhoog(485, 690) },
  { van: 'vmbo-gl', naar: 'mbo3', d: omhoog(590, 615) },
  { van: 'vmbo-gl', naar: 'mbo4', d: omhoog(625, 725) },
  { van: 'vmbo-tl', naar: 'mbo4', d: omhoog(735, 760) },
  { van: 'vmbo-tl', naar: 'havo', d: `M 794 ${klasY(4)} L 842 ${klasY(4)}`,
    // Label in het doelblok; alleen zichtbaar als je het vertrekblok aanklikt.
    label: { tekst: 'instroom klas 4', x: 854, y: klasY(4) } },

  { van: 'mbo1', naar: 'mbo2', d: boog(375, 425) },
  { van: 'mbo2', naar: 'mbo3', d: boog(505, 555) },
  { van: 'mbo3', naar: 'mbo4', d: boog(635, 685) },
  { van: 'mbo4', naar: 'hbo', d: `M 794 ${lijnY} L 842 ${lijnY}` },

  { van: 'havo', naar: 'mbo4', d: `M 880 ${jaarY(5) - KOP} C 880 ${jaarY(5) - KOP - 0.66 * (jaarY(5) - KOP - mboMidden)}, 850 ${mboMidden}, 797 ${mboMidden}` },
  { van: 'havo', naar: 'hbo', d: `M 940 ${jaarY(5) - KOP} L 940 ${rijOnder}` },
  { van: 'havo', naar: 'vwo', d: `M 1000 ${klasY(5)} L 1046 ${klasY(5)}`,
    label: { tekst: 'instroom klas 5', x: 1058, y: klasY(5) } },

  { van: 'vwo', naar: 'hbo', d: `M 1075 ${jaarY(6) - KOP} C 1075 ${jaarY(6) - 36}, 1000 ${jaarY(6) - 31}, 980 ${rijOnder}` },
  { van: 'vwo', naar: 'wo', d: `M 1125 ${jaarY(6) - KOP} L 1125 ${rijOnder}` },
  { van: 'hbo', naar: 'wo', d: `M 1000 ${lijnY} L 1044 ${lijnY}` },

  // Uitstromen naar werk kan na elk mbo-niveau, het hbo en de universiteit.
  ...[['mbo1', 335], ['mbo2', 465], ['mbo3', 595], ['mbo4', 725]].map(([van, x]) => ({ van, naar: 'werk-mbo', d: werkPijl(x) })),
  { van: 'hbo', naar: 'werk-hbo', d: werkPijl(921) },
  { van: 'wo', naar: 'werk-wo', d: werkPijl(1125) },
];

// Afbeeldingen van een leerling per niveau. Single-leerlingen staan in het schema zelf (onderaan de kolom of het vmbo-blok);
// de afbeeldingen met twee leerlingen (mbo, hbo, wo) passen niet in hun vakje en staan bovenin het infopaneel.
export const AFBEELDINGEN = {
  pro: 'img/pro.webp',
  'vmbo-bbl': 'img/vmbo-bbl.webp',
  'vmbo-kbl': 'img/vmbo-kbl.webp',
  'vmbo-gl': 'img/vmbo-gl.webp',
  'vmbo-tl': 'img/vmbo-tl.webp',
  havo: 'img/havo.webp',
  vwo: 'img/vwo.webp',
  mbo: 'img/mbo.webp',
  hbo: 'img/hbo.webp',
  wo: 'img/wo.webp',
};
const AFBEELDING_ALIAS = { mbo1: 'mbo', mbo2: 'mbo', mbo3: 'mbo', mbo4: 'mbo' };
const AFBEELDING_IN_SCHEMA = new Set(['pro', 'vmbo-bbl', 'vmbo-kbl', 'vmbo-gl', 'vmbo-tl', 'havo', 'vwo']);

// De afbeelding die in het infopaneel hoort (alleen als hij niet al in het schema staat).
export function paneelAfbeelding(id) {
  const sleutel = AFBEELDING_ALIAS[id] || id;
  return AFBEELDING_IN_SCHEMA.has(sleutel) ? null : AFBEELDINGEN[sleutel] || null;
}

// Groepen: klik je op het vmbo of de mbo-balk, dan tellen de onderdelen mee.
export const GROEPEN = {
  vmbo: ['vmbo-bbl', 'vmbo-kbl', 'vmbo-gl', 'vmbo-tl'],
  vwo: ['vwo', 'gymnasium'], // het gymnasium is een vwo: scholen met gymnasium horen ook bij vwo
  mbo: ['mbo1', 'mbo2', 'mbo3', 'mbo4'],
};

// Namen en leertijd per onderdeel.
export const NIVEAU_INFO = {
  basisschool: { naam: 'Basisschool', kort: 'basisschool', duur: '8 jaar', kleur: KLEUREN.basis },
  pro: { naam: 'Praktijkonderwijs', kort: 'praktijkonderwijs', duur: '5 of 6 jaar', kleur: KLEUREN.pro },
  vmbo: { naam: 'Vmbo', kort: 'vmbo', duur: '4 jaar', kleur: KLEUREN.vmbo },
  'vmbo-bbl': { naam: 'Vmbo - basisberoepsgerichte leerweg (bbl)', kort: 'vmbo bbl', duur: '4 jaar', kleur: KLEUREN.vmbo },
  'vmbo-kbl': { naam: 'Vmbo - kaderberoepsgerichte leerweg (kbl)', kort: 'vmbo kbl', duur: '4 jaar', kleur: KLEUREN.vmbo },
  'vmbo-gl': { naam: 'Vmbo - gemengde leerweg (gl)', kort: 'vmbo gl', duur: '4 jaar', kleur: KLEUREN.vmbo },
  'vmbo-tl': { naam: 'Vmbo - theoretische leerweg (tl / mavo)', kort: 'vmbo tl', duur: '4 jaar', kleur: KLEUREN.vmbo },
  havo: { naam: 'Havo', kort: 'havo', duur: '5 jaar', kleur: KLEUREN.havo },
  vwo: { naam: 'Vwo', kort: 'vwo', duur: '6 jaar', kleur: KLEUREN.vwo },
  gymnasium: { naam: 'Gymnasium', kort: 'gymnasium', duur: '6 jaar', kleur: KLEUREN.vwo },
  mbo: { naam: 'Mbo', kort: 'mbo', duur: '1 tot 4 jaar', kleur: KLEUREN.mbo },
  mbo1: { naam: 'Mbo niveau 1', kort: 'mbo niveau 1', duur: 'ongeveer 1 jaar', kleur: KLEUREN.mbo },
  mbo2: { naam: 'Mbo niveau 2', kort: 'mbo niveau 2', duur: 'ongeveer 2 jaar', kleur: KLEUREN.mbo },
  mbo3: { naam: 'Mbo niveau 3', kort: 'mbo niveau 3', duur: '2 tot 3 jaar', kleur: KLEUREN.mbo },
  mbo4: { naam: 'Mbo niveau 4', kort: 'mbo niveau 4', duur: '3 tot 4 jaar', kleur: KLEUREN.mbo },
  hbo: { naam: 'Hbo (hogeschool)', kort: 'hbo', duur: 'meestal 4 jaar', kleur: KLEUREN.hbo },
  wo: { naam: 'Wo (universiteit)', kort: 'wo', duur: 'bachelor 3 jaar + master', kleur: KLEUREN.wo },
  werk: { naam: 'Werk', kort: 'werk', duur: '', kleur: KLEUREN.werk },
  'werk-mbo': { naam: 'Werk', kort: 'werk', duur: '', kleur: KLEUREN.werk },
  'werk-hbo': { naam: 'Werk', kort: 'werk', duur: '', kleur: KLEUREN.werk },
  'werk-wo': { naam: 'Werk', kort: 'werk', duur: '', kleur: KLEUREN.werk },
};

// Ondertitel (en soms een kortere titel) voor in het infopaneel.
const EXTRA = {
  basisschool: { sub: 'groep 1 t/m 8' },
  pro: { sub: 'leren door te doen' },
  vmbo: { sub: 'voorbereidend middelbaar beroepsonderwijs' },
  'vmbo-bbl': { titel: 'Basisberoepsgerichte leerweg', sub: 'vmbo bbl' },
  'vmbo-kbl': { titel: 'Kaderberoepsgerichte leerweg', sub: 'vmbo kbl' },
  'vmbo-gl': { titel: 'Gemengde leerweg', sub: 'vmbo gl' },
  'vmbo-tl': { titel: 'Theoretische leerweg', sub: 'vmbo tl, ook wel mavo' },
  havo: { sub: 'hoger algemeen voortgezet onderwijs' },
  vwo: { sub: 'atheneum of gymnasium' },
  gymnasium: { sub: 'vwo met Latijn en Grieks' },
  mbo: { sub: 'middelbaar beroepsonderwijs' },
  mbo1: { sub: 'Entreeopleiding' },
  mbo2: { sub: 'Basisberoepsopleiding' },
  mbo3: { sub: 'Vakopleiding' },
  mbo4: { sub: 'Middenkaderopleiding' },
  hbo: { sub: 'hogeschool' },
  wo: { sub: 'universiteit' },
  werk: { sub: 'na het praktijkonderwijs' },
  'werk-mbo': { sub: 'na het mbo' },
  'werk-hbo': { sub: 'na het hbo' },
  'werk-wo': { sub: 'na de universiteit' },
};
for (const [id, extra] of Object.entries(EXTRA)) Object.assign(NIVEAU_INFO[id], extra);

// Standaardteksten. Je kunt ze overschrijven in het dashboard (tabel 'niveaus').
export const STANDAARD_OMSCHRIJVING = {
  basisschool:
    'Hier begin je. In groep 8 krijg je een schooladvies. Daarmee kies je samen met je ouders en je juf of meester een school voor daarna.',
  pro:
    'Je leert vooral door dingen echt te doen, in een kleine groep met veel hulp. Je oefent met werken en zelfstandig zijn. Daarna kun je gaan werken of een mbo-opleiding doen.',
  vmbo:
    'Het vmbo duurt 4 jaar. Er zijn vier leerwegen, met elk een andere mix van praktijk en theorie. Je kiest een richting, bijvoorbeeld zorg, techniek of economie. Daarna ga je naar het mbo.',
  'vmbo-bbl':
    'De basisberoepsgerichte leerweg: veel praktijk, je leert vooral door te doen. Daarna ga je meestal naar mbo niveau 2.',
  'vmbo-kbl':
    'De kaderberoepsgerichte leerweg: een mix van praktijk en theorie. Daarna ga je meestal naar mbo niveau 3 of 4.',
  'vmbo-gl':
    'De gemengde leerweg: een mix van de theorie van de tl en de praktijk van een beroepsrichting. Daarna ga je naar mbo niveau 3 of 4.',
  'vmbo-tl':
    'De theoretische leerweg, vroeger mavo genoemd: je leert vooral uit boeken en met opdrachten. Daarna ga je naar mbo niveau 4 of naar klas 4 van de havo.',
  havo:
    'De havo duurt 5 jaar. Je volgt algemene vakken en leert veel zelf plannen en uitzoeken. Kom je van het vmbo (tl), dan stroom je in op klas 4 en doe je nog 2 jaar. Daarna kun je naar het hbo, naar mbo niveau 4 of naar klas 5 van het vwo.',
  vwo:
    'Het vwo duurt 6 jaar. Je volgt algemene vakken en leert veel over onderzoeken en uitzoeken. Op het gymnasium leer je ook Latijn en Grieks. Kom je van de havo, dan stroom je in op klas 5 en doe je nog 2 jaar. Daarna kun je naar de universiteit of naar het hbo.',
  gymnasium:
    'Het gymnasium is vwo, met daarbij Latijn en Grieks. Het duurt 6 jaar. Daarna kun je naar de universiteit of naar het hbo.',
  mbo:
    'Het mbo is een opleiding voor een beroep, met veel praktijk en stages. Er zijn vier niveaus. Het niveau zegt niets over hoe goed je bent: het gaat over hoe breed en zelfstandig je later werkt. Elk niveau leidt op voor een echt beroep.',
  mbo1:
    'De entreeopleiding. Je leert in ongeveer een jaar de basis van een beroep, met veel praktijk. Daarna kun je gaan werken of doorgaan naar niveau 2.',
  mbo2:
    'De basisberoepsopleiding. Je leert in ongeveer 2 jaar uitvoerende taken in een beroep. Daarna kun je gaan werken of doorgaan naar niveau 3.',
  mbo3:
    'De vakopleiding. In 2 tot 3 jaar leer je zelfstandig werken in een beroep. Daarna kun je gaan werken of doorgaan naar niveau 4.',
  mbo4:
    'De middenkader- of specialistenopleiding. In 3 tot 4 jaar leer je zelfstandig werken en soms ook anderen aansturen. Daarna kun je gaan werken of doorgaan naar het hbo.',
  hbo:
    'Op de hogeschool leer je voor een beroep, bijvoorbeeld leraar, verpleegkundige of ingenieur. Je doet veel praktijkopdrachten en stages. Daarna kun je gaan werken of nog verder leren op de universiteit.',
  wo:
    'Op de universiteit leer je onderzoeken en theorie gebruiken. Je doet eerst een bachelor van meestal 3 jaar en vaak daarna een master. Hiermee word je bijvoorbeeld arts, jurist of wetenschapper.',
  werk:
    'Je gaat aan het werk, soms met begeleiding. Je kunt ook werken en tegelijk leren, bijvoorbeeld op een leerwerkplek.',
};

// Werk na het mbo, hbo of de universiteit heeft dezelfde uitleg.
for (const id of ['werk-mbo', 'werk-hbo', 'werk-wo']) {
  STANDAARD_OMSCHRIJVING[id] =
    'Met je diploma kun je gaan werken. Je hoeft dus niet altijd door te leren naar een volgend niveau. Later kun je altijd nog verder leren, bijvoorbeeld met een cursus of een nieuwe opleiding.';
}

// Niveaus waarvoor scholen worden getoond.
export const MET_SCHOLEN = ['pro', 'vmbo', 'vmbo-bbl', 'vmbo-kbl', 'vmbo-gl', 'vmbo-tl', 'havo', 'vwo', 'gymnasium'];

// Voorbeeldscholen, alleen zichtbaar zolang Supabase nog niet is gekoppeld.
export const DEMO_SCHOLEN = [
  { id: 'd1', naam: 'Voorbeeldschool Pr.o.', plaats: 'Heerlen', adres: '', website: '', niveaus: ['pro'] },
  { id: 'd2', naam: 'Voorbeeld Praktijkschool', plaats: 'Maastricht', adres: '', website: '', niveaus: ['pro', 'vmbo-bbl'] },
  { id: 'd3', naam: 'Voorbeeld Vakcollege', plaats: 'Sittard', adres: '', website: '', niveaus: ['vmbo-bbl', 'vmbo-kbl', 'vmbo-gl'] },
  { id: 'd4', naam: 'Voorbeeld Scholengemeenschap', plaats: 'Maastricht', adres: '', website: '', informatie: 'Open dag in januari.', tweetalig: true,
    brugklassen: [{ niveaus: ['vmbo-gl', 'vmbo-tl'], jaren: 1 }, { niveaus: ['havo', 'vwo'], jaren: 2 }], niveaus: ['vmbo-gl', 'vmbo-tl', 'havo', 'vwo'] },
  { id: 'd5', naam: 'Voorbeeld College', plaats: 'Heerlen', adres: '', website: '',
    brugklassen: [{ niveaus: ['vmbo-tl', 'havo'], jaren: 2 }], niveaus: ['vmbo-tl', 'havo', 'vwo'] },
  { id: 'd6', naam: 'Voorbeeld Lyceum', plaats: 'Kerkrade', adres: '', website: '', tweetalig: true, niveaus: ['havo', 'vwo'] },
  { id: 'd7', naam: 'Voorbeeld Atheneum', plaats: 'Geleen', adres: '', website: '', niveaus: ['vwo'] },
];

// ---------- Beroepen en routes ----------

// Waar je na de basisschool mee kunt beginnen.
export const START_OPTIES = ['pro', 'vmbo-bbl', 'vmbo-kbl', 'vmbo-gl', 'vmbo-tl', 'havo', 'vwo'];

// Welke stappen er direct na een onderdeel mogelijk zijn (volgens de pijlen in het schema).
export function volgendeStappen(id) {
  return [...new Set(PIJLEN.filter((p) => p.van === id).map((p) => p.naar))].filter((naar) => !naar.startsWith('werk-'));
}

// Hoekpunt van een blok, daar komt het stapnummer van een route.
export function hoekVan(id) {
  const blok = [...BLOKKEN, VMBO, MBO].find((b) => b.id === id);
  if (blok) return { x: blok.x, y: blok.y };
  const lw = LEERWEGEN.findIndex((l) => l.id === id);
  if (lw >= 0) return leerwegGeometrie(lw);
  const mbo = MBO_NIVEAUS.findIndex((n) => n.id === id);
  if (mbo >= 0) return mboGeometrie(mbo);
  return null;
}

// Voorbeeldberoepen, alleen zichtbaar zolang Supabase nog niet is gekoppeld.
export const DEMO_BEROEPEN = [
  {
    id: 'b1', naam: 'Kapper',
    omschrijving: 'Een kapper knipt, kleurt en stylt haar. Je leert dit vooral in de praktijk, op het mbo.',
    routes: [
      { id: 'r1', stappen: ['vmbo-bbl', 'mbo2'] },
      { id: 'r2', stappen: ['vmbo-kbl', 'mbo3'] },
      { id: 'r3', stappen: ['vmbo-tl', 'mbo4'] },
    ],
  },
  {
    id: 'b2', naam: 'Huisarts',
    omschrijving: 'Een huisarts is de dokter waar je als eerste naartoe gaat. Je studeert eerst geneeskunde op de universiteit en doet daarna nog een vervolgopleiding tot huisarts.',
    routes: [
      { id: 'r4', stappen: ['vwo', 'wo'] },
      { id: 'r5', stappen: ['havo', 'vwo', 'wo'] },
      { id: 'r6', stappen: ['vmbo-tl', 'havo', 'vwo', 'wo'] },
    ],
  },
];

// ---------- Brugklassen ----------

// Niveaus waaruit een (brede) brugklas kan bestaan, in vaste volgorde.
export const BRUGKLAS_NIVEAUS = ['vmbo-bbl', 'vmbo-kbl', 'vmbo-gl', 'vmbo-tl', 'havo', 'vwo', 'gymnasium'];

// Snelle keuzes voor veelvoorkomende combinaties.
export const BRUGKLAS_VOORBEELDEN = [
  ['vmbo-bbl', 'vmbo-kbl'],
  ['vmbo-kbl', 'vmbo-gl', 'vmbo-tl'],
  ['vmbo-gl', 'vmbo-tl'],
  ['vmbo-tl', 'havo'],
  ['havo', 'vwo'],
  ['vmbo-tl', 'havo', 'vwo'],
  ['vwo', 'gymnasium'],
];

const brugklasKort = (id) => (NIVEAU_INFO[id]?.kort || id).replace('vmbo ', '');

// Delen van een brugklas: de combinatie ("tl/havo") en bij een brede brugklas de duur ("2 jaar").
export function brugklasDelen(niveaus, jaren) {
  const volgorde = [...niveaus].sort((a, b) => BRUGKLAS_NIVEAUS.indexOf(a) - BRUGKLAS_NIVEAUS.indexOf(b));
  return { combinatie: volgorde.map(brugklasKort).join('/'), duur: niveaus.length > 1 ? `${jaren} jaar` : '' };
}

// Bijvoorbeeld "Brede brugklas tl/havo (2 jaar)" of "Brugklas vwo".
export function brugklasLabel(niveaus, jaren) {
  const { combinatie, duur } = brugklasDelen(niveaus, jaren);
  return duur ? `Brede brugklas ${combinatie} (${duur})` : `Brugklas ${combinatie}`;
}

// Volgorde waarin de niveaus van een school getoond worden.
export const SCHOOL_NIVEAU_VOLGORDE = ['pro', ...BRUGKLAS_NIVEAUS];

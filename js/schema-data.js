// De vorm van het doorstroomschema: blokken, pijlen en standaardteksten.
// De hoogte van de kolommen = aantal leerjaren (JAAR_PX per jaar, grondlijn op y = GROND_Y).
// Alle hoogtes zijn afgeleid van de constanten hieronder, zodat het schema met JAAR_PX meegroeit.

export const JAAR_PX = 108;

const RIJ_Y = 60; // bovenkant van de bovenste rij: werk, hbo, wo en de mbo-balk
const RIJ_H = 100; // hoogte van werk, hbo en wo
const MBO_H = 140; // hoogte van de mbo-balk
const PIJL_RUIMTE = 66; // ruimte voor de pijl tussen vwo en wo

export const GROND_Y = RIJ_Y + RIJ_H + PIJL_RUIMTE + 6 * JAAR_PX;
const jaarY = (jaren) => GROND_Y - jaren * JAAR_PX;

const BASIS_Y = GROND_Y + 16;
const BASIS_H = 66;

export const SCHEMA_VIEWBOX = [0, RIJ_Y - 46, 1230, BASIS_Y + BASIS_H + 14 - (RIJ_Y - 46)].join(' ');

// Elke route heeft een eigen kleur. Bewust geen kleurverloop van licht naar donker,
// zodat geen enkel blok "belangrijker" lijkt dan een ander.
export const KLEUREN = {
  basis: '#475569',
  pro: '#0f766e',
  vmbo: '#c2410c',
  havo: '#7c3aed',
  vwo: '#1d4ed8',
  mbo: '#15803d',
  hbo: '#be123c',
  wo: '#9d174d',
  werk: '#a16207',
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
    verlenging: { y: jaarY(6), h: JAAR_PX }, // gestippeld stuk: sommige leerlingen doen er een jaar langer over
    tekst: [['praktijk', jaarY(5) + 44, 22, true], ['onderwijs', jaarY(5) + 70, 22, true], ['5/6 jaar', jaarY(5) + 100, 16, false]] },
  { id: 'havo', kleur: KLEUREN.havo, x: 846, y: jaarY(5), w: 150, h: 5 * JAAR_PX,
    tekst: [['havo', jaarY(5) + 46, 30, true], ['5 jaar', jaarY(5) + 74, 16, false]] },
  { id: 'vwo', kleur: KLEUREN.vwo, x: 1050, y: jaarY(6), w: 150, h: 6 * JAAR_PX,
    tekst: [['vwo', jaarY(6) + 46, 30, true], ['6 jaar', jaarY(6) + 74, 16, false]] },
  { id: 'werk', kleur: KLEUREN.werk, x: 90, y: RIJ_Y, w: 140, h: RIJ_H,
    tekst: [['Werk', RIJ_Y + RIJ_H / 2 + 9, 28, true]] },
  { id: 'hbo', kleur: KLEUREN.hbo, x: 846, y: RIJ_Y, w: 150, h: RIJ_H,
    tekst: [['hbo', RIJ_Y + 50, 30, true], ['hogeschool', RIJ_Y + 76, 15, false]] },
  { id: 'wo', kleur: KLEUREN.wo, x: 1050, y: RIJ_Y, w: 150, h: RIJ_H,
    tekst: [['wo', RIJ_Y + 50, 30, true], ['universiteit', RIJ_Y + 76, 15, false]] },
];

const LEERWEG_Y = jaarY(4) + 14;
const LEERWEG_H = 152;

export const VMBO = { id: 'vmbo', kleur: KLEUREN.vmbo, x: VMBO_X, y: jaarY(4), w: 520, h: 4 * JAAR_PX,
  tekst: [['vmbo', LEERWEG_Y + LEERWEG_H + 56, 30, true], ['4 jaar', LEERWEG_Y + LEERWEG_H + 82, 16, false]] };

export const MBO = { id: 'mbo', kleur: KLEUREN.mbo, x: VMBO_X, y: RIJ_Y, w: 520, h: MBO_H,
  tekst: [['mbo', RIJ_Y + 30, 22, true]] };

export function leerwegGeometrie(i) {
  return { x: VMBO_X + 6 + LEERWEG_B * i, y: LEERWEG_Y, w: LEERWEG_B - 12, h: LEERWEG_H };
}
export function mboGeometrie(i) {
  return { x: VMBO_X + 6 + LEERWEG_B * i, y: RIJ_Y + 44, w: LEERWEG_B - 12, h: 86 };
}

// ---------- Pijlen ----------

const KOP = 6; // afstand tussen een blok en het begin of de punt van een pijl
const rijOnder = RIJ_Y + RIJ_H + KOP; // onderkant van werk, hbo en wo (+ ruimte)
const mboOnder = RIJ_Y + MBO_H + KOP;
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

// Hoogte waarop tl -> havo en havo -> vwo lopen: halverwege de leerweg-blokjes.
const zijY = LEERWEG_Y + LEERWEG_H / 2;

// van = blok waar de pijl uit komt, naar = blok waar je terechtkomt.
export const PIJLEN = [
  { van: 'pro', naar: 'werk', d: `M 160 ${jaarY(6) - KOP} L 160 ${rijOnder}` },
  { van: 'pro', naar: 'mbo1', d: `M 205 ${jaarY(6) - KOP} C 205 ${mboMidden}, 225 ${mboMidden}, 262 ${mboMidden}` },

  { van: 'vmbo-bbl', naar: 'mbo2', d: omhoog(335, 465) },
  { van: 'vmbo-kbl', naar: 'mbo3', d: omhoog(445, 575) },
  { van: 'vmbo-kbl', naar: 'mbo4', d: omhoog(485, 690) },
  { van: 'vmbo-gl', naar: 'mbo3', d: omhoog(590, 615) },
  { van: 'vmbo-gl', naar: 'mbo4', d: omhoog(625, 725) },
  { van: 'vmbo-tl', naar: 'mbo4', d: omhoog(735, 760) },
  { van: 'vmbo-tl', naar: 'havo', d: `M 794 ${zijY} C 816 ${zijY}, 826 ${zijY - 15}, 842 ${zijY - 15}` },

  { van: 'mbo1', naar: 'mbo2', d: boog(375, 425) },
  { van: 'mbo2', naar: 'mbo3', d: boog(505, 555) },
  { van: 'mbo3', naar: 'mbo4', d: boog(635, 685) },
  { van: 'mbo4', naar: 'hbo', d: `M 794 ${lijnY} L 842 ${lijnY}` },

  { van: 'havo', naar: 'mbo4', d: `M 880 ${jaarY(5) - KOP} C 880 ${jaarY(5) - KOP - 0.66 * (jaarY(5) - KOP - mboMidden)}, 850 ${mboMidden}, 797 ${mboMidden}` },
  { van: 'havo', naar: 'hbo', d: `M 940 ${jaarY(5) - KOP} L 940 ${rijOnder}` },
  { van: 'havo', naar: 'vwo', d: `M 1000 ${zijY} C 1018 ${zijY}, 1030 ${zijY - 15}, 1046 ${zijY - 15}` },

  { van: 'vwo', naar: 'hbo', d: `M 1075 ${jaarY(6) - KOP} C 1075 ${jaarY(6) - 36}, 1000 ${jaarY(6) - 31}, 980 ${rijOnder}` },
  { van: 'vwo', naar: 'wo', d: `M 1125 ${jaarY(6) - KOP} L 1125 ${rijOnder}` },
  { van: 'hbo', naar: 'wo', d: `M 1000 ${lijnY} L 1044 ${lijnY}` },
];

// Groepen: klik je op het vmbo of de mbo-balk, dan tellen de onderdelen mee.
export const GROEPEN = {
  vmbo: ['vmbo-bbl', 'vmbo-kbl', 'vmbo-gl', 'vmbo-tl'],
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
  mbo: { naam: 'Mbo', kort: 'mbo', duur: '1 tot 4 jaar', kleur: KLEUREN.mbo },
  mbo1: { naam: 'Mbo niveau 1', kort: 'mbo niveau 1', duur: 'ongeveer 1 jaar', kleur: KLEUREN.mbo },
  mbo2: { naam: 'Mbo niveau 2', kort: 'mbo niveau 2', duur: 'ongeveer 2 jaar', kleur: KLEUREN.mbo },
  mbo3: { naam: 'Mbo niveau 3', kort: 'mbo niveau 3', duur: '2 tot 3 jaar', kleur: KLEUREN.mbo },
  mbo4: { naam: 'Mbo niveau 4', kort: 'mbo niveau 4', duur: '3 tot 4 jaar', kleur: KLEUREN.mbo },
  hbo: { naam: 'Hbo (hogeschool)', kort: 'hbo', duur: 'meestal 4 jaar', kleur: KLEUREN.hbo },
  wo: { naam: 'Wo (universiteit)', kort: 'wo', duur: 'bachelor 3 jaar + master', kleur: KLEUREN.wo },
  werk: { naam: 'Werk', kort: 'werk', duur: '', kleur: KLEUREN.werk },
};

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
    'De theoretische leerweg, vroeger mavo genoemd: je leert vooral uit boeken en met opdrachten. Daarna ga je naar mbo niveau 4 of naar de havo.',
  havo:
    'De havo duurt 5 jaar. Je volgt algemene vakken en leert veel zelf plannen en uitzoeken. Daarna kun je naar het hbo, naar mbo niveau 4 of doorstromen naar het vwo.',
  vwo:
    'Het vwo duurt 6 jaar. Je volgt algemene vakken en leert veel over onderzoeken en uitzoeken. Op het gymnasium leer je ook Latijn en Grieks. Daarna kun je naar de universiteit of naar het hbo.',
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

// Niveaus waarvoor scholen worden getoond.
export const MET_SCHOLEN = ['pro', 'vmbo', 'vmbo-bbl', 'vmbo-kbl', 'vmbo-gl', 'vmbo-tl', 'havo', 'vwo'];

// Voorbeeldscholen, alleen zichtbaar zolang Supabase nog niet is gekoppeld.
export const DEMO_SCHOLEN = [
  { id: 'd1', naam: 'Voorbeeldschool Pr.o.', plaats: 'Heerlen', adres: '', website: '', niveaus: ['pro'] },
  { id: 'd2', naam: 'Voorbeeld Praktijkschool', plaats: 'Maastricht', adres: '', website: '', niveaus: ['pro', 'vmbo-bbl'] },
  { id: 'd3', naam: 'Voorbeeld Vakcollege', plaats: 'Sittard', adres: '', website: '', niveaus: ['vmbo-bbl', 'vmbo-kbl', 'vmbo-gl'] },
  { id: 'd4', naam: 'Voorbeeld Scholengemeenschap', plaats: 'Maastricht', adres: '', website: '', niveaus: ['vmbo-gl', 'vmbo-tl', 'havo', 'vwo'] },
  { id: 'd5', naam: 'Voorbeeld College', plaats: 'Heerlen', adres: '', website: '', niveaus: ['vmbo-tl', 'havo', 'vwo'] },
  { id: 'd6', naam: 'Voorbeeld Lyceum', plaats: 'Kerkrade', adres: '', website: '', niveaus: ['havo', 'vwo'] },
  { id: 'd7', naam: 'Voorbeeld Atheneum', plaats: 'Geleen', adres: '', website: '', niveaus: ['vwo'] },
];

// ---------- Beroepen en routes ----------

// Waar je na de basisschool mee kunt beginnen.
export const START_OPTIES = ['pro', 'vmbo-bbl', 'vmbo-kbl', 'vmbo-gl', 'vmbo-tl', 'havo', 'vwo'];

// Welke stappen er direct na een onderdeel mogelijk zijn (volgens de pijlen in het schema).
export function volgendeStappen(id) {
  return [...new Set(PIJLEN.filter((p) => p.van === id).map((p) => p.naar))];
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

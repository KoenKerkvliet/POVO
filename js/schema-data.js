// De vorm van het doorstroomschema: blokken, pijlen en standaardteksten.
// Coördinaten horen bij de viewBox van het SVG (0 90 1230 710).
// De hoogte van de kolommen = aantal leerjaren (64 px per jaar, grondlijn op y = 700).

export const JAAR_PX = 64;
export const GROND_Y = 700;

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
  { id: 'basisschool', kleur: KLEUREN.basis, x: 90, y: 716, w: 1110, h: 66,
    tekst: [['basisschool', 746, 26, true], ['8 jaar', 770, 16, false]] },
  { id: 'pro', kleur: KLEUREN.pro, x: 90, y: 380, w: 140, h: 320,
    verlenging: { y: 316, h: 64 }, // gestippeld stuk: sommige leerlingen doen er een jaar langer over
    tekst: [['praktijk', 424, 22, true], ['onderwijs', 450, 22, true], ['5/6 jaar', 480, 16, false]] },
  { id: 'havo', kleur: KLEUREN.havo, x: 846, y: 380, w: 150, h: 320,
    tekst: [['havo', 426, 30, true], ['5 jaar', 454, 16, false]] },
  { id: 'vwo', kleur: KLEUREN.vwo, x: 1050, y: 316, w: 150, h: 384,
    tekst: [['vwo', 362, 30, true], ['6 jaar', 390, 16, false]] },
  { id: 'werk', kleur: KLEUREN.werk, x: 90, y: 150, w: 140, h: 100,
    tekst: [['Werk of', 196, 22, true], ['Werken', 222, 22, true]] },
  { id: 'hbo', kleur: KLEUREN.hbo, x: 846, y: 150, w: 150, h: 100,
    tekst: [['hbo', 200, 30, true], ['hogeschool', 226, 15, false]] },
  { id: 'wo', kleur: KLEUREN.wo, x: 1050, y: 150, w: 150, h: 100,
    tekst: [['wo', 200, 30, true], ['universiteit', 226, 15, false]] },
];

export const VMBO = { id: 'vmbo', kleur: KLEUREN.vmbo, x: VMBO_X, y: 444, w: 520, h: 256,
  tekst: [['vmbo', 656, 30, true], ['4 jaar', 682, 16, false]] };

export const MBO = { id: 'mbo', kleur: KLEUREN.mbo, x: VMBO_X, y: 150, w: 520, h: 140,
  tekst: [['mbo', 180, 22, true]] };

export function leerwegGeometrie(i) {
  return { x: VMBO_X + 6 + LEERWEG_B * i, y: 458, w: LEERWEG_B - 12, h: 152 };
}
export function mboGeometrie(i) {
  return { x: VMBO_X + 6 + LEERWEG_B * i, y: 194, w: LEERWEG_B - 12, h: 86 };
}

// Hulp: gebogen pijl omhoog van het vmbo naar de mbo-balk.
const omhoog = (van, naar) => `M ${van} 438 C ${van} 380, ${naar} 352, ${naar} 296`;
// Hulp: kleine boog boven de mbo-balk (van niveau n naar n+1).
const boog = (van, naar) => `M ${van} 146 C ${van + 3} 110, ${naar - 3} 110, ${naar} 146`;

// van = blok waar de pijl uit komt, naar = blok waar je terechtkomt.
export const PIJLEN = [
  { van: 'pro', naar: 'werk', d: 'M 160 310 L 160 256' },
  { van: 'pro', naar: 'mbo1', d: 'M 205 310 C 205 262, 225 262, 262 262' },

  { van: 'vmbo-bbl', naar: 'mbo2', d: omhoog(335, 465) },
  { van: 'vmbo-kbl', naar: 'mbo3', d: omhoog(445, 575) },
  { van: 'vmbo-kbl', naar: 'mbo4', d: omhoog(485, 690) },
  { van: 'vmbo-gl', naar: 'mbo3', d: omhoog(590, 615) },
  { van: 'vmbo-gl', naar: 'mbo4', d: omhoog(625, 725) },
  { van: 'vmbo-tl', naar: 'mbo4', d: omhoog(735, 760) },
  { van: 'vmbo-tl', naar: 'havo', d: 'M 794 520 C 816 520, 826 505, 842 505' },

  { van: 'mbo1', naar: 'mbo2', d: boog(375, 425) },
  { van: 'mbo2', naar: 'mbo3', d: boog(505, 555) },
  { van: 'mbo3', naar: 'mbo4', d: boog(635, 685) },
  { van: 'mbo4', naar: 'hbo', d: 'M 794 200 L 842 200' },

  { van: 'havo', naar: 'mbo4', d: 'M 880 374 C 880 300, 850 262, 797 262' },
  { van: 'havo', naar: 'hbo', d: 'M 940 374 L 940 256' },
  { van: 'havo', naar: 'vwo', d: 'M 1000 520 C 1018 520, 1030 505, 1046 505' },

  { van: 'vwo', naar: 'hbo', d: 'M 1075 310 C 1075 280, 1000 285, 980 256' },
  { van: 'vwo', naar: 'wo', d: 'M 1125 310 L 1125 256' },
  { van: 'hbo', naar: 'wo', d: 'M 1000 200 L 1044 200' },
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
  werk: { naam: 'Werk of Werken', kort: 'Werk of Werken', duur: '', kleur: KLEUREN.werk },
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

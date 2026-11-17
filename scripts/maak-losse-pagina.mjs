// Maakt van de hele site één los html-bestand: losse-versie/na-de-basisschool.html
//
// Gebruik (in de projectmap, Node 18 of nieuwer):   node scripts/maak-losse-pagina.mjs
//
// Wat er gebeurt:
//  1. De scholen, beroepen en brugklassen worden uit Supabase gehaald en als reserve in het bestand gebakken.
//  2. De code, de opmaak, de lettertypen en de plaatjes worden in het bestand gezet (geen andere bestanden nodig).
//  3. Het losse bestand probeert bij het openen eerst de actuele gegevens uit Supabase te halen.
//     Lukt dat niet (bijvoorbeeld zonder internet), dan gebruikt het de ingebakken gegevens en zegt dat erbij.

import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lees = (p) => readFile(path.join(root, p), 'utf8');
const base64 = async (p) => (await readFile(path.join(root, p))).toString('base64');

// ---------- 1. Actuele gegevens ophalen (dezelfde code als de website) ----------

const { laadGegevens } = await import(pathToFileURL(path.join(root, 'js/data.js')).href);
const live = await laadGegevens();
if (live.demo) {
  throw new Error('Supabase is niet gekoppeld (js/config.js heeft geen sleutel). Er zijn geen echte gegevens om in te bakken.');
}
const momentopname = {
  scholen: live.scholen,
  beroepen: live.beroepen,
  omschrijvingen: live.omschrijvingen,
  gemaaktOp: new Date().toISOString(),
};

// ---------- 2. De code bundelen tot één script ----------

const volgorde = ['config', 'schema-data', 'dom', 'data', 'app'];
const namen = new Map();
const delen = {};

for (const naam of volgorde) {
  let code = await lees(`js/${naam}.js`);
  // imports weg (alles staat straks in één script) en export-woorden weg
  code = code.replace(/^import[\s\S]*?\sfrom\s+['"][^'"]+['"];?[ \t]*\r?\n/gm, '');
  code = code.replace(/^export\s+(async\s+function|function|const|let|class)\s/gm, '$1 ');
  if (/^(import|export)\s/m.test(code)) throw new Error(`js/${naam}.js heeft een import of export die dit script niet kent.`);

  // alles staat straks in één bereik: dezelfde naam in twee bestanden zou botsen
  for (const m of code.matchAll(/^(?:async\s+function|function|const|let|class)\s+([A-Za-z_$][\w$]*)/gm)) {
    if (namen.has(m[1])) throw new Error(`De naam "${m[1]}" staat zowel in js/${namen.get(m[1])}.js als in js/${naam}.js.`);
    namen.set(m[1], naam);
  }
  delen[naam] = code;
}

// De website haalt altijd live gegevens op. Het losse bestand doet dat ook, maar valt terug op de ingebakken gegevens.
if (!delen.data.includes('async function laadGegevens()')) throw new Error('js/data.js heeft geen laadGegevens() meer.');
delen.data = delen.data.replace('async function laadGegevens()', 'async function laadLive()') + `
// ---- alleen in het losse bestand: terugvallen op de ingebakken gegevens ----
const MOMENTOPNAME = ${JSON.stringify(momentopname)};

async function laadGegevens() {
  try {
    return await Promise.race([
      laadLive(),
      new Promise((_, mislukt) => setTimeout(() => mislukt(new Error('te langzaam')), 8000)),
    ]);
  } catch {
    return {
      scholen: MOMENTOPNAME.scholen,
      beroepen: MOMENTOPNAME.beroepen,
      omschrijvingen: MOMENTOPNAME.omschrijvingen,
      demo: false,
      momentopname: MOMENTOPNAME.gemaaktOp,
    };
  }
}
`;

let script = volgorde.map((n) => `// ---- ${n}.js ----\n${delen[n]}`).join('\n');

// Plaatjes: elke verwijzing naar img/xxx.webp wordt een verwijzing naar de ingebakken afbeelding.
const beeldBestanden = (await readdir(path.join(root, 'img'))).filter((f) => f.endsWith('.webp'));
const beeldData = {};
for (const f of beeldBestanden) beeldData[`img/${f}`] = `data:image/webp;base64,${await base64(`img/${f}`)}`;
script = script.replace(/(['"])img\/([\w.-]+\.webp)\1/g, (_, __, f) => `BEELD_DATA['img/${f}']`);
script = `'use strict';\nconst BEELD_DATA = ${JSON.stringify(beeldData)};\n${script}`;
if (script.includes('</script')) throw new Error('Het script bevat "</script", dat kan niet in een html-bestand.');
if (/\.\/(config|data|dom|schema-data|app)\.js/.test(script)) throw new Error('Er staat nog een verwijzing naar een los scriptbestand in het bundel.');

// ---------- 3. Opmaak met ingebakken lettertypen ----------

let fontsCss = await lees('css/fonts.css');
for (const m of [...fontsCss.matchAll(/url\(\.\.\/fonts\/([\w.-]+)\)/g)]) {
  fontsCss = fontsCss.replace(m[0], `url(data:font/woff2;base64,${await base64(`fonts/${m[1]}`)})`);
}
const css = fontsCss + '\n' + (await lees('css/style.css'));
if (/url\((?!data:|#)/.test(css)) throw new Error('De opmaak verwijst nog naar een los bestand.');

// ---------- 4. De pagina zelf ----------

let html = await lees('index.html');
const datum = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(momentopname.gemaaktOp));

html = html
  .replace(/\s*<link rel="(icon|apple-touch-icon)"[^>]*>/g, '')
  .replace(/\s*<link rel="stylesheet"[^>]*>/g, '')
  .replace('</head>', `  <link rel="icon" type="image/png" href="data:image/png;base64,${await base64('icons/icon-32.png')}">\n  <style>\n${css}\n  </style>\n</head>`)
  .replace(/<script type="module" src="js\/app\.js"><\/script>/, () => `<script>\n(() => {\n${script}\n})();\n</script>`)
  .replace(/<p class="info-voet">[\s\S]*?<\/p>/, `<p class="info-voet">Losse versie, gemaakt op ${datum}</p>`);

if (html.includes('src="js/') || html.includes('href="css/') || html.includes('href="icons/') || html.includes('beheer.html')) {
  throw new Error('Het resultaat verwijst nog naar een los bestand.');
}

await mkdir(path.join(root, 'losse-versie'), { recursive: true });
const uit = path.join(root, 'losse-versie', 'na-de-basisschool.html');
await writeFile(uit, html, 'utf8');

console.log(`Klaar: ${path.relative(root, uit)} (${Math.round(html.length / 1024)} KB)`);
console.log(`Ingebakken gegevens van ${datum}: ${momentopname.scholen.length} scholen, ${momentopname.beroepen.length} beroepen.`);

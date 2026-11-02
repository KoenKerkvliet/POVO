// Kleine hulpjes om HTML/SVG te maken zonder innerHTML (voorkomt dat ingevoerde tekst als code wordt gelezen).

const SVG_NS = 'http://www.w3.org/2000/svg';

function vul(el, attrs, kinderen) {
  for (const [naam, waarde] of Object.entries(attrs || {})) {
    if (waarde === false || waarde == null) continue;
    if (naam === 'class') el.setAttribute('class', waarde);
    else if (naam.startsWith('on') && typeof waarde === 'function') el.addEventListener(naam.slice(2), waarde);
    else el.setAttribute(naam, waarde === true ? '' : waarde);
  }
  for (const kind of kinderen.flat()) {
    if (kind == null || kind === false) continue;
    el.append(kind.nodeType ? kind : document.createTextNode(String(kind)));
  }
  return el;
}

export const h = (tag, attrs, ...kinderen) => vul(document.createElement(tag), attrs, kinderen);
export const svg = (tag, attrs, ...kinderen) => vul(document.createElementNS(SVG_NS, tag), attrs, kinderen);

// Alleen http(s)-adressen toestaan als link.
export function veiligeUrl(tekst) {
  if (!tekst) return '';
  const met = /^https?:\/\//i.test(tekst) ? tekst : `https://${tekst}`;
  try {
    const url = new URL(met);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

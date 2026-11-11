/**
 * actualite.mjs — récolte l'actualité du moment et en tire des questions.
 *
 * Lancé à chaque publication du hub (toutes les 3 heures environ) :
 *   node scripts/actualite.mjs dist
 * Écrit dist/actu.json, lu par la page.
 *
 * Règles :
 *  - sources publiques et variées (franceinfo, Google Actualités : recherches
 *    par thème et par région) ; chaque sujet garde le lien vers son article ;
 *  - on écarte les faits divers, le sport, les jeux, la météo ;
 *  - la question posée est neutre et ne reprend jamais d'opinion : elle
 *    demande l'importance du sujet, l'avis sur une mesure, ou le soutien à un
 *    mouvement — toujours avec « Je ne sais pas » ou « Sans avis » ;
 *  - aucune donnée inventée : si rien n'a pu être récolté, la liste est vide
 *    et la page le dit.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const sortie = path.resolve(process.argv[2] ?? 'dist');
const reperes = JSON.parse(await readFile(new URL('../src/revolution/reperes.json', import.meta.url), 'utf8'));

const AGE_MAX_H = 72;
const MAX_SUJETS = 140;
const PAR_FLUX = 12;

const gn = (q) => `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=fr&gl=FR&ceid=FR:fr`;

/** Flux nationaux : service public d'information + recherches par grand thème civique. */
const FLUX_NATIONAUX = [
  { nom: 'franceinfo', url: 'https://www.francetvinfo.fr/titres.rss' },
  { nom: 'franceinfo — politique', url: 'https://www.francetvinfo.fr/politique.rss' },
  { nom: 'franceinfo — économie', url: 'https://www.francetvinfo.fr/economie.rss' },
  { nom: 'franceinfo — société', url: 'https://www.francetvinfo.fr/societe.rss' },
  { nom: 'franceinfo — santé', url: 'https://www.francetvinfo.fr/sante.rss' },
  { nom: 'Actualités — lois en débat', url: gn('"projet de loi" OR "proposition de loi" when:3d') },
  { nom: 'Actualités — Assemblée et Sénat', url: gn('(Assemblée nationale OR Sénat) vote when:3d') },
  { nom: 'Actualités — syndicats', url: gn('syndicats OR intersyndicale OR grève when:3d') },
  { nom: 'Actualités — salaires et emploi', url: gn('salaires OR emploi OR chômage when:3d') },
  { nom: 'Actualités — prix', url: gn('prix OR inflation OR "pouvoir d\'achat" when:3d') },
  { nom: 'Actualités — santé', url: gn('hôpital OR "assurance maladie" OR médecins when:3d') },
  { nom: 'Actualités — logement', url: gn('logement OR loyers OR HLM when:3d') },
  { nom: 'Actualités — école', url: gn('école OR enseignants OR "éducation nationale" when:3d') },
  { nom: 'Actualités — retraites', url: gn('retraites OR pensions when:3d') },
  { nom: 'Actualités — transports', url: gn('SNCF OR transports OR autoroutes when:3d') },
  { nom: 'Actualités — environnement', url: gn('climat OR pollution OR sécheresse when:3d') },
  { nom: 'Actualités — agriculture', url: gn('agriculteurs OR éleveurs when:3d') },
  { nom: 'Actualités — services publics', url: gn('"services publics" OR "La Poste" OR "fermeture de classe" when:3d') },
  { nom: 'Actualités — budget', url: gn('budget OR impôts OR "loi de finances" when:3d') },
];

/** Un flux par région : l'actualité locale, rattachée d'office à sa région. */
const FLUX_REGIONAUX = reperes.regions.map((r) => ({
  nom: `Actualités — ${r.nom}`,
  url: gn(`"${r.nom}" when:3d`),
  region: r.id,
}));

/* ------------------------------------------------------------------------ */

const normaliser = (t) =>
  String(t ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’`]/g, "'")
    .toLowerCase();

const echapRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const motifs = new Map();
function contient(texteNormalise, mot) {
  let re = motifs.get(mot);
  if (!re) {
    re = new RegExp(`(^|[^a-z0-9-])${echapRe(mot)}([^a-z0-9-]|$)`);
    motifs.set(mot, re);
  }
  return re.test(texteNormalise);
}

const ENTITES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', laquo: '«', raquo: '»', rsquo: '’', lsquo: '‘', hellip: '…', eacute: 'é', egrave: 'è', agrave: 'à', ccedil: 'ç', ecirc: 'ê', ocirc: 'ô', icirc: 'î', ucirc: 'û' };
function decoder(t) {
  return String(t ?? '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, e) => ENTITES[e.toLowerCase()] ?? m);
}
const sansBalises = (t) => decoder(decoder(t)).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

function balise(bloc, nom) {
  const m = bloc.match(new RegExp(`<${nom}(?:\\s[^>]*)?>([\\s\\S]*?)</${nom}>`, 'i'));
  return m ? m[1] : '';
}

function lireFlux(xml, flux) {
  const items = [];
  for (const m of xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)) {
    const bloc = m[0];
    let titre = sansBalises(balise(bloc, 'title'));
    let source = sansBalises(balise(bloc, 'source'));
    // Google Actualités : « Titre - Nom du journal ».
    if (flux.url.includes('news.google.com')) {
      const morceaux = titre.split(/\s+[-–—]\s+/);
      if (morceaux.length > 1 && morceaux[morceaux.length - 1].length <= 60) {
        source ||= morceaux[morceaux.length - 1];
        titre = morceaux.slice(0, -1).join(' - ');
      }
    }
    const domaine = (bloc.match(/<source[^>]*url="https?:\/\/([^"/]+)/i)?.[1] ?? '').toLowerCase();
    const lien = sansBalises(balise(bloc, 'link')) || (bloc.match(/<link[^>]*href="([^"]+)"/i)?.[1] ?? '');
    const date = new Date(sansBalises(balise(bloc, 'pubDate')) || sansBalises(balise(bloc, 'dc:date')));
    let resume = sansBalises(balise(bloc, 'description'));
    // Le résumé de Google Actualités ne fait que répéter le titre : on l'ignore.
    if (flux.url.includes('news.google.com') || normaliser(resume).startsWith(normaliser(titre).slice(0, 40))) resume = '';
    if (!titre || !/^https?:\/\//.test(lien) || Number.isNaN(date.getTime())) continue;
    items.push({
      titre: titre.slice(0, 220),
      source: (source || flux.nom.split(' — ')[0]).slice(0, 60),
      lien: lien.slice(0, 600),
      date: date.toISOString(),
      resume: resume.length > 280 ? `${resume.slice(0, 277).replace(/\s+\S*$/, '')}…` : resume,
      regionFlux: flux.region ?? null,
      fiable: !flux.url.includes('news.google.com') || sourceFiable(domaine),
    });
  }
  return items;
}

async function telecharger(flux) {
  try {
    const r = await fetch(flux.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Revolution-Alphabette/1.0; +https://revolution.alphabette.fr)' },
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) return { flux, ok: false, items: [], erreur: `HTTP ${r.status}` };
    const items = lireFlux(await r.text(), flux);
    return { flux, ok: true, items };
  } catch (err) {
    return { flux, ok: false, items: [], erreur: err.message.slice(0, 80) };
  }
}

async function enParallele(liste, n, travail) {
  const resultats = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < liste.length) {
        const k = i++;
        resultats[k] = await travail(liste[k]);
      }
    }),
  );
  return resultats;
}

function empreinte(texte) {
  let h = 2166136261;
  for (const c of texte) {
    h ^= c.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

const DOMAINES = reperes.sources.domaines;
function sourceFiable(domaine) {
  return Boolean(domaine) && DOMAINES.some((d) => domaine === d || domaine.endsWith(`.${d}`));
}

// Racines de 5 lettres : « baisse » et « baisser », « bloquer » et « blocage » se rapprochent.
const motsDe = (t) => new Set(normaliser(t).split(/[^a-z0-9]+/).filter((m) => m.length > 3).map((m) => m.slice(0, 5)));
function proches(a, b) {
  let commun = 0;
  for (const m of a) if (b.has(m)) commun += 1;
  return commun >= 3 || commun / Math.max(1, Math.min(a.size, b.size)) >= 0.6;
}

/* ------------------------------------------------------------------------ */

const flux = [...FLUX_NATIONAUX, ...FLUX_REGIONAUX];
const recolte = await enParallele(flux, 6, telecharger);
const limite = Date.now() - AGE_MAX_H * 3600_000;

const retenus = [];
for (const { items, flux: f } of recolte) {
  const recents = items
    .filter((it) => new Date(it.date).getTime() >= limite && new Date(it.date).getTime() <= Date.now() + 3600_000)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, f.region ? 8 : PAR_FLUX);

  for (const it of recents) {
    const n = normaliser(`${it.titre} ${it.resume}`);
    const nt = normaliser(it.titre);
    if (!it.fiable) continue;
    if (reperes.exclus.some((m) => contient(nt, m))) continue;

    const themes = reperes.themes.filter((t) => t.mots.some((m) => contient(n, m))).map((t) => t.id);
    const regionsTrouvees = reperes.regions.filter((r) => r.mots.some((m) => contient(n, m))).map((r) => r.id);
    // Un sujet régional doit vraiment parler de sa région (nom, ville ou département dans le texte).
    if (it.regionFlux && !regionsTrouvees.includes(it.regionFlux)) continue;
    const region = it.regionFlux ?? (regionsTrouvees.length === 1 ? regionsTrouvees[0] : null);
    // Seuls les sujets de vie publique sont retenus : au moins un thème civique reconnu.
    if (themes.length === 0) continue;

    const type = contient(nt, 'greve') || reperes.types.mobilisation.mots.some((m) => contient(nt, m))
      ? 'mobilisation'
      : reperes.types.mesure.mots.some((m) => contient(nt, m))
        ? 'mesure'
        : 'importance';

    const candidat = { ...it, themes, region, type, mots: motsDe(it.titre) };
    const doublon = retenus.find((r) => proches(r.mots, candidat.mots));
    if (doublon) {
      // On garde la version la plus récente, et l'on fusionne ce qu'on sait.
      doublon.themes = [...new Set([...doublon.themes, ...themes])];
      doublon.region ??= region;
      continue;
    }
    retenus.push(candidat);
  }
}

const parRegion = new Map();
const sujets = retenus
  .sort((a, b) => b.date.localeCompare(a.date))
  .filter((s) => {
    if (!s.region) return true;
    const n = (parRegion.get(s.region) ?? 0) + 1;
    parRegion.set(s.region, n);
    return n <= 6;
  })
  .slice(0, MAX_SUJETS)
  .map(({ mots: _m, regionFlux: _r, fiable: _f, ...s }) => ({
    id: `actu_${empreinte(normaliser(s.titre))}`,
    ...s,
    question: reperes.types[s.type].question,
    choix: reperes.types[s.type].choix,
  }));

const resultat = {
  genereLe: new Date().toISOString(),
  sources: recolte.map((r) => ({ nom: r.flux.nom, ok: r.ok, nb: r.items.length, ...(r.erreur ? { erreur: r.erreur } : {}) })),
  sujets,
};

await mkdir(sortie, { recursive: true });
await writeFile(path.join(sortie, 'actu.json'), JSON.stringify(resultat) + '\n');
const okFlux = recolte.filter((r) => r.ok).length;
console.log(`actualité : ${sujets.length} sujets retenus — ${okFlux}/${recolte.length} flux lus.`);
for (const r of recolte.filter((x) => !x.ok)) console.warn(`! ${r.flux.nom} : ${r.erreur}`);
// Échantillon lisible dans le journal de publication, pour vérifier la qualité des questions.
for (const s of sujets.slice(0, 40)) {
  console.log(`  · [${s.type}] ${s.region ?? 'national'} | ${s.themes.join(',') || '-'} | ${s.source} | ${s.titre}`);
}

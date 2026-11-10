import reperes from './reperes.json';
import type { Actu, EtatLocal, Profil, SujetActu } from './types';

export const THEMES = reperes.themes as { id: string; nom: string; emoji: string; mots: string[] }[];
export const REGIONS = reperes.regions as { id: string; nom: string; mots: string[] }[];
export const AUTEURS = reperes.auteurs as { id: string; nom: string; emoji: string }[];

export const theme = (id: string) => THEMES.find((t) => t.id === id);
export const nomRegion = (id: string | null) =>
  id === 'national' || !id ? 'Toute la France' : (REGIONS.find((r) => r.id === id)?.nom ?? id);
export const auteur = (id: string) => AUTEURS.find((a) => a.id === id) ?? AUTEURS[3];

/* ------------------------------------------------------------------------ */
/* L'état local : tout ce qui reste sur cet appareil.                        */
/* ------------------------------------------------------------------------ */

const CLE = 'revolution.v2';

export const ETAT_VIDE: EtatLocal = {
  profil: { region: null, themes: [] },
  reponses: {},
  brouillons: [],
  publiees: [],
  bienvenueVue: false,
};

export function lireEtat(): EtatLocal {
  try {
    const brut = localStorage.getItem(CLE);
    if (!brut) return ETAT_VIDE;
    const e = JSON.parse(brut) as Partial<EtatLocal>;
    return { ...ETAT_VIDE, ...e, profil: { ...ETAT_VIDE.profil, ...(e.profil ?? {}) } };
  } catch {
    return ETAT_VIDE;
  }
}

export function ecrireEtat(e: EtatLocal) {
  try {
    localStorage.setItem(CLE, JSON.stringify(e));
  } catch {
    /* mode privé : l'état vit le temps de la visite. */
  }
}

/** Efface les données de l'ancien prototype (votes simulés) restées dans le navigateur. */
export function effacerAncienPrototype() {
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith('revolution') && k !== CLE) localStorage.removeItem(k);
    }
  } catch {
    /* rien à faire */
  }
}

/* ------------------------------------------------------------------------ */
/* L'actualité du moment.                                                    */
/* ------------------------------------------------------------------------ */

export async function chargerActu(): Promise<Actu | null> {
  try {
    const r = await fetch(`./actu.json?t=${Math.floor(Date.now() / 600_000)}`, { cache: 'no-store' });
    if (!r.ok) return null;
    return (await r.json()) as Actu;
  } catch {
    return null;
  }
}

/**
 * L'ordre « à ce moment-là, pour toi » : ta région d'abord, puis tes thèmes,
 * puis la fraîcheur. Ce que tu as déjà répondu passe en dessous.
 */
export function classer(sujets: SujetActu[], profil: Profil, reponses: EtatLocal['reponses'], maintenant = Date.now()) {
  return sujets
    .map((s) => {
      const ageH = Math.max(0, (maintenant - new Date(s.date).getTime()) / 3600_000);
      let score = 10 - Math.min(10, ageH / 3);
      if (profil.region && s.region === profil.region) score += 12;
      else if (profil.region && s.region && s.region !== profil.region) score -= 8;
      const communs = s.themes.filter((t) => profil.themes.includes(t)).length;
      score += communs * 6;
      if (profil.themes.length && communs === 0) score -= 3;
      if (reponses[s.id]) score -= 100;
      return { s, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.s);
}

export function momentDuJour(d = new Date()): string {
  const h = d.getHours();
  if (h < 6) return 'Cette nuit';
  if (h < 12) return 'Ce matin';
  if (h < 18) return 'Cet après-midi';
  return 'Ce soir';
}

export function ilYa(iso: string): string {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (min < 1) return 'à l’instant';
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.round(h / 24);
  return `il y a ${j} jour${j > 1 ? 's' : ''}`;
}

export const nombre = (n: number) => n.toLocaleString('fr-FR');

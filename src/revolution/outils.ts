import { categorie, devinerCategorie, type CategorieId, type ModeleQuestion } from './categories';
import { cartePourquoi } from './education';
import type { ChoixVote, Question } from './types';

/* ==========================================================================
   Petits outils : dérivation des questions, ressemblance, formats, et le
   générateur pseudo-aléatoire stable qui sert aux résultats par région.
   ========================================================================== */

/** Normalise un texte pour la comparaison (sans accents, sans ponctuation). */
export function normaliser(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Coefficient de Dice sur les bigrammes de caractères (0 → 1). */
export function ressemblance(a: string, b: string): number {
  const x = normaliser(a);
  const y = normaliser(b);
  if (x === y) return 1;
  if (x.length < 2 || y.length < 2) return 0;

  const paires = (t: string) => {
    const out: string[] = [];
    for (let i = 0; i < t.length - 1; i += 1) out.push(t.slice(i, i + 2));
    return out;
  };

  const gauche = paires(x);
  const droite = paires(y);
  const restants = [...droite];
  let communs = 0;
  for (const p of gauche) {
    const i = restants.indexOf(p);
    if (i >= 0) {
      communs += 1;
      restants.splice(i, 1);
    }
  }
  return (2 * communs) / (gauche.length + droite.length);
}

/** Nom court affiché sur la tuile, déduit du problème (jamais saisi à la main). */
export function nomDepuisProbleme(texte: string): string {
  const propre = texte.replace(/\s+/g, ' ').trim().replace(/^(dans|il y a|les|le|la|en france|partout)\s+/i, '');
  const mots = propre.split(' ').slice(0, 6).join(' ');
  const court = mots.length > 46 ? `${mots.slice(0, 43).trimEnd()}…` : mots;
  const premier = court.charAt(0).toUpperCase() + court.slice(1);
  return premier.replace(/[.,;:!?]+$/, '');
}

/** Catégorie probable + nom court, à partir du seul texte du problème. */
export function analyseProbleme(probleme: string): { categorie: CategorieId; nom: string } {
  return { categorie: devinerCategorie(probleme), nom: nomDepuisProbleme(probleme) };
}

/**
 * La dérivation automatique : 5 questions du schéma « Voulez-vous [solution] ? »
 * sont tirées des modèles de la catégorie. Aucune question n'est écrite par
 * le citoyen, qui ne décrit que le problème.
 */
export function deriverQuestions(sujetId: string, probleme: string, cat: CategorieId): Question[] {
  const modele = categorie(cat);
  const regionalise = /r[ée]gion|d[ée]partement|ville|commune|chez (moi|nous)/i.test(probleme);
  return modele.questions.map((modele_question, index) =>
    questionDepuisModele(
      sujetId,
      index,
      {
        texte: regionalise ? modele_question.texte.replace('de votre région', 'de ta région') : modele_question.texte,
        poste: modele_question.poste,
      },
      cat,
    ),
  );
}

/** Fabrique une question vierge à partir d'un modèle. */
export function questionDepuisModele(
  sujetId: string,
  index: number,
  modele: ModeleQuestion,
  cat: CategorieId = 'quotidien',
): Question {
  const base: Question = {
    id: `${sujetId}-q${index + 1}-${Math.random().toString(36).slice(2, 6)}`,
    texte: modele.texte,
    poste: modele.poste,
    oui: 0,
    non: 0,
    sansAvis: 0,
    verifies: 0,
    archives: 0,
    aVerifier: 0,
    etat: 'ouverte',
    budgetMoyen: 0,
  };
  // Chaque question arrive avec sa carte « Pourquoi c'est important ? » :
  // jamais une question dont on ne comprend pas l'enjeu (prompt 9).
  base.pourquoi = cartePourquoi(base, cat);
  return base;
}

/** Total des votes exprimés sur une question (sans les archivés). */
export function totalVotes(q: Question): number {
  return q.oui + q.non + q.sansAvis;
}

export interface StatsQuestion {
  total: number;
  ouiPct: number;
  nonPct: number;
  sansPct: number;
}

/** Pourcentages d'une question, arrondis. */
export function statsQuestion(q: Question): StatsQuestion {
  const total = totalVotes(q);
  if (total === 0) return { total: 0, ouiPct: 0, nonPct: 0, sansPct: 0 };
  return {
    total,
    ouiPct: (q.oui / total) * 100,
    nonPct: (q.non / total) * 100,
    sansPct: (q.sansAvis / total) * 100,
  };
}

/** Nombre au format français : 12 430. */
export function nombre(valeur: number): string {
  return Math.round(valeur).toLocaleString('fr-FR');
}

/** Pourcentage arrondi affiché : 78 %. */
export function pct(valeur: number): string {
  return `${Math.round(valeur)} %`;
}

/** Durée lisible : « 42 min 17 s », « 3 j 4 h ». */
export function duree(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const jours = Math.floor(total / 86400);
  const heures = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secondes = total % 60;
  if (jours > 0) return `${jours} j ${heures} h`;
  if (heures > 0) return `${heures} h ${minutes} min`;
  if (minutes > 0) return `${minutes} min ${secondes} s`;
  return `${secondes} s`;
}

/** Heure de la journée : « 14:00 ». */
export function heureLisible(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/** Date lisible : « 12 novembre 2026 ». */
export function dateLisible(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'date à définir';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Formate une date en AAAA-MM-JJ. */
export function jourISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Nombre de jours entiers restants avant une date. */
export function joursRestants(dateIso: string): number {
  const cible = new Date(`${dateIso}T00:00:00`);
  if (Number.isNaN(cible.getTime())) return 0;
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  return Math.round((cible.getTime() - aujourdhui.getTime()) / 86400000);
}

/** Hash stable d'une chaîne → nombre entre 0 et 1. */
export function hashStable(texte: string): number {
  let h = 2166136261;
  for (let i = 0; i < texte.length; i += 1) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/**
 * Résultat d'un sujet dans une région donnée. Il est calculé de façon stable
 * (même valeur à chaque affichage) et adossé au résultat national, pour que
 * « Chez toi » et « Moyenne France » restent cohérents.
 */
export function pourcentageRegion(nationalPct: number, sujetId: string, regionId: string): number {
  const ecart = (hashStable(`${sujetId}|${regionId}`) - 0.5) * 30;
  return Math.min(97, Math.max(11, nationalPct + ecart));
}

/** Le vote est-il compté pour ce citoyen, sur cette catégorie ? */
export function poidsVote(badge: string, categorie_: CategorieId, niveau: string): number {
  if (badge !== 'jeune') return 1;
  const scolaire = categorie_ === 'education';
  const ecologique = categorie_ === 'environnement';
  if (scolaire || (ecologique && niveau !== 'national')) return 1;
  return 0;
}

/** Message affiché quand un jeune citoyen ne peut pas voter. */
export function raisonPoidsNul(categorie_: CategorieId, niveau: string): string {
  if (categorie_ === 'education') return 'Sujet scolaire : ton vote compte comme les autres.';
  if (niveau === 'national') return 'Jeune citoyen : poids 0 sur les sujets fédéraux.';
  return 'Jeune citoyen : poids 0 hors sujets scolaires et environnementaux.';
}

/** Applique un choix de vote à des compteurs (ajoute, ou retire l'ancien choix). */
export function appliquerVote(
  compteurs: { oui: number; non: number; sansAvis: number },
  choix: ChoixVote,
  sens: 1 | -1,
): void {
  if (choix === 'oui') compteurs.oui += sens;
  else if (choix === 'non') compteurs.non += sens;
  else compteurs.sansAvis += sens;
  for (const cle of ['oui', 'non', 'sansAvis'] as const) {
    if (compteurs[cle] < 0) compteurs[cle] = 0;
  }
}

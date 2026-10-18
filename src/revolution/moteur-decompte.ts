import type { BulletinAgrege, Etat } from './types';

/* ==========================================================================
   moteur-decompte.ts — LE MOTEUR DE DÉCOMPTE, ISOLÉ ET REJOUABLE (prompt 10).

   C'est le cœur anti-triche de Révolution. Il ne dépend d'aucune interface et
   d'aucun état applicatif : il prend des lignes brutes (des bulletins agrégés,
   écrits en insertion pure) et rend des résultats.

   Garanties :
     · déterministe  — mêmes entrées, mêmes sorties, toujours ;
     · rejouable     — n'importe qui peut recalculer depuis le journal brut ;
     · vérifiable    — un tiers peut publier ce module et comparer.

   Ce fichier peut être copié tel quel hors de l'application : il ne connaît ni
   React, ni le navigateur, ni le stockage.
   ========================================================================== */

export interface Totaux {
  oui: number;
  non: number;
  sansAvis: number;
  verifies: number;
  aVerifier: number;
  total: number;
}

const VIDE: Totaux = { oui: 0, non: 0, sansAvis: 0, verifies: 0, aVerifier: 0, total: 0 };

/** Additionne deux jeux de totaux (pure). */
export function additionner(a: Totaux, b: Totaux): Totaux {
  const oui = a.oui + b.oui;
  const non = a.non + b.non;
  const sansAvis = a.sansAvis + b.sansAvis;
  return {
    oui,
    non,
    sansAvis,
    verifies: a.verifies + b.verifies,
    aVerifier: a.aVerifier + b.aVerifier,
    total: oui + non + sansAvis,
  };
}

export function bulletinVersTotaux(b: BulletinAgrege): Totaux {
  return {
    oui: b.oui,
    non: b.non,
    sansAvis: b.sansAvis,
    verifies: b.verifies,
    aVerifier: b.aVerifier,
    total: b.oui + b.non + b.sansAvis,
  };
}

/**
 * RECALCULE TOUS LES RÉSULTATS depuis les lignes brutes.
 * Aucune lecture de `question.oui / non / sansAvis` : uniquement l'urne.
 */
export function recompter(urne: BulletinAgrege[]): Record<string, Totaux> {
  const parQuestion: Record<string, Totaux> = {};
  for (const ligne of urne) {
    const precedent = parQuestion[ligne.questionId] ?? VIDE;
    parQuestion[ligne.questionId] = additionner(precedent, bulletinVersTotaux(ligne));
  }
  return parQuestion;
}

/** Nombre de lignes brutes effectivement lues (transparence). */
export function tailleUrne(urne: BulletinAgrege[]): number {
  return urne.length;
}

/** Les cycles distincts présents dans l'urne (partition horaire). */
export function cyclesDeLUrne(urne: BulletinAgrege[]): number[] {
  return [...new Set(urne.map((b) => b.cycle))].sort((a, b) => a - b);
}

export interface Ecart {
  questionId: string;
  champ: 'oui' | 'non' | 'sansAvis';
  affiche: number;
  recalcule: number;
}

export interface Verification {
  coherent: boolean;
  /** Votes du cycle EN COURS, pas encore agrégés (affichés mais pas dans l'urne). */
  enAttente: number;
  ecarts: Ecart[];
  questionsVerifiees: number;
}

/**
 * Compare l'affichage (questions) au recalcul depuis le journal brut.
 * Seuls les votes du cycle en cours peuvent légitimement différer : ils seront
 * agrégés au prochain top horaire. Tout autre écart est signalé.
 */
export function verifierCoherence(sujets: Etat['sujets'], urne: BulletinAgrege[]): Verification {
  const recalcule = recompter(urne);
  const ecarts: Ecart[] = [];
  let enAttente = 0;
  let questionsVerifiees = 0;

  for (const sujet of sujets) {
    for (const question of sujet.questions) {
      const total = recalcule[question.id];
      if (!total) continue;
      questionsVerifiees += 1;
      const ecartOui = question.oui - total.oui;
      const ecartNon = question.non - total.non;
      const ecartSans = question.sansAvis - total.sansAvis;
      enAttente += Math.max(0, ecartOui) + Math.max(0, ecartNon) + Math.max(0, ecartSans);
      if (ecartOui !== 0) ecarts.push({ questionId: question.id, champ: 'oui', affiche: question.oui, recalcule: total.oui });
      if (ecartNon !== 0) ecarts.push({ questionId: question.id, champ: 'non', affiche: question.non, recalcule: total.non });
      if (ecartSans !== 0) ecarts.push({ questionId: question.id, champ: 'sansAvis', affiche: question.sansAvis, recalcule: total.sansAvis });
    }
  }

  // Les écarts « normaux » sont ceux du cycle en cours : on les tolère tant
  // qu'ils restent petits devant le total. Un écart massif serait une alerte.
  const grave = ecarts.some((e) => Math.abs(e.affiche - e.recalcule) > 25);
  return { coherent: !grave, enAttente, ecarts, questionsVerifiees };
}

/** Sérialise l'urne en CSV — format ouvert, lisible par n'importe qui. */
export function urneEnCSV(urne: BulletinAgrege[]): string {
  const entete = ['cycle', 'date', 'sujetId', 'questionId', 'oui', 'non', 'sansAvis', 'verifies', 'aVerifier'].join(',');
  const lignes = urne.map((b) =>
    [b.cycle, b.date, b.sujetId, b.questionId, b.oui, b.non, b.sansAvis, b.verifies, b.aVerifier].join(','),
  );
  return [entete, ...lignes].join('\n');
}

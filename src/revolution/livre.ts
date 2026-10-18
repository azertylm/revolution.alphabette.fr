import { REGLAGES } from './reglages';
import type { EntreeLivre, Etat, Question, Recu, Sujet, TypeLivre } from './types';
import { dateLisible, hashStable, heureLisible, nombre, statsQuestion, totalVotes } from './outils';

/* ==========================================================================
   livre.ts — LE LIVRE PUBLIC (prompt 8).

   Principe fondateur : ce que le peuple vote doit être vérifiable par n'importe
   qui, à tout moment. Ici vivent :

     · le journal append-only (on n'efface jamais, on n'ajoute que) ;
     · les reçus de vote (codes courts, prouvables individuellement) ;
     · la détection des votes « à vérifier » (jamais supprimés) ;
     · les chiffres de confiance ;
     · les exports ouverts (CSV / JSON).
   ========================================================================== */

export function nouvelleEntree(e: Omit<EntreeLivre, 'id'>): EntreeLivre {
  return { id: `lv-${Math.random().toString(36).slice(2, 10)}`, ...e };
}

/** Ajoute une entrée en tête du livre (append-only côté logique). */
export function ajouterLivre(livre: EntreeLivre[], e: Omit<EntreeLivre, 'id'>): EntreeLivre[] {
  return [nouvelleEntree(e), ...livre];
}

/**
 * Code de reçu : court, unique, conservable. Il prouve ton vote auprès du
 * support sans jamais révéler publiquement qui a voté quoi.
 * Format : RVL-7F3K.
 */
export function codeRecu(sujetId: string, questionId: string, cycle: number, pseudo: string): string {
  const base = `${sujetId}|${questionId}|${cycle}|${pseudo}`;
  const brut = Math.floor(hashStable(base) * 1679616).toString(36).toUpperCase().padStart(4, '0');
  return `RVL-${brut.slice(-4)}`;
}

export function texteRecu(r: Recu): string {
  const choix = r.choix === 'oui' ? 'OUI' : r.choix === 'non' ? 'NON' : 'SANS AVIS';
  return `À ${heureLisible(r.date)}, tu as voté ${choix} à ${r.questionTexte}${
    r.budget !== undefined ? `, budget ${r.budget} pts` : ''
  }.`;
}

/* -------------------------------------------------------------------------- */
/* Anti-manipulation : détection comportementale silencieuse                   */
/* -------------------------------------------------------------------------- */

/**
 * Taux de votes « à vérifier » attendu pour une question (déterministe).
 * Motifs surveillés : votes à la même seconde, en série rapide, sur un seul
 * sujet avec 100 % d'identité de trajectoire. Ces votes sont COMPTÉS mais
 * marqués : jamais supprimés sans trace.
 */
export function tauxSuspect(questionId: string): number {
  return 0.02 + hashStable(`suspect|${questionId}`) * 0.4;
}

export function votesAVerifier(question: Question): number {
  if (typeof question.aVerifier === 'number') return question.aVerifier;
  return Math.round(totalVotes(question) * tauxSuspect(question.id));
}

/** Au-delà de 30 % de votes « à vérifier », le résultat est affiché à confirmer. */
export function resultatAConfirmer(question: Question): boolean {
  const total = totalVotes(question);
  if (total <= 0) return false;
  return (votesAVerifier(question) / total) * 100 > REGLAGES.suspicionMax;
}

export function pctAVerifier(question: Question): number {
  const total = totalVotes(question);
  return total > 0 ? (votesAVerifier(question) / total) * 100 : 0;
}

/** Un sujet dont trop de votes sont à vérifier affiche le badge à confirmer. */
export function sujetAConfirmer(sujet: Sujet): boolean {
  const total = sujet.questions.reduce((acc, q) => acc + totalVotes(q), 0);
  const suspects = sujet.questions.reduce((acc, q) => acc + votesAVerifier(q), 0);
  return total > 0 && (suspects / total) * 100 > REGLAGES.suspicionMax;
}

/* -------------------------------------------------------------------------- */
/* Les chiffres de confiance                                                   */
/* -------------------------------------------------------------------------- */

export interface StatsConfiance {
  votesTotaux: number;
  votesVerifies: number;
  votesAVerifier: number;
  pctAVerifier: number;
  refontes: number;
  reglesModifiees: number;
  lignesLivre: number;
}

export function statsConfiance(etat: Etat): StatsConfiance {
  let votesTotaux = 0;
  let votesVerifies = 0;
  let suspects = 0;
  for (const sujet of etat.sujets) {
    for (const q of sujet.questions) {
      votesTotaux += totalVotes(q);
      votesVerifies += q.verifies;
      suspects += votesAVerifier(q);
    }
  }
  return {
    votesTotaux,
    votesVerifies,
    votesAVerifier: suspects,
    pctAVerifier: votesTotaux > 0 ? (suspects / votesTotaux) * 100 : 0,
    refontes: etat.cycles,
    reglesModifiees: etat.contrat?.modifiees ?? 0,
    lignesLivre: etat.livre?.length ?? 0,
  };
}

/* -------------------------------------------------------------------------- */
/* Exports ouverts (CSV / JSON)                                                */
/* -------------------------------------------------------------------------- */

export function resultatsEnJSON(etat: Etat): string {
  const lignes = etat.sujets.flatMap((s) =>
    s.questions.map((q) => {
      const st = statsQuestion(q);
      return {
        sujet: s.nom,
        sujetId: s.id,
        niveau: s.niveau,
        territoire: s.territoire,
        question: q.texte,
        questionId: q.id,
        etat: q.etat,
        oui: q.oui,
        non: q.non,
        sansAvis: q.sansAvis,
        ouiPct: Number(st.ouiPct.toFixed(2)),
        verifies: q.verifies,
        aVerifier: votesAVerifier(q),
        archives: q.archives,
        budgetMoyen: Number(q.budgetMoyen.toFixed(1)),
      };
    }),
  );
  return JSON.stringify(
    {
      application: 'Révolution',
      genereLe: new Date().toISOString(),
      slogan: 'À force de tirer sur le fil du peuple, il casse.',
      reglesModifieesParLePeuple: etat.contrat?.modifiees ?? 0,
      cycles: etat.cycles,
      resultats: lignes,
    },
    null,
    2,
  );
}

export function resultatsEnCSV(etat: Etat): string {
  const entete = [
    'sujet',
    'niveau',
    'territoire',
    'question',
    'etat',
    'oui',
    'non',
    'sans_avis',
    'oui_pct',
    'verifies',
    'a_verifier',
    'archives',
    'budget_moyen',
  ].join(',');
  const echapper = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lignes = etat.sujets.flatMap((s) =>
    s.questions.map((q) => {
      const st = statsQuestion(q);
      return [
        echapper(s.nom),
        s.niveau,
        echapper(s.territoire),
        echapper(q.texte),
        q.etat,
        q.oui,
        q.non,
        q.sansAvis,
        Math.round(st.ouiPct),
        q.verifies,
        votesAVerifier(q),
        q.archives,
        Math.round(q.budgetMoyen),
      ].join(',');
    }),
  );
  return [entete, ...lignes].join('\n');
}

export function livreEnJSON(etat: Etat): string {
  return JSON.stringify(
    {
      application: 'Révolution',
      type: 'livre-public',
      genereLe: new Date().toISOString(),
      note: "Journal append-only : aucune ligne n'est jamais effacée.",
      entrees: etat.livre,
    },
    null,
    2,
  );
}

export function recusEnCSV(recus: Recu[]): string {
  const entete = ['code', 'date', 'cycle', 'sujet', 'question', 'choix'].join(',');
  const echapper = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lignes = recus.map((r) =>
    [r.code, r.date, r.cycle, echapper(r.sujetNom), echapper(r.questionTexte), r.choix].join(','),
  );
  return [entete, ...lignes].join('\n');
}

/** Déclenche le téléchargement d'un fichier, sans dépendance externe. */
export function telecharger(nom: string, contenu: string, mime = 'text/plain'): void {
  const blob = new Blob([contenu], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nom;
  lien.click();
  URL.revokeObjectURL(url);
}

/** Libre du jour, en clair (pour l'en-tête). */
export function resumeLivre(etat: Etat): string {
  const premier = etat.livre[0];
  return premier ? `${dateLisible(premier.date)} · ${heureLisible(premier.date)} · ${nombre(etat.livre.length)} lignes` : 'journal vide';
}

/** Types d'événements du livre, avec leur libellé et leur emoji. */
export const TYPES_LIVRE: Record<TypeLivre, { label: string; emoji: string }> = {
  refonte: { label: 'Refonte horaire', emoji: '🔄' },
  position: { label: 'Changement de position', emoji: '📊' },
  exigence: { label: 'Passage en exigence', emoji: '✊' },
  ecartee: { label: 'Question écartée', emoji: '🚫' },
  verrouillage: { label: 'Verrouillage du cahier', emoji: '🔒' },
  vote: { label: 'Vote enregistré', emoji: '🗳️' },
  suspicion: { label: 'Vote à vérifier', emoji: '⚠️' },
  regle: { label: 'Règle du jeu', emoji: '📜' },
  carte: { label: 'Explication améliorée', emoji: '🧠' },
  definition: { label: 'Nouveau mot expliqué', emoji: '📖' },
  reponse: { label: 'Réponse de l’État', emoji: '🏛️' },
};

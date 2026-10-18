/**
 * reglages.ts — tous les seuils et toutes les durées du prototype, à un seul
 * endroit, pour pouvoir les ajuster sans fouiller dans le code.
 */
export const REGLAGES = {
  /** Validations nécessaires pour qu'un sujet proposé devienne officiel. */
  seuilValidations: 10,
  /** Rejets au-delà desquels un sujet proposé est écarté (archivé). */
  seuilRejets: 10,

  /** Anti-spam : un citoyen ne propose qu'un sujet par période. */
  quotaHeures: 24,

  /** Budget total à répartir avec les curseurs (en points). */
  budgetTotal: 100,

  /** Durée normale d'un cycle de refonte (1 heure). */
  cycleMs: 60 * 60 * 1000,
  /** Cycle accéléré pour voir la Refonte fonctionner dans le prototype. */
  cycleAccelereMs: 60 * 1000,

  /** Au-delà de ce taux de ressemblance, un sujet proposé est un doublon. */
  ressemblanceMax: 0.8,

  /** Consensus à partir duquel une question devient une « Exigence du peuple ». */
  consensusExigence: 66,
  /** Rejet massif à partir duquel une question est « Écartée par le peuple ». */
  consensusEcartee: 66,

  /** Rejet du peuple au-delà duquel une exigence est « Relancée ». */
  satisfactionRejet: 50,

  /** Heure de verrouillage du cahier le jour du rendez-vous. */
  verrouillageHeure: 18,

  /** Seuil de « bascule » qui rend une alerte de vote urgente. */
  seuilBascule: 63,
} as const;

/** Statuts possibles selon le niveau de consensus atteint. */
export const TAUX_EXIGENCE = REGLAGES.consensusExigence;

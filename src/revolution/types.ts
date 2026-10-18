import type { CategorieId, ModeleQuestion } from './categories';

/* ==========================================================================
   Le modèle de données de Révolution.
   Tout est local (localStorage) pour le prototype ; l'architecture est prête
   à recevoir un vrai backend de votes (une action = une mutation d'état).
   ========================================================================== */

/** Niveaux géographiques d'un sujet ou d'un rendez-vous. */
export type Niveau = 'commune' | 'departement' | 'region' | 'national';

/** Niveau de vérification du citoyen : badge anti-multi-comptes, rien de plus. */
export type BadgeCitoyen = 'citoyen' | 'verifie' | 'jeune';

export type ChoixVote = 'oui' | 'non' | 'sans-avis';

export type StatutSujet = 'officiel' | 'en-attente' | 'ecarte';

/** État d'une question après la Refonte. */
export type EtatQuestion = 'ouverte' | 'exigence' | 'ecartee';

/** Cycle de vie d'une exigence face à l'État. */
export type StatutExigence =
  | 'a-presenter'
  | 'presentee'
  | 'en-reponse'
  | 'relancee'
  | 'satisfaite';

/** Nature de la réponse de l'État. */
export type ReponseEtat = 'accepte' | 'refuse' | 'etude';

export interface Question {
  id: string;
  /** Formulation votée, toujours « Voulez-vous … ? ». */
  texte: string;
  /** Sous-poste budgétaire (curseurs de l'étape « Où investir ? »). */
  poste: string;
  oui: number;
  non: number;
  sansAvis: number;
  /** Votes exprimés par des citoyens vérifiés (transparence). */
  verifies: number;
  /** Votes archivés pour suspicion (jamais effacés, journalisés). */
  archives: number;
  etat: EtatQuestion;
  /** Points de budget alloués en moyenne à cette mesure. */
  budgetMoyen: number;
  /** Statut face à l'État, une fois devenue exigence. */
  statut?: StatutExigence;
  /** Nature de la réponse de l'État (si statut « en-reponse » ou « satisfaite »). */
  reponse?: ReponseEtat;
  /** Vote de satisfaction du peuple sur la réponse de l'État. */
  satisfaction?: { satisfait: number; pasSatisfait: number };
  /** Date de passage en exigence (affichée dans le cahier). */
  depuis?: string;
}

export interface MessageSection {
  id: string;
  pseudo: string;
  badge: BadgeCitoyen;
  texte: string;
  date: string;
}

export interface Sujet {
  id: string;
  emoji: string;
  nom: string;
  /** Le problème, tel que décrit par le citoyen (200 caractères maximum). */
  probleme: string;
  categorie: CategorieId;
  niveau: Niveau;
  /** Périmètre précis : nom de la commune, du département ou de la région. */
  territoire: string;
  statut: StatutSujet;
  validations: number;
  rejets: number;
  votants: number;
  verifies: number;
  archives: number;
  /** Nombre de question(s) en attente de remplacement par une question de secours. */
  questions: Question[];
  /** Réserve de questions, sortie quand une question est « Écartée par le peuple ». */
  secours: ModeleQuestion[];
  /** Budget : nombre de citoyens ayant scellé une répartition. */
  budgetVotants: number;
  creeLe: string;
  auteur: string;
  /** Mini-forum de la section du sujet : une seule liste de messages. */
  messages: MessageSection[];
  /** Signalements citoyens (« ⚠️ Signaler ») — 3 votes de pairs archivent. */
  signalements: string[];
  /** Régions où le sujet dépasse un fort soutien (adoption nationale). */
  regionsSoutenantes: string[];
  /** Proposé au vote national après un fort soutien dans 5 régions. */
  propositionNationale?: boolean;
}

export type RolePoste = 'coordinateur' | 'moderateur' | 'tresorier';

export interface Candidat {
  id: string;
  pseudo: string;
  poste: RolePoste;
  /** Candidature en une phrase, aucun CV. */
  phrase: string;
  oui: number;
  non: number;
  sansAvis: number;
}

export interface RolePourvu {
  poste: RolePoste;
  titulaire: string | null;
  /** Dernière élection (tous les 6 mois). */
  electionLe: string;
}

/** Une section = un territoire où les citoyens se retrouvent. */
export interface Section {
  id: string;
  niveau: Niveau;
  territoire: string;
  citoyensActifs: number;
  roles: RolePourvu[];
  candidats: Candidat[];
}

export interface RendezVous {
  id: string;
  niveau: Niveau;
  territoire: string;
  /** Date au format AAAA-MM-JJ. */
  date: string;
  heure: string;
  /** Négociation, audience, audience parlementaire, réunion interministérielle… */
  nature: string;
  lieu: string;
  statut: 'propose' | 'officiel' | 'termine';
  validations: number;
  /** Bilan, une fois le rendez-vous passé. */
  bilan?: {
    exigencesPresentees: number;
    tauxReponse: number;
    satisfaction: number;
  };
}

export type TypeNotification = 'refonte' | 'rendez-vous' | 'mobilisation' | 'seuil';

export interface Notification {
  id: string;
  date: string;
  type: TypeNotification;
  titre: string;
  texte: string;
  /** Une action urgente à faire : le badge devient rouge. */
  urgent: boolean;
  lu: boolean;
  /** Écran à ouvrir au clic. */
  cible?: { vue: string; sujetId?: string; questionId?: string };
}

export interface EntreeJournal {
  id: string;
  date: string;
  texte: string;
  type: 'montee' | 'descente' | 'question' | 'exigence' | 'ecartee' | 'refonte';
}

export interface Citoyen {
  pseudo: string;
  /** Code PIN à 4 chiffres — aucune autre donnée d'authentification. */
  pin: string;
  badge: BadgeCitoyen;
  /** Région obligatoire (questions régionalisées). */
  region: string;
  /** Date de naissance (mode jeune citoyen). */
  naissance: string | null;
  /** Phrase de présentation facultative (140 caractères). */
  phrase: string;
  /** Pseudonymat dans les classements et historiques publics. */
  modeDiscret: boolean;
}

export interface Etat {
  citoyen: Citoyen | null;
  sujets: Sujet[];
  sections: Section[];
  rendezVous: RendezVous[];
  /** `${sujetId}:${questionId}` → choix. */
  mesVotes: Record<string, ChoixVote>;
  /** Répartition budgétaire envoyée, par sujet. */
  mesBudgets: Record<string, number[]>;
  /** Sujets déjà modérés (valider / rejeter). */
  sujetsModeres: string[];
  /** Rendez-vous déjà validés. */
  rdvValides: string[];
  /** Sujets déjà signalés. */
  mesSignalements: string[];
  /** Candidats déjà soutenus (élection des rôles). */
  mesElections: string[];
  notifications: Notification[];
  journal: EntreeJournal[];
  /** Participation heure par heure (transparence totale). */
  historique: { date: string; votants: number; exigences: number }[];
  dernierEnvoi: string | null;
  derniereRefonte: string;
  cycles: number;
  /** Cycle accéléré : 60 secondes au lieu d'une heure (réglage du prototype). */
  cycleAccelere: boolean;
  reglagesNotif: { refontes: boolean; mobilisation: boolean; seuils: boolean };
  /** Partages : lien court généré + votes qu'il a apportés. */
  partages: Record<string, { lien: string; votes: number }>;
}

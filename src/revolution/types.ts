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
  /**
   * Votes « à vérifier » (prompt 8) : motifs suspects (même seconde, série
   * rapide, trajectoire identique). Ils sont COMPTÉS mais marqués : jamais
   * supprimés sans trace. Au-delà de 30 %, le résultat affiche
   * « ⚠️ Résultat à confirmer ».
   */
  aVerifier: number;
  etat: EtatQuestion;
  /** Points de budget alloués en moyenne à cette mesure. */
  budgetMoyen: number;
  /** Éducation civique : la carte « Pourquoi c'est important ? » (prompt 9). */
  pourquoi?: CartePourquoi;
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
  /** Votes « à vérifier » cumulés sur les questions du sujet (prompt 8). */
  aVerifier: number;
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

/* --------------------------------------------------------------------------
   L'Assemblée du peuple.
   Vingt administrateurs par région, élus en continu, renouvelés par roulement.
   Aucun d'entre eux ne peut toucher à un vote, une question ou un résultat :
   ils organisent, modèrent et transmettent — c'est tout.
   -------------------------------------------------------------------------- */

/** Un siège d'administrateur pourvu, avec ses dates et son soutien. */
export interface Mandat {
  id: string;
  /** Identifiant de la région (voir regions.ts). */
  regionId: string;
  /** Nom affiché de la région. */
  territoire: string;
  /** Pseudo du titulaire. */
  titulaire: string;
  /** ISO : installation, puis fin de mandat prévue. */
  debut: string;
  fin: string;
  /** Soutiens obtenus au moment de l'élection. */
  voix: number;
}

/** Un volontaire qui attend un siège dans sa région. */
export interface CandidatAdmin {
  id: string;
  regionId: string;
  territoire: string;
  pseudo: string;
  /** Candidature en une phrase, aucun CV. */
  phrase: string;
  /** Soutiens citoyens. */
  voix: number;
  /** Réserves exprimées (affichées, jamais décisives). */
  reserves: number;
  inscritLe: string;
  /** Déjà passé par un mandat : les nouveaux sont servis d'abord. */
  dejaElu: boolean;
}

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
  /** Citoyens inscrits à la section (adhésion en un clic). */
  membres: number;
  roles: RolePourvu[];
  candidats: Candidat[];
  /** ISO : ouverture de la section (automatique dès que la demande monte). */
  ouverteLe?: string;
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
  type: 'montee' | 'descente' | 'question' | 'exigence' | 'ecartee' | 'refonte' | 'assemblee';
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

/* ==========================================================================
   PROMPT 8 — Le livre public, les reçus de vote, le contrat du peuple.
   Le livre est un journal append-only : on n'efface jamais une ligne, on
   n'ajoute que des événements horodatés et recalculables.
   ========================================================================== */

export type TypeLivre =
  | 'refonte'
  | 'position'
  | 'exigence'
  | 'ecartee'
  | 'verrouillage'
  | 'vote'
  | 'suspicion'
  | 'regle'
  | 'carte'
  | 'definition'
  | 'reponse';

export interface EntreeLivre {
  id: string;
  date: string;
  /** Cycle horaire auquel l'événement appartient (partition du journal). */
  cycle: number;
  type: TypeLivre;
  texte: string;
  sujetId?: string;
  questionId?: string;
  /** Marqué « à vérifier » : jamais supprimé, toujours visible. */
  suspect?: boolean;
  /** Valeurs brutes, pour que n'importe qui puisse recalculer. */
  donnees?: Record<string, number | string>;
}

/**
 * Un reçu de vote : un code court, unique, conservable. Il prouve
 * individuellement ton vote auprès du support sans jamais révéler
 * publiquement qui a voté quoi.
 */
export interface Recu {
  code: string;
  date: string;
  cycle: number;
  sujetId: string;
  sujetNom: string;
  questionId: string;
  questionTexte: string;
  choix: ChoixVote;
  /** Répartition budgétaire scellée en même temps (facultative). */
  budget?: number;
}

/** Une des cinq règles du jeu, verrouillées par le peuple. */
export interface RegleContrat {
  numero: number;
  titre: string;
  texte: string;
}

/** Proposition de modification du contrat : adoptée à 75 % de OUI. */
export interface PropositionRegle {
  id: string;
  date: string;
  auteur: string;
  /** Règle visée (0 = nouvelle règle). */
  numero: number;
  titre: string;
  texte: string;
  oui: number;
  non: number;
  sansAvis: number;
  adoptee: boolean;
}

export interface Contrat {
  verrouilleLe: string;
  regles: RegleContrat[];
  propositions: PropositionRegle[];
  /** Fierté de l'application : doit rester 0 tant que le peuple ne vote pas. */
  modifiees: number;
}

/* ==========================================================================
   PROMPT 9 — L'éducation civique intégrée.
   ========================================================================== */

/** « Pourquoi c'est important ? » : trois phrases, jamais plus. */
export interface CartePourquoi {
  situation: string;
  siOui: string;
  siNon: string;
  /** Versions ultra-simples, niveau école (mode lecture facile). */
  simpleSituation: string;
  simpleOui: string;
  simpleNon: string;
  /** Numéro de version : change quand le peuple adopte une meilleure carte. */
  version: number;
  auteur: string;
}

/** Amélioration d'une carte proposée par un citoyen (vote OUI/NON/Sans avis). */
export interface PropositionCarte {
  id: string;
  date: string;
  sujetId: string;
  questionId: string;
  situation: string;
  siOui: string;
  siNon: string;
  simpleSituation: string;
  simpleOui: string;
  simpleNon: string;
  auteur: string;
  oui: number;
  non: number;
  sansAvis: number;
  /** Adoptée : la meilleure version remplace l'ancienne à la Refonte suivante. */
  retenue: boolean;
}

export interface TermeDictionnaire {
  terme: string;
  /** Une phrase, en langage du quotidien. */
  definition: string;
  /** La même, en langage ultra-simple. */
  simple: string;
}

export interface ReglagesAccessibilite {
  /** 🗣️ Mode lecture facile : phrases courtes, cartes niveau école. */
  lectureFacile: boolean;
  /** 🔍 Texte agrandi : toute l'interface grossit. */
  texteAgrandi: boolean;
}

export interface MinuteCitoyenne {
  /** Jour (AAAA-MM-JJ) de la dernière minute affichée (jamais deux fois). */
  dernierJour: string | null;
  /** Le peuple s'instruit : compteurs cumulés (locaux). */
  appris: number;
  suConnu: number;
  /** Question à laquelle TU as répondu, par jour. */
  reponses: Record<string, string>;
}

/* ==========================================================================
   PROMPT 10 — Le moteur de décompte rejouable.
   Les votes s'écrivent en insertion pure (jamais de mise à jour), partitionnés
   par cycle horaire. N'importe qui peut recalculer tous les résultats depuis
   ces lignes brutes et retrouver exactement les mêmes chiffres.
   ========================================================================== */

export interface BulletinAgrege {
  cycle: number;
  date: string;
  sujetId: string;
  questionId: string;
  oui: number;
  non: number;
  sansAvis: number;
  verifies: number;
  aVerifier: number;
}

export interface Etat {
  citoyen: Citoyen | null;
  sujets: Sujet[];
  sections: Section[];
  rendezVous: RendezVous[];
  /** Sections que TU as rejointes (adhésion en un clic). */
  adhesions: string[];
  /** Les sièges d'administrateurs pourvus, toutes régions confondues. */
  mandats: Mandat[];
  /** Les volontaires qui attendent un siège. */
  candidatsAdmin: CandidatAdmin[];
  /** Candidats de l'Assemblée que TU as déjà soutenus. */
  soutiensAdmin: string[];
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

  /* -------------------- Prompt 8 : transparence & anti-manipulation ------- */
  /** 📖 Le livre public : journal append-only de TOUT ce qui se passe. */
  livre: EntreeLivre[];
  /** Mes reçus de vote (code court, conservable). */
  recus: Recu[];
  /** Le contrat du peuple (les 5 règles, verrouillées à 75 % de OUI). */
  contrat: Contrat;
  /** Comptes actifs hébergés par CET appareil : 2 maximum. */
  comptesAppareil: string[];

  /* -------------------- Prompt 9 : éducation civique ---------------------- */
  /** Le dictionnaire citoyen (« mode jargon off »). */
  dictionnaire: TermeDictionnaire[];
  /** Améliorations de cartes proposées par les citoyens. */
  propositionsCarte: PropositionCarte[];
  /** La minute citoyenne (une seule fois par jour). */
  minute: MinuteCitoyenne;
  /** Accessibilité universelle : lecture facile, texte agrandi. */
  accessibilite: ReglagesAccessibilite;

  /* -------------------- Prompt 10 : moteur rejouable ---------------------- */
  /**
   * La table des votes agrégés, en insertion pure, partitionnée par cycle.
   * C'est la source brute à partir de laquelle on recalcule tous les résultats.
   */
  urne: BulletinAgrege[];
  /** Cycles d'historique conservés dans l'urne (au-delà, on archive). */
  urneArchives: number;
}

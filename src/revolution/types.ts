/** Un sujet d'actualité récolté à la publication (dist/actu.json). */
export interface SujetActu {
  id: string;
  titre: string;
  source: string;
  lien: string;
  date: string;
  resume: string;
  themes: string[];
  region: string | null;
  type: 'mesure' | 'mobilisation' | 'importance';
  question: string;
  choix: string[];
}

export interface Actu {
  genereLe: string;
  sources: { nom: string; ok: boolean; nb: number; erreur?: string }[];
  sujets: SujetActu[];
}

/** Une question posée par une organisation ou un citoyen, publiée dans la base partagée. */
export interface QuestionPubliee {
  id: string;
  texte: string;
  contexte: string;
  choix: string[];
  auteurType: string;
  auteurNom: string;
  /** « national » ou l'identifiant d'une région. */
  territoire: string;
  lien: string;
  creeLe: string;
  signalements: number;
  mienne: boolean;
}

export type NouvelleQuestion = Pick<
  QuestionPubliee,
  'texte' | 'contexte' | 'choix' | 'auteurType' | 'auteurNom' | 'territoire' | 'lien'
>;

export interface Profil {
  region: string | null;
  themes: string[];
}

export interface MaReponse {
  choix: number;
  date: string;
  /** Vrai si la réponse a bien été comptée dans la base partagée. */
  comptee: boolean;
}

export interface EtatLocal {
  profil: Profil;
  reponses: Record<string, MaReponse>;
  /** Questions préparées sur cet appareil, en attente de publication. */
  brouillons: (NouvelleQuestion & { id: string; creeLe: string })[];
  /** Questions que j'ai publiées (pour retrouver vite leurs résultats). */
  publiees: string[];
  bienvenueVue: boolean;
}

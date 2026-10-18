import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

/* ==========================================================================
   La navigation de l'application : une seule « vue » à l'écran, un périmètre
   territorial (ma région / toute la France) et une cible pour les
   notifications (ouvrir directement le bon sujet).
   ========================================================================== */

export type Vue =
  | 'accueil'
  | 'sujet'
  | 'journal'
  | 'rendez-vous'
  | 'attente'
  | 'notifications'
  | 'assemblee'
  | 'sections'
  | 'fil'
  | 'profil';

export interface Cible {
  vue: Vue;
  sujetId?: string;
  questionId?: string;
}

export interface ValeurNav {
  vue: Vue;
  sujetId: string | null;
  questionId: string | null;
  /** Périmètre affiché : identifiant de région, « national » ou « tout ». */
  perimetre: string;
  setPerimetre: (perimetre: string) => void;
  aller: (cible: Cible) => void;
  /** Ouvre l'inscription citoyenne (pseudo + code PIN). */
  demanderIdentite: (raison?: string) => void;
}

export const NavContexte = createContext<ValeurNav | null>(null);

export function useNav(): ValeurNav {
  const valeur = useContext(NavContexte);
  if (!valeur) throw new Error('useNav doit être utilisé dans <ProviderNav>.');
  return valeur;
}

export function ProviderNav({ valeur, children }: { valeur: ValeurNav; children: ReactNode }) {
  return <NavContexte.Provider value={valeur}>{children}</NavContexte.Provider>;
}

import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { chargerEtat, reducer, sauverEtat, type Action } from './etat';
import { REGLAGES } from './reglages';
import type { Etat } from './types';

/* ==========================================================================
   Le contexte : l'état, les actions, et l'horloge de la Refonte.
   ========================================================================== */

interface Valeur {
  etat: Etat;
  agir: (action: Action) => void;
  /** Horodatage courant (mis à jour chaque seconde) : fait vivre les compteurs. */
  maintenant: number;
  /** Durée du cycle en cours (accélérée à 60 s dans le prototype si demandé). */
  dureeCycle: number;
  /** Millisecondes restantes avant la prochaine Refonte. */
  msRestants: number;
  /** Progression du cycle, de 0 à 1. */
  fraction: number;
  refondreMaintenant: () => void;
}

const Ctx = createContext<Valeur | null>(null);

export function FournisseurRevolution({ children }: { children: ReactNode }) {
  const [etat, agir] = useReducer(reducer, undefined, chargerEtat);
  const [maintenant, setMaintenant] = useState(() => Date.now());
  const derniereRefonteGeree = useRef(0);

  const dureeCycle = etat.cycleAccelere ? REGLAGES.cycleAccelereMs : REGLAGES.cycleMs;
  const echeance = new Date(etat.derniereRefonte).getTime() + dureeCycle;
  const msRestants = Math.max(0, echeance - maintenant);
  const fraction = Math.min(1, Math.max(0, 1 - msRestants / dureeCycle));

  // L'horloge.
  useEffect(() => {
    const t = window.setInterval(() => setMaintenant(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  // Persistance locale.
  useEffect(() => {
    sauverEtat(etat);
  }, [etat]);

  // Le top horaire : La Refonte part toute seule.
  useEffect(() => {
    if (maintenant < echeance) return;
    if (derniereRefonteGeree.current === echeance) return;
    derniereRefonteGeree.current = echeance;
    agir({ type: 'refonte' });
  }, [maintenant, echeance]);

  // Les rappels de rendez-vous (J-7, J-3, J-1, jour J) sont recalculés à l'ouverture.
  useEffect(() => {
    agir({ type: 'rdv-notifications' });
  }, []);

  const valeur = useMemo<Valeur>(
    () => ({
      etat,
      agir,
      maintenant,
      dureeCycle,
      msRestants,
      fraction,
      refondreMaintenant: () => agir({ type: 'refonte' }),
    }),
    [etat, maintenant, dureeCycle, msRestants, fraction],
  );

  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>;
}

export function useRevolution(): Valeur {
  const valeur = useContext(Ctx);
  if (!valeur) throw new Error('useRevolution doit être utilisé dans <FournisseurRevolution>.');
  return valeur;
}

/** Annonce aux lecteurs d'écran, sans surcharger l'affichage. */
export function Annonce({ children }: { children: ReactNode }) {
  return (
    <span className="sr-only" role="status">
      {children}
    </span>
  );
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { effacerAncienPrototype, ecrireEtat, lireEtat } from './donnees';
import { envoyerReponse, partage, type EtatPartage } from './partage';
import type { EtatLocal } from './types';

interface Valeur {
  etat: EtatLocal;
  modifier: (f: (e: EtatLocal) => EtatLocal) => void;
  repondre: (questionId: string, choix: number) => Promise<void>;
  partageEtat: EtatPartage;
  route: string;
  aller: (route: string) => void;
}

const Ctx = createContext<Valeur | null>(null);

const lireRoute = () => (window.location.hash.replace(/^#/, '') || '/').split('?')[0];

export function Fournisseur({ children }: { children: ReactNode }) {
  const [etat, setEtat] = useState<EtatLocal>(() => {
    effacerAncienPrototype();
    return lireEtat();
  });
  const [partageEtat, setPartageEtat] = useState<EtatPartage>('verification');
  const [route, setRoute] = useState(lireRoute);

  useEffect(() => {
    let vivant = true;
    void partage().then((api) => vivant && setPartageEtat(api ? 'actif' : 'inactif'));
    const surHash = () => {
      setRoute(lireRoute());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', surHash);
    return () => {
      vivant = false;
      window.removeEventListener('hashchange', surHash);
    };
  }, []);

  const modifier = useCallback((f: (e: EtatLocal) => EtatLocal) => {
    setEtat((avant) => {
      const apres = f(avant);
      ecrireEtat(apres);
      return apres;
    });
  }, []);

  const repondre = useCallback(
    async (questionId: string, choix: number) => {
      modifier((e) => ({ ...e, reponses: { ...e.reponses, [questionId]: { choix, date: new Date().toISOString(), comptee: false } } }));
      try {
        const r = await envoyerReponse(questionId, choix);
        if (r === 'ok' || r === 'deja') {
          modifier((e) => ({
            ...e,
            reponses: { ...e.reponses, [questionId]: { ...e.reponses[questionId], comptee: true } },
          }));
        }
      } catch {
        /* la réponse reste notée sur l'appareil */
      }
    },
    [modifier],
  );

  const aller = useCallback((r: string) => {
    window.location.hash = r;
  }, []);

  const valeur = useMemo(
    () => ({ etat, modifier, repondre, partageEtat, route, aller }),
    [etat, modifier, repondre, partageEtat, route, aller],
  );
  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>;
}

export function useRev(): Valeur {
  const v = useContext(Ctx);
  if (!v) throw new Error('Fournisseur manquant');
  return v;
}

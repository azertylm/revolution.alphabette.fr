import { useEffect, useMemo, useState } from 'react';
import { useRevolution } from '../contexte';
import { REGLAGES } from '../reglages';
import type { Sujet } from '../types';
import { GrosBouton, Panneau } from '../ui';

/* ==========================================================================
   OÙ INVESTIR — 100 points à répartir, au doigt.
   Un curseur géant ET des boutons −5 / −1 / +1 / +5 : sur téléphone, on tape
   plutôt qu'on ne glisse. Seules les mesures approuvées (OUI) en reçoivent, et
   la somme ne dépasse jamais 100 : les boutons se bloquent tout seuls.
   ========================================================================== */

export function CurseursBudget({ sujet }: { sujet: Sujet }) {
  const { etat, agir } = useRevolution();
  const [points, setPoints] = useState<number[]>(() => etat.mesBudgets[sujet.id] ?? sujet.questions.map(() => 0));
  const [scelle, setScelle] = useState(false);

  useEffect(() => {
    setPoints(etat.mesBudgets[sujet.id] ?? sujet.questions.map(() => 0));
  }, [sujet.id, etat.mesBudgets]);

  const eligibles = useMemo(
    () => sujet.questions.map((q) => etat.mesVotes[`${sujet.id}:${q.id}`] === 'oui'),
    [sujet.questions, etat.mesVotes, sujet.id],
  );

  const total = points.reduce((acc, p) => acc + p, 0);
  const restant = REGLAGES.budgetTotal - total;

  const changer = (index: number, valeur: number) => {
    setScelle(false);
    setPoints((precedents) => {
      const suivants = [...precedents];
      const autres = precedents.reduce((acc, p, i) => (i === index ? acc : acc + p), 0);
      const maximum = Math.max(0, REGLAGES.budgetTotal - autres);
      suivants[index] = Math.min(Math.max(0, valeur), maximum);
      return suivants;
    });
  };

  const ajouter = (index: number, delta: number) => changer(index, (points[index] ?? 0) + delta);

  const repartirEgalement = () => {
    setScelle(false);
    const indexes = eligibles.map((ok, i) => (ok ? i : -1)).filter((i) => i >= 0);
    if (!indexes.length) return;
    const part = Math.floor(REGLAGES.budgetTotal / indexes.length);
    const suivants = sujet.questions.map(() => 0);
    indexes.forEach((i) => {
      suivants[i] = part;
    });
    suivants[indexes[0]] += REGLAGES.budgetTotal - part * indexes.length;
    setPoints(suivants);
  };

  return (
    <div className="space-y-4">
      {/* --------------------------- LE COMPTEUR DE POINTS ----------------------- */}
      <div className="bloc bloc-jaune ombre-dure-jaune p-4 text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.25em] text-gris">Il te reste</p>
        <p className="affiche-large text-[4rem] leading-none text-jaune sm:text-[5.5rem]">
          {restant}
          <span className="text-2xl text-gris"> / {REGLAGES.budgetTotal}</span>
        </p>
        <p className="mt-1 text-xs font-black uppercase tracking-wide text-gris">points de budget à placer</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <GrosBouton variante="neutre" onClick={repartirEgalement}>
            ⚖️ Répartir également
          </GrosBouton>
          <GrosBouton
            variante="neutre"
            onClick={() => {
              setPoints(sujet.questions.map(() => 0));
              setScelle(false);
            }}
          >
            ↺ Tout à zéro
          </GrosBouton>
        </div>
      </div>

      <Panneau>
        <p className="text-xs text-gris">
          Seules les mesures que tu as approuvées (OUI) peuvent recevoir des points. Le peuple arbitre comme un vrai
          budget : {REGLAGES.budgetTotal} points, pas un de plus.
        </p>
      </Panneau>

      {/* ------------------------------ LES MESURES ------------------------------ */}
      <div className="grid gap-3 lg:grid-cols-2">
        {sujet.questions.map((q, i) => {
          const actif = eligibles[i];
          const valeur = points[i] ?? 0;
          return (
            <div key={q.id} className={`bloc p-4 ${actif ? '' : 'opacity-55'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="affiche text-base text-texte sm:text-lg">{q.poste}</p>
                  <p className="mt-1 text-[11px] text-gris">{q.texte}</p>
                </div>
                <p className={`affiche-large shrink-0 text-4xl ${actif ? 'text-jaune' : 'text-gris'}`}>{valeur}</p>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  disabled={!actif || valeur <= 0}
                  onClick={() => ajouter(i, -5)}
                  className="affiche min-h-[3.25rem] w-14 rounded-xl border-[3px] border-bord bg-carte2 text-sm text-texte disabled:opacity-30"
                >
                  −5
                </button>
                <button
                  type="button"
                  disabled={!actif || valeur <= 0}
                  onClick={() => ajouter(i, -1)}
                  className="affiche min-h-[3.25rem] w-14 rounded-xl border-[3px] border-bord bg-carte2 text-sm text-texte disabled:opacity-30"
                >
                  −1
                </button>
                <input
                  type="range"
                  className="curseur mx-1 flex-1"
                  min={0}
                  max={REGLAGES.budgetTotal}
                  value={valeur}
                  disabled={!actif}
                  onChange={(e) => changer(i, Number(e.target.value))}
                  aria-label={`Budget pour ${q.poste}`}
                />
                <button
                  type="button"
                  disabled={!actif || restant <= 0}
                  onClick={() => ajouter(i, 1)}
                  className="affiche min-h-[3.25rem] w-14 rounded-xl bg-jaune text-sm text-black disabled:opacity-30"
                >
                  +1
                </button>
                <button
                  type="button"
                  disabled={!actif || restant <= 0}
                  onClick={() => ajouter(i, 5)}
                  className="affiche min-h-[3.25rem] w-14 rounded-xl bg-jaune text-sm text-black disabled:opacity-30"
                >
                  +5
                </button>
              </div>

              <p className="mt-2 text-[11px] text-gris">
                {!actif
                  ? etat.mesVotes[`${sujet.id}:${q.id}`]
                    ? '🚫 Mesure refusée (NON) : aucun point possible.'
                    : 'Vote d’abord cette question (OUI) pour y investir.'
                  : `${Math.round(q.budgetMoyen)} pts en moyenne chez les votants`}
              </p>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <GrosBouton
          className="w-full"
          disabled={total === 0}
          onClick={() => {
            agir({ type: 'budget', sujetId: sujet.id, points });
            setScelle(true);
          }}
        >
          📤 Envoyer mon budget au peuple {total > 0 ? `(${total} pts)` : ''}
        </GrosBouton>
        {scelle && <p className="affiche text-xs text-jaune">✔ Budget scellé — modifiable jusqu’à la prochaine Refonte</p>}
        {total === 0 && <p className="text-xs text-gris">Déplace au moins un curseur ou touche +1 / +5.</p>}
      </div>
    </div>
  );
}

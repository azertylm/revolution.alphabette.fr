import { useEffect, useMemo, useState } from 'react';
import { useRevolution } from '../contexte';
import { REGLAGES } from '../reglages';
import type { Sujet } from '../types';
import { GrosBouton, Panneau } from '../ui';

/* ==========================================================================
   L'étape « Où investir ? » : 100 points de budget à répartir aux curseurs.
   Seules les mesures approuvées (OUI) peuvent recevoir des points, et la
   somme ne peut jamais dépasser 100 : les curseurs se bloquent tout seuls.
   ========================================================================== */

export function CurseursBudget({ sujet }: { sujet: Sujet }) {
  const { etat, agir } = useRevolution();
  const [points, setPoints] = useState<number[]>(() => etat.mesBudgets[sujet.id] ?? sujet.questions.map(() => 0));
  const [scelle, setScelle] = useState(false);

  useEffect(() => {
    setPoints(etat.mesBudgets[sujet.id] ?? sujet.questions.map(() => 0));
  }, [sujet.id, etat.mesBudgets]);

  const eligibles = useMemo(
    () =>
      sujet.questions.map((q) => etat.mesVotes[`${sujet.id}:${q.id}`] === 'oui'),
    [sujet.questions, etat.mesVotes, sujet.id],
  );

  const total = points.reduce((acc, p) => acc + p, 0);
  const restant = REGLAGES.budgetTotal - total;
  const rienASceller = total === 0;

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
      <Panneau accent="jaune">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gris">Reste à répartir</p>
            <p className="affiche text-6xl text-jaune sm:text-7xl">
              {restant}
              <span className="ml-2 text-2xl text-gris">/ {REGLAGES.budgetTotal}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <GrosBouton variante="neutre" onClick={repartirEgalement}>
              ⚖️ Répartir également
            </GrosBouton>
            <GrosBouton variante="neutre" onClick={() => { setPoints(sujet.questions.map(() => 0)); setScelle(false); }}>
              ↺ Tout remettre à zéro
            </GrosBouton>
          </div>
        </div>
        <p className="mt-2 text-xs text-gris">
          Seules les mesures que tu as approuvées (OUI) peuvent recevoir des points. Le peuple arbitre comme un vrai
          budget : {REGLAGES.budgetTotal} points en tout, pas un de plus.
        </p>
      </Panneau>

      {sujet.questions.map((q, i) => (
        <div
          key={q.id}
          className={`rounded-2xl border p-4 ${
            eligibles[i] ? 'border-bord bg-carte' : 'border-bord bg-carte/50 opacity-60'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="affiche text-sm text-texte">{q.poste}</p>
              <p className="text-[11px] text-gris">{q.texte}</p>
            </div>
            <span className={`affiche text-2xl ${eligibles[i] ? 'text-jaune' : 'text-gris'}`}>{points[i] ?? 0}</span>
          </div>
          <input
            type="range"
            className="curseur mt-3"
            min={0}
            max={REGLAGES.budgetTotal}
            value={points[i] ?? 0}
            disabled={!eligibles[i]}
            onChange={(e) => changer(i, Number(e.target.value))}
            aria-label={`Budget pour ${q.poste}`}
          />
          {!eligibles[i] && (
            <p className="text-[11px] font-bold text-gris">
              {etat.mesVotes[`${sujet.id}:${q.id}`]
                ? 'Mesure refusée (NON) : tu ne peux pas y investir de points.'
                : 'Vote d’abord cette question (OUI) pour pouvoir y investir des points.'}
            </p>
          )}
          {eligibles[i] && <p className="text-[11px] text-gris">{Math.round(q.budgetMoyen)} pts en moyenne chez les votants</p>}
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <GrosBouton
          variante="jaune"
          disabled={rienASceller}
          onClick={() => {
            agir({ type: 'budget', sujetId: sujet.id, points });
            setScelle(true);
          }}
        >
          📤 Envoyer mon budget au peuple
        </GrosBouton>
        {scelle && <span className="text-xs font-bold text-jaune">✔ Budget scellé — modifiable jusqu’à la prochaine Refonte.</span>}
        {rienASceller && <span className="text-xs text-gris">Déplace au moins un curseur.</span>}
      </div>
    </div>
  );
}

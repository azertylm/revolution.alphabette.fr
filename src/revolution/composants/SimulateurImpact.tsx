import { useState } from 'react';
import { PROFILS_SITUATION, PROFILS_STATUT, simulerImpact, type ProfilImpact } from '../education';
import type { Question, Sujet } from '../types';
import { Badge, GrosBouton, Panneau } from '../ui';

/* ==========================================================================
   LE SIMULATEUR D'IMPACT — « 🧮 Et moi ? » (prompt 9).

   Avant de voter sur une exigence, chacun doit pouvoir répondre à une seule
   question : « et moi, ça me coûte quoi ? ». Trois champs suffisent — code
   postal, statut, situation — et l'application rend une estimation en clair,
   toujours motivée et sourcée (données simulées pour le prototype).
   ========================================================================== */

export function SimulateurImpact({
  sujet,
  question,
  onFermer,
}: {
  sujet: Sujet;
  question: Question;
  onFermer: () => void;
}) {
  const [profil, setProfil] = useState<ProfilImpact>({ codePostal: '', statut: 'salarié', situation: 'locataire' });
  const [resultat, setResultat] = useState<ReturnType<typeof simulerImpact> | null>(null);

  const calculer = () => setResultat(simulerImpact(question, sujet, profil));

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-bord bg-carte p-5 sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3">
          <h2 className="affiche text-2xl text-jaune">🧮 Et moi ?</h2>
          <button type="button" onClick={onFermer} className="rounded-lg border border-bord px-3 py-1 text-sm text-gris">
            Fermer
          </button>
        </div>
        <p className="mt-2 text-xs text-gris">
          Trois champs, une estimation. Aucune donnée n’est enregistrée ni transmise : tout se calcule ici, dans ton
          navigateur.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wide text-gris">Code postal</span>
            <input
              value={profil.codePostal}
              onChange={(e) => setProfil({ ...profil, codePostal: e.target.value.replace(/\D/g, '').slice(0, 5) })}
              inputMode="numeric"
              placeholder="31000"
              className="mt-1 w-full rounded-xl border border-bord bg-carte2 p-3 text-sm text-texte outline-none focus:border-jaune"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wide text-gris">Statut</span>
            <select
              value={profil.statut}
              onChange={(e) => setProfil({ ...profil, statut: e.target.value })}
              className="mt-1 w-full rounded-xl border border-bord bg-carte2 p-3 text-sm text-texte outline-none focus:border-jaune"
            >
              {PROFILS_STATUT.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wide text-gris">Situation</span>
            <select
              value={profil.situation}
              onChange={(e) => setProfil({ ...profil, situation: e.target.value })}
              className="mt-1 w-full rounded-xl border border-bord bg-carte2 p-3 text-sm text-texte outline-none focus:border-jaune"
            >
              {PROFILS_SITUATION.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4">
          <GrosBouton onClick={calculer}>Calculer mon impact</GrosBouton>
        </div>

        {resultat && (
          <Panneau accent={resultat.concerne ? 'rouge' : 'jaune'} className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge ton={resultat.concerne ? 'rouge' : 'jaune'}>
                {resultat.concerne ? '✊ Exigence du peuple' : '🔎 Estimation'}
              </Badge>
              <span className="text-[11px] text-gris">données simulées pour le prototype</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl border-2 border-rouge bg-carte2 px-3 py-2">
                <p className="affiche-large text-2xl text-rouge">{resultat.cout}</p>
                <p className="text-[10px] font-black uppercase text-gris">coût estimé</p>
              </div>
              <div className="rounded-xl border-2 border-jaune bg-carte2 px-3 py-2">
                <p className="affiche text-sm leading-tight text-jaune">{resultat.gain}</p>
                <p className="mt-1 text-[10px] font-black uppercase text-gris">ce que ça change</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-texte">{resultat.detail}</p>
            <div className="mt-3">
              <p className="text-[11px] font-black uppercase tracking-wide text-gris">D’où viennent les chiffres</p>
              <ul className="mt-1 space-y-1 text-[11px] text-gris">
                {resultat.sources.map((s) => (
                  <li key={s.url}>
                    🔗{' '}
                    <a href={s.url} target="_blank" rel="noreferrer" className="underline">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Panneau>
        )}
      </div>
    </div>
  );
}

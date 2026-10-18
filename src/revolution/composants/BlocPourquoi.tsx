import { useState } from 'react';
import { useRevolution } from '../contexte';
import { enPhraseFacile } from '../education';
import { REGLAGES } from '../reglages';
import type { Question, Sujet } from '../types';
import { Badge, GrosBouton, Panneau } from '../ui';
import { TexteCitoyen } from './Dictionnaire';
import { SimulateurImpact } from './SimulateurImpact';

/* ==========================================================================
   LA CARTE « POURQUOI C'EST IMPORTANT ? » (prompt 9).

   Trois phrases, jamais plus : la situation aujourd'hui, ce qui change si OUI,
   ce qui change si NON. Aucune opinion, seulement les conséquences. La carte
   n'est jamais verrouillée : n'importe qui peut en proposer une meilleure, et
   c'est le peuple qui tranche (50 % de OUI, 40 votes minimum).
   ========================================================================== */

export function BlocPourquoi({ sujet, question }: { sujet: Sujet; question: Question }) {
  const { etat, agir } = useRevolution();
  const [ouvert, setOuvert] = useState(false);
  const [simu, setSimu] = useState(false);
  const [propose, setPropose] = useState(false);
  const [situation, setSituation] = useState('');
  const [siOui, setSiOui] = useState('');
  const [siNon, setSiNon] = useState('');

  const carte = question.pourquoi;
  if (!carte) return null;

  const facile = etat.accessibilite.lectureFacile;
  const propositions = etat.propositionsCarte.filter((p) => p.questionId === question.id);
  const tousLesVotes = propositions.some((p) => etat.mesVotes[`carte:${p.id}`] || p.retenue);

  const envoyerProposition = () => {
    if (situation.trim().length < 10 || siOui.trim().length < 10 || siNon.trim().length < 10) return;
    agir({
      type: 'proposer-carte',
      sujetId: sujet.id,
      questionId: question.id,
      situation: situation.trim(),
      siOui: siOui.trim(),
      siNon: siNon.trim(),
    });
    setSituation('');
    setSiOui('');
    setSiNon('');
    setPropose(false);
  };

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        aria-expanded={ouvert}
        className="affiche flex w-full items-center justify-between gap-2 rounded-xl border-2 border-jaune bg-carte2 px-3 py-2 text-left text-xs text-jaune"
      >
        <span>❓ Pourquoi c’est important ?</span>
        <span className="text-gris">{ouvert ? '▲ replier' : '▼ voir en 3 phrases'}</span>
      </button>

      {ouvert && (
        <div className="mt-2 space-y-2 rounded-xl border-2 border-bord bg-carte2 p-3">
          <p className="text-sm text-texte">
            <TexteCitoyen texte={facile ? carte.simpleSituation : carte.situation} />
          </p>
          <p className="text-sm font-bold text-jaune">
            <TexteCitoyen texte={facile ? carte.simpleOui : carte.siOui} />
          </p>
          <p className="text-sm font-bold text-rouge">
            <TexteCitoyen texte={facile ? carte.simpleNon : carte.siNon} />
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge ton="gris">version {carte.version}</Badge>
            <span className="text-[10px] text-gris">proposée par {carte.auteur}</span>
            <button
              type="button"
              onClick={() => setSimu(true)}
              className="affiche rounded-lg border-2 border-jaune bg-transparent px-2.5 py-1 text-[11px] text-jaune"
            >
              🧮 Et moi ?
            </button>
            {etat.citoyen && (
              <button
                type="button"
                onClick={() => setPropose((v) => !v)}
                className="affiche rounded-lg border-2 border-bord px-2.5 py-1 text-[11px] text-gris"
              >
                ✏️ Proposer une meilleure explication
              </button>
            )}
          </div>

          {propose && (
            <Panneau accent="jaune">
              <p className="affiche text-xs text-jaune">🌱 Trois phrases, pas une de plus</p>
              <label className="mt-2 block">
                <span className="text-[10px] font-bold uppercase text-gris">Aujourd’hui…</span>
                <textarea
                  value={situation}
                  rows={2}
                  maxLength={200}
                  onChange={(e) => setSituation(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-bord bg-carte2 p-2 text-sm text-texte outline-none focus:border-jaune"
                />
              </label>
              <label className="mt-2 block">
                <span className="text-[10px] font-bold uppercase text-jaune">Si OUI…</span>
                <textarea
                  value={siOui}
                  rows={2}
                  maxLength={200}
                  onChange={(e) => setSiOui(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-bord bg-carte2 p-2 text-sm text-texte outline-none focus:border-jaune"
                />
              </label>
              <label className="mt-2 block">
                <span className="text-[10px] font-bold uppercase text-rouge">Si NON…</span>
                <textarea
                  value={siNon}
                  rows={2}
                  maxLength={200}
                  onChange={(e) => setSiNon(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-bord bg-carte2 p-2 text-sm text-texte outline-none focus:border-jaune"
                />
              </label>
              <p className="mt-2 text-[10px] text-gris">
                Adoptée à {REGLAGES.consensusCarte} % de OUI avec au moins {REGLAGES.participationCarte} votes. La
                version simple (niveau école) est générée automatiquement.
              </p>
              <div className="mt-2">
                <GrosBouton
                  onClick={envoyerProposition}
                  disabled={situation.trim().length < 10 || siOui.trim().length < 10 || siNon.trim().length < 10}
                >
                  Envoyer ma version
                </GrosBouton>
              </div>
            </Panneau>
          )}

          {propositions.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-wide text-gris">
                Versions proposées par le peuple
              </p>
              {propositions.slice(0, 3).map((p) => {
                const cle = `carte:${p.id}`;
                const deja = etat.mesVotes[cle];
                const total = p.oui + p.non + p.sansAvis;
                const ouiPct = p.oui + p.non > 0 ? (p.oui / (p.oui + p.non)) * 100 : 0;
                return (
                  <div key={p.id} className="rounded-xl border border-bord bg-carte p-3">
                    <p className="text-xs text-texte">{p.situation}</p>
                    <p className="mt-1 text-xs text-gris">
                      {p.auteur} · {total} votes · {Math.round(ouiPct)} % de OUI
                    </p>
                    {p.retenue ? (
                      <Badge ton="vert">✅ Adoptée par le peuple</Badge>
                    ) : (
                      <div className="mt-2 grid grid-cols-3 gap-1.5">
                        {(['oui', 'non', 'sans-avis'] as const).map((choix) => (
                          <button
                            key={choix}
                            type="button"
                            disabled={Boolean(deja)}
                            onClick={() => agir({ type: 'voter-carte', propositionId: p.id, choix })}
                            className={`affiche min-h-[2.75rem] rounded-xl text-[11px] ${
                              deja === choix
                                ? 'bg-jaune text-black'
                                : choix === 'oui'
                                  ? 'bg-jaune text-black'
                                  : choix === 'non'
                                    ? 'bg-rouge text-white'
                                    : 'border-2 border-bord bg-carte2 text-gris'
                            } ${deja ? 'opacity-70' : ''}`}
                          >
                            {choix === 'oui' ? 'OUI' : choix === 'non' ? 'NON' : 'SANS AVIS'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {tousLesVotes && <p className="text-[10px] text-gris">Merci : ton vote est enregistré, modifiable jusqu’à la Refonte.</p>}
        </div>
      )}

      {simu && <SimulateurImpact sujet={sujet} question={question} onFermer={() => setSimu(false)} />}
    </div>
  );
}

/** Version « lecture facile » d'un texte quelconque. */
export function TexteFacile({ texte }: { texte: string }) {
  const { etat } = useRevolution();
  const rendu = etat.accessibilite.lectureFacile ? enPhraseFacile(texte) : texte;
  return (
    <span className={etat.accessibilite.lectureFacile ? 'lecture-facile' : undefined}>
      <TexteCitoyen texte={rendu} />
    </span>
  );
}

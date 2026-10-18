import { useState } from 'react';
import { useRevolution } from '../contexte';
import { REGLAGES } from '../reglages';
import { dateLisible } from '../outils';
import { Badge, Etiquette, GrosBouton, Panneau, TitreSection } from '../ui';

/* ==========================================================================
   NOTRE CONTRAT (prompt 8) — les 5 règles du jeu, écrites une fois pour toutes.

   Le cœur de l'application : les règles qui font que le vote est juste. Elles
   n'appartiennent à personne — pas au développeur, pas à un élu, pas à une
   majorité du moment. Pour en changer une, il faut 75 % de OUI et au moins
   autant de votes exprimés que le seuil fixé. Tant que le peuple n'a rien
   changé, le compteur affiche fièrement : 0.
   ========================================================================== */

export function NotreContrat() {
  const { etat, agir } = useRevolution();
  const contrat = etat.contrat;

  const [ouvert, setOuvert] = useState(false);
  const [numero, setNumero] = useState(0);
  const [titre, setTitre] = useState('');
  const [texte, setTexte] = useState('');

  const propositions = contrat.propositions;
  const enCours = propositions.filter((p) => !p.adoptee);

  const envoyer = () => {
    if (!etat.citoyen) return;
    if (titre.trim().length < 4 || texte.trim().length < 20) return;
    agir({ type: 'proposer-regle', numero, titre: titre.trim(), texte: texte.trim() });
    setTitre('');
    setTexte('');
    setNumero(0);
    setOuvert(false);
  };

  return (
    <div className="space-y-5">
      {/* ------------------------------ LE COMPTEUR ----------------------------- */}
      <section className="bloc bloc-rouge ombre-dure-rouge p-4 text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gris">
          Règles modifiées par le peuple
        </p>
        <p className="affiche-large mt-1 text-6xl text-rouge sm:text-7xl">{contrat.modifiees}</p>
        <p className="mt-2 text-xs text-gris">
          Verrouillé le {dateLisible(contrat.verrouilleLe)}. Tant que personne ne change les règles, ce zéro reste
          affiché : c’est une fierté, pas un manque.
        </p>
      </section>

      <Panneau accent="jaune">
        <TitreSection>📜 Les 5 règles du jeu</TitreSection>
        <p className="text-xs text-gris">
          Elles ne s’écrivent pas à la main : elles se votent. Pour modifier une règle ou en ajouter une, il faut{' '}
          <strong>{REGLAGES.consensusRegle} % de OUI</strong> avec au moins{' '}
          <strong>{REGLAGES.participationRegle} votes exprimés</strong>. Chaque tentative — adoptée ou non — laisse une
          ligne dans le livre public.
        </p>
        <ul className="mt-3 space-y-2">
          {contrat.regles.map((r) => (
            <li key={r.numero} className="rounded-xl border-2 border-jaune bg-carte2 p-3">
              <div className="flex items-center gap-2">
                <span className="affiche text-2xl text-jaune">{r.numero}</span>
                <span className="affiche text-sm text-texte">{r.titre}</span>
              </div>
              <p className="mt-1 text-sm text-texte">{r.texte}</p>
            </li>
          ))}
        </ul>

        <div className="mt-4">
          {!ouvert ? (
            <GrosBouton onClick={() => (etat.citoyen ? setOuvert(true) : undefined)} variante="neutre">
              ✏️ Proposer une modification
            </GrosBouton>
          ) : (
            <Panneau accent="jaune">
              <p className="affiche text-sm text-jaune">✏️ Ta proposition de règle</p>
              <label className="mt-2 block">
                <span className="text-[10px] font-bold uppercase text-gris">Règle visée</span>
                <select
                  value={numero}
                  onChange={(e) => setNumero(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-bord bg-carte2 p-2 text-sm text-texte outline-none focus:border-jaune"
                >
                  <option value={0}>➕ Une nouvelle règle</option>
                  {contrat.regles.map((r) => (
                    <option key={r.numero} value={r.numero}>
                      Règle {r.numero} — {r.titre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mt-2 block">
                <span className="text-[10px] font-bold uppercase text-gris">Titre court</span>
                <input
                  value={titre}
                  maxLength={60}
                  onChange={(e) => setTitre(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-bord bg-carte2 p-2 text-sm text-texte outline-none focus:border-jaune"
                />
              </label>
              <label className="mt-2 block">
                <span className="text-[10px] font-bold uppercase text-gris">Texte de la règle</span>
                <textarea
                  value={texte}
                  rows={3}
                  maxLength={300}
                  onChange={(e) => setTexte(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-bord bg-carte2 p-2 text-sm text-texte outline-none focus:border-jaune"
                />
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                <GrosBouton onClick={envoyer} disabled={titre.trim().length < 4 || texte.trim().length < 20}>
                  Soumettre au vote du peuple
                </GrosBouton>
                <GrosBouton variante="neutre" onClick={() => setOuvert(false)}>
                  Annuler
                </GrosBouton>
              </div>
            </Panneau>
          )}
          {!etat.citoyen && (
            <p className="mt-2 text-[11px] text-gris">
              Pour proposer une modification, il faut d’abord être identifié comme citoyen.
            </p>
          )}
        </div>
      </Panneau>

      {/* --------------------------- LES PROPOSITIONS EN COURS ------------------ */}
      <Panneau>
        <TitreSection droite={<Badge ton="jaune">{enCours.length}</Badge>}>
          🗳️ Modifications soumises au peuple
        </TitreSection>
        {propositions.length === 0 ? (
          <p className="text-sm text-gris">
            Aucune modification proposée pour l’instant : les 5 règles tiennent parce que personne n’a jugé utile de
            les changer.
          </p>
        ) : (
          <ul className="space-y-3">
            {propositions.slice(0, 8).map((p) => {
              const cle = `regle:${p.id}`;
              const deja = etat.mesVotes[cle];
              const exprimes = p.oui + p.non;
              const ouiPct = exprimes > 0 ? (p.oui / exprimes) * 100 : 0;
              const total = exprimes + p.sansAvis;
              return (
                <li key={p.id} className="rounded-xl border border-bord bg-carte2 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge ton={p.adoptee ? 'vert' : 'gris'}>{p.adoptee ? '✅ Adoptée' : '⏳ En vote'}</Badge>
                    <Etiquette>{p.numero === 0 ? 'nouvelle règle' : `règle ${p.numero}`}</Etiquette>
                    <span className="text-[10px] text-gris">par {p.auteur}</span>
                  </div>
                  <p className="mt-2 affiche text-sm text-texte">{p.titre}</p>
                  <p className="mt-1 text-xs text-gris">{p.texte}</p>
                  <p className="mt-2 text-[11px] font-bold text-gris">
                    {Math.round(ouiPct)} % de OUI · {total}/{REGLAGES.participationRegle} votes exprimés
                  </p>
                  {p.adoptee ? (
                    <p className="mt-1 text-[11px] text-emerald-400">
                      Cette règle fait désormais partie de notre contrat.
                    </p>
                  ) : (
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                      {(['oui', 'non', 'sans-avis'] as const).map((choix) => (
                        <button
                          key={choix}
                          type="button"
                          disabled={Boolean(deja)}
                          onClick={() => agir({ type: 'voter-regle', propositionId: p.id, choix })}
                          className={`affiche min-h-[2.75rem] rounded-xl text-[11px] ${
                            deja === choix
                              ? 'bg-jaune text-black'
                              : choix === 'oui'
                                ? 'bg-jaune text-black'
                                : choix === 'non'
                                  ? 'bg-rouge text-white'
                                  : 'border-2 border-bord bg-carte text-gris'
                          } ${deja ? 'opacity-70' : ''}`}
                        >
                          {choix === 'oui' ? 'OUI' : choix === 'non' ? 'NON' : 'SANS AVIS'}
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Panneau>

      <Panneau>
        <TitreSection>📖 Pourquoi un livre, un contrat, des reçus ?</TitreSection>
        <ul className="space-y-2 text-xs text-gris">
          <li>
            <strong className="text-texte">Le livre public</strong> : chaque événement est horodaté et recalculable. On
            n’efface jamais une ligne, on n’en ajoute que.
          </li>
          <li>
            <strong className="text-texte">Le contrat</strong> : les règles qui protègent le vote. Un développeur, un élu
            ou une majorité du moment ne peut pas les changer seul.
          </li>
          <li>
            <strong className="text-texte">Les reçus</strong> : ton vote te rend un code court. Tu peux le faire vérifier
            sans que personne sache pour qui ou quoi tu as voté.
          </li>
          <li>
            <strong className="text-texte">Aucune donnée de plus</strong> : pas d’IP, pas de géolocalisation, pas de
            traçage. Un pseudonyme, un code PIN, ta région — et c’est tout.
          </li>
        </ul>
      </Panneau>
    </div>
  );
}

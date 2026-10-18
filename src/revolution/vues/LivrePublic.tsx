import { useMemo, useState } from 'react';
import { useRevolution } from '../contexte';
import {
  TYPES_LIVRE,
  livreEnJSON,
  recusEnCSV,
  resultatsEnCSV,
  resultatsEnJSON,
  statsConfiance,
  telecharger,
  texteRecu,
} from '../livre';
import { cyclesDeLUrne, recompter, tailleUrne, urneEnCSV, verifierCoherence } from '../moteur-decompte';
import { useNav } from '../navigation';
import type { TypeLivre } from '../types';
import { dateLisible, heureLisible, nombre, pct } from '../outils';
import { Badge, Etiquette, GrosBouton, Panneau, TitreSection } from '../ui';

/* ==========================================================================
   LE LIVRE PUBLIC (prompt 8) — « ce que le peuple vote est vérifiable ».

   Un journal append-only : chaque refonte, chaque passage en exigence, chaque
   question écartée, chaque vote « à vérifier », chaque règle modifiée y laisse
   une ligne. On n'efface jamais rien. N'importe qui peut exporter, recalculer
   et comparer. Et surtout : le livre ne dit JAMAIS qui a voté quoi.
   ========================================================================== */

export function LivrePublic() {
  const { etat } = useRevolution();
  const nav = useNav();
  const [filtre, setFiltre] = useState<TypeLivre | 'tout'>('tout');

  const stats = useMemo(() => statsConfiance(etat), [etat]);
  const coherence = useMemo(() => verifierCoherence(etat.sujets, etat.urne), [etat.sujets, etat.urne]);
  const lignes = filtre === 'tout' ? etat.livre : etat.livre.filter((e) => e.type === filtre);
  const cycles = cyclesDeLUrne(etat.urne);

  const typesPresents = useMemo(() => {
    const presents = new Set(etat.livre.map((e) => e.type));
    return (Object.keys(TYPES_LIVRE) as TypeLivre[]).filter((t) => presents.has(t));
  }, [etat.livre]);

  // Démonstration rejouable : on recalcule une question depuis les lignes brutes.
  const exemple = etat.sujets[0]?.questions[0];
  const recalcul = exemple ? recompter(etat.urne)[exemple.id] : undefined;

  return (
    <div className="space-y-5">
      {/* --------------------------- LE BANDEAU DE CONFIANCE -------------------- */}
      <section className="bloc bloc-jaune ombre-dure-jaune p-4 text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gris">Le livre public</p>
        <p className="affiche-large mt-1 text-4xl text-jaune sm:text-5xl">{nombre(stats.lignesLivre)}</p>
        <p className="mt-1 text-xs font-black uppercase tracking-wide text-gris">
          lignes publiées · aucune n’est jamais effacée
        </p>
        <p className="mt-2 text-sm text-texte">
          « Ce n’est pas la parole du peuple qu’il faut protéger, c’est sa trace. »
        </p>
      </section>

      {/* --------------------------- LES CHIFFRES DE CONFIANCE ------------------ */}
      <Panneau>
        <TitreSection
          droite={
            <Badge ton={stats.pctAVerifier > 30 ? 'rouge' : 'vert'}>
              {pct(stats.pctAVerifier)} à vérifier
            </Badge>
          }
        >
          🔎 Confiance, en clair
        </TitreSection>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-xl border border-bord bg-carte2 px-3 py-2 text-center">
            <p className="affiche text-lg text-jaune">{nombre(stats.votesTotaux)}</p>
            <p className="text-[10px] font-bold uppercase text-gris">votes comptés</p>
          </div>
          <div className="rounded-xl border border-bord bg-carte2 px-3 py-2 text-center">
            <p className="affiche text-lg text-texte">{nombre(stats.votesVerifies)}</p>
            <p className="text-[10px] font-bold uppercase text-gris">votes de citoyens vérifiés</p>
          </div>
          <div className="rounded-xl border border-bord bg-carte2 px-3 py-2 text-center">
            <p className="affiche text-lg text-rouge">{nombre(stats.votesAVerifier)}</p>
            <p className="text-[10px] font-bold uppercase text-gris">à vérifier</p>
          </div>
          <div className="rounded-xl border border-bord bg-carte2 px-3 py-2 text-center">
            <p className="affiche text-lg text-texte">{nombre(stats.refontes)}</p>
            <p className="text-[10px] font-bold uppercase text-gris">refontes publiées</p>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-gris">
          Les votes « à vérifier » (motifs suspects : même seconde, série rapide, trajectoire identique) sont
          <strong> comptés mais marqués</strong>. Ils ne sont jamais supprimés. Au-delà de 30 %, le résultat affiche
          « ⚠️ Résultat à confirmer ».
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Etiquette>📜 {nombre(stats.lignesLivre)} lignes au livre</Etiquette>
          <Etiquette>🔧 {etat.contrat.modifiees} règle(s) modifiée(s) par le peuple</Etiquette>
          <button
            type="button"
            onClick={() => nav.aller({ vue: 'contrat' })}
            className="affiche rounded-lg border-2 border-jaune px-2.5 py-1 text-[11px] text-jaune"
          >
            📜 Notre contrat →
          </button>
        </div>
      </Panneau>

      {/* --------------------------- LE MOTEUR REJOUABLE ------------------------ */}
      <Panneau>
        <TitreSection droite={<Badge ton="gris">{nombre(tailleUrne(etat.urne))} lignes brutes</Badge>}>
          🧮 Recalculer soi-même
        </TitreSection>
        <p className="text-xs text-gris">
          Le décompte n’est pas un secret : les votes sont écrits en insertion pure dans une table partitionnée par
          cycle, et un module isolé les additionne. N’importe qui peut refaire le calcul et retrouver les mêmes
          chiffres.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-bord bg-carte2 px-3 py-2 text-center">
            <p className="affiche text-lg text-jaune">{nombre(cycles.length)}</p>
            <p className="text-[10px] font-bold uppercase text-gris">cycles partitionnés</p>
          </div>
          <div className="rounded-xl border border-bord bg-carte2 px-3 py-2 text-center">
            <p className="affiche text-lg text-texte">{nombre(coherence.questionsVerifiees)}</p>
            <p className="text-[10px] font-bold uppercase text-gris">questions vérifiées</p>
          </div>
          <div className="rounded-xl border border-bord bg-carte2 px-3 py-2 text-center">
            <p className={`affiche text-lg ${coherence.coherent ? 'text-emerald-400' : 'text-rouge'}`}>
              {coherence.coherent ? '✅ cohérent' : '⚠️ écart'}
            </p>
            <p className="text-[10px] font-bold uppercase text-gris">affichage vs recalcul</p>
          </div>
        </div>
        {exemple && recalcul && (
          <p className="mt-3 text-[11px] text-gris">
            Exemple rejoué — « {exemple.texte.slice(0, 60)}… » : OUI <strong>{nombre(recalcul.oui)}</strong> · NON{' '}
            <strong>{nombre(recalcul.non)}</strong> · sans avis <strong>{nombre(recalcul.sansAvis)}</strong> · total{' '}
            <strong>{nombre(recalcul.total)}</strong>.
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <GrosBouton
            variante="neutre"
            onClick={() => telecharger('urne-revolution.csv', urneEnCSV(etat.urne), 'text/csv')}
          >
            ⬇️ L’urne brute (CSV)
          </GrosBouton>
        </div>
      </Panneau>

      {/* --------------------------- EXPORTS OUVERTS ---------------------------- */}
      <Panneau>
        <TitreSection>📤 Exports ouverts</TitreSection>
        <p className="text-xs text-gris">
          Tous les résultats, tout le livre, tous tes reçus : des fichiers que tu gardes et que tu peux vérifier
          toi-même, à froid, avec n’importe quel tableur.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <GrosBouton variante="neutre" onClick={() => telecharger('resultats-revolution.csv', resultatsEnCSV(etat), 'text/csv')}>
            ⬇️ Résultats (CSV)
          </GrosBouton>
          <GrosBouton variante="neutre" onClick={() => telecharger('resultats-revolution.json', resultatsEnJSON(etat), 'application/json')}>
            ⬇️ Résultats (JSON)
          </GrosBouton>
          <GrosBouton variante="neutre" onClick={() => telecharger('livre-public.json', livreEnJSON(etat), 'application/json')}>
            ⬇️ Le livre public (JSON)
          </GrosBouton>
          {etat.recus.length > 0 && (
            <GrosBouton variante="neutre" onClick={() => telecharger('mes-recus.csv', recusEnCSV(etat.recus), 'text/csv')}>
              ⬇️ Mes reçus de vote (CSV)
            </GrosBouton>
          )}
        </div>
      </Panneau>

      {/* --------------------------- MES REÇUS DE VOTE -------------------------- */}
      <Panneau accent="jaune">
        <TitreSection droite={<Badge ton="jaune">{etat.recus.length}</Badge>}>🧾 Mes reçus de vote</TitreSection>
        <p className="text-xs text-gris">
          Chaque vote te rend un code court (type <strong>RVL-7F3K</strong>). Il prouve ton vote auprès du support — et
          de toi seul. Personne ne peut relier un code à une personne dans le livre public.
        </p>
        {etat.recus.length === 0 ? (
          <p className="mt-3 text-sm text-gris">Aucun reçu encore : vote sur une question et ton premier code apparaît ici.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {etat.recus.slice(0, 12).map((r) => (
              <li key={`${r.code}-${r.questionId}`} className="rounded-xl border border-bord bg-carte2 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="affiche text-sm text-jaune">{r.code}</span>
                  <Badge ton={r.choix === 'oui' ? 'jaune' : r.choix === 'non' ? 'rouge' : 'gris'}>
                    {r.choix === 'oui' ? 'OUI' : r.choix === 'non' ? 'NON' : 'SANS AVIS'}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-texte">{r.questionTexte}</p>
                <p className="mt-1 text-[11px] text-gris">
                  {dateLisible(r.date)} · {heureLisible(r.date)} · cycle {r.cycle} · {r.sujetNom}
                  {r.budget !== undefined ? ` · budget ${r.budget} pts` : ''}
                </p>
                <p className="mt-1 text-[11px] text-gris">{texteRecu(r)}</p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[11px] text-gris">
          🔒 Le livre public ne contient <strong>jamais</strong> qui a voté quoi : uniquement des totaux, des dates et
          des codes de contrôle.
        </p>
      </Panneau>

      {/* --------------------------- LE JOURNAL APPEND-ONLY --------------------- */}
      <Panneau>
        <TitreSection droite={<Badge ton="gris">{nombre(lignes.length)} lignes</Badge>}>
          📖 Toute l’histoire, dans l’ordre
        </TitreSection>

        <div className="defile-x">
          <button
            type="button"
            onClick={() => setFiltre('tout')}
            className={`affiche rounded-xl border-2 px-3 py-1.5 text-[11px] ${
              filtre === 'tout' ? 'border-jaune bg-jaune text-black' : 'border-bord bg-carte2 text-gris'
            }`}
          >
            Tout
          </button>
          {typesPresents.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFiltre(t)}
              className={`affiche rounded-xl border-2 px-3 py-1.5 text-[11px] ${
                filtre === t ? 'border-jaune bg-jaune text-black' : 'border-bord bg-carte2 text-gris'
              }`}
            >
              {TYPES_LIVRE[t].emoji} {TYPES_LIVRE[t].label}
            </button>
          ))}
        </div>

        <ul className="mt-3 space-y-2">
          {lignes.slice(0, 60).map((e) => {
            const type = TYPES_LIVRE[e.type];
            return (
              <li key={e.id} className="rounded-xl border border-bord bg-carte2 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="affiche text-[11px] text-jaune">
                    {type.emoji} {type.label}
                  </span>
                  <span className="text-[10px] text-gris">
                    {dateLisible(e.date)} · {heureLisible(e.date)} · cycle {e.cycle}
                  </span>
                </div>
                <p className="mt-1 text-sm text-texte">{e.texte}</p>
                {e.suspect && <Badge ton="rouge" className="mt-1">⚠️ Vote à vérifier — compté, jamais supprimé</Badge>}
                {e.sujetId && (
                  <button
                    type="button"
                    onClick={() => nav.aller({ vue: 'sujet', sujetId: e.sujetId, questionId: e.questionId })}
                    className="mt-2 text-[11px] font-bold text-jaune underline"
                  >
                    Voir le sujet concerné →
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        {lignes.length > 60 && (
          <p className="mt-2 text-[11px] text-gris">… {nombre(lignes.length - 60)} lignes plus anciennes, exportables ci-dessus.</p>
        )}
      </Panneau>
    </div>
  );
}

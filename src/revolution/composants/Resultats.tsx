import { useRevolution } from '../contexte';
import { exigences, soutienSujet } from '../moteur';
import { REGLAGES } from '../reglages';
import { nomRegion } from '../regions';
import type { Question, Sujet } from '../types';
import { nombre, pct, pourcentageRegion, statsQuestion } from '../outils';
import { Badge, Etiquette, GrosBouton, Jauge, Panneau, TitreSection } from '../ui';
import { EtatQuestionBadge } from './CarresVote';
import { TexteCitoyen } from './Dictionnaire';

/* ==========================================================================
   LES RÉSULTATS — « La voix du peuple ».
   Des chiffres énormes, lisibles à un mètre, et le détail question par
   question : chez toi, la moyenne France, la part de budget, l'état de
   l'exigence.
   ========================================================================== */

/** Ma position face aux autres, en gros. */
function MaPosition({ question, cle }: { question: Question; cle: string }) {
  const { etat } = useRevolution();
  const mon = etat.mesVotes[cle] ?? null;
  const st = statsQuestion(question);
  if (!mon) {
    return (
      <p className="affiche text-[12px] text-gris">
        Tu n’as pas encore voté ici —{' '}
        <span className="text-jaune">{Math.round(Math.max(st.ouiPct, st.nonPct))} % du peuple attend ton avis</span>
      </p>
    );
  }
  const valeur = mon === 'oui' ? st.ouiPct : mon === 'non' ? st.nonPct : st.sansPct;
  const majoritaire = valeur >= 50;
  return (
    <p className={`affiche text-[13px] ${majoritaire ? 'text-jaune' : 'text-gris'}`}>
      {majoritaire
        ? `✊ Tu es avec le peuple — ${Math.round(valeur)} % ont voté comme toi`
        : `↔️ Tu es minoritaire — ${Math.round(valeur)} % ont voté comme toi`}
    </p>
  );
}

/** Vote de satisfaction du peuple sur la réponse de l'État. */
function VoteSatisfaction({ sujet, question }: { sujet: Sujet; question: Question }) {
  const { agir, etat } = useRevolution();
  if (question.statut === 'relancee') {
    return (
      <p className="hachures mt-3 rounded-xl border-[3px] border-rouge p-3 text-xs font-black text-texte">
        Plus de {REGLAGES.satisfactionRejet} % du peuple n’est pas satisfait : l’exigence est relancée avec priorité
        renforcée et repart au vote.
      </p>
    );
  }
  if (!question.satisfaction) return null;
  const total = question.satisfaction.satisfait + question.satisfaction.pasSatisfait;
  const cle = `${sujet.id}:${question.id}`;
  const aVote = etat.mesVotes[cle];
  return (
    <div className="mt-3 rounded-xl border-[3px] border-bord bg-carte2 p-3">
      <p className="affiche text-sm text-texte">⚪ L’État a répondu : es-tu satisfait ?</p>
      <p className="mt-1 text-[11px] text-gris">
        {nombre(total)} citoyens ont répondu · {pct((question.satisfaction.pasSatisfait / Math.max(1, total)) * 100)} de
        NON
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={Boolean(aVote)}
          onClick={() => agir({ type: 'satisfaction', sujetId: sujet.id, questionId: question.id, satisfait: true })}
          className="affiche min-h-[3.25rem] rounded-xl bg-jaune text-sm text-black disabled:opacity-40"
        >
          ✅ Satisfait
        </button>
        <button
          type="button"
          disabled={Boolean(aVote)}
          onClick={() => agir({ type: 'satisfaction', sujetId: sujet.id, questionId: question.id, satisfait: false })}
          className="affiche min-h-[3.25rem] rounded-xl bg-rouge text-sm text-white disabled:opacity-40"
        >
          ❌ Pas satisfait
        </button>
      </div>
      {aVote && <p className="mt-2 text-[11px] text-gris">C’est compté, merci.</p>}
    </div>
  );
}

export function Resultats({ sujet }: { sujet: Sujet }) {
  const { etat } = useRevolution();
  const regionId = etat.citoyen?.region ?? 'occitanie';
  const exigencesSujet = sujet.questions.filter((q) => q.etat === 'exigence');
  const consensus = (exigencesSujet.length / Math.max(1, sujet.questions.length)) * 100;
  const partage = etat.partages[sujet.id];
  const maxBudget = Math.max(...sujet.questions.map((q) => q.budgetMoyen), 1);

  return (
    <div className="space-y-4">
      {/* ---------------------------- LES 4 GRANDS CHIFFRES ---------------------- */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="bloc bloc-jaune ombre-dure-jaune px-3 py-4 text-center">
          <p className="affiche-large text-4xl text-jaune">{nombre(sujet.votants)}</p>
          <p className="text-[10px] font-black uppercase tracking-wide text-gris">votants</p>
        </div>
        <div className="bloc px-3 py-4 text-center">
          <p className="affiche-large text-4xl text-texte">{nombre(sujet.verifies)}</p>
          <p className="text-[10px] font-black uppercase tracking-wide text-gris">vérifiés</p>
        </div>
        <div className="bloc px-3 py-4 text-center">
          <p className="affiche-large text-4xl text-gris">{nombre(sujet.archives)}</p>
          <p className="text-[10px] font-black uppercase tracking-wide text-gris">archivés</p>
        </div>
        <div className="bloc bloc-rouge ombre-dure-rouge px-3 py-4 text-center">
          <p className="affiche-large text-4xl text-rouge">{Math.round(consensus)}%</p>
          <p className="text-[10px] font-black uppercase tracking-wide text-gris">du sujet en exigence</p>
        </div>
      </div>

      {/* ------------------------------ CONSENSUS -------------------------------- */}
      <Panneau>
        <TitreSection droite={<Badge ton="jaune">{pct(soutienSujet(sujet) * 100)} de OUI</Badge>}>
          Consensus du peuple
        </TitreSection>
        <Jauge
          oui={sujet.questions.reduce((acc, q) => acc + q.oui, 0)}
          non={sujet.questions.reduce((acc, q) => acc + q.non, 0)}
          sansAvis={sujet.questions.reduce((acc, q) => acc + q.sansAvis, 0)}
          hauteur={36}
        />
        <p className="mt-3 text-[11px] text-gris">
          Au-delà de {REGLAGES.consensusExigence} % de OUI, une question devient une exigence et rejoint le cahier des
          doléances. En dessous de {REGLAGES.consensusEcartee} % de OUI… elle est écartée par le peuple.
        </p>
        {partage && (
          <p className="mt-2 affiche text-xs text-jaune">
            📣 Ton lien a fait voter {nombre(partage.votes)} personnes ({partage.lien})
          </p>
        )}
      </Panneau>

      {/* ------------------------- QUESTION PAR QUESTION ------------------------- */}
      <TitreSection droite={<Badge ton="gris">{sujet.questions.length} questions</Badge>}>Le détail, question par question</TitreSection>

      <div className="grid gap-4 lg:grid-cols-2">
        {sujet.questions.map((q, index) => {
          const st = statsQuestion(q);
          const local = pourcentageRegion(st.ouiPct, `${sujet.id}-${index}`, regionId);
          const ecart = Math.round(local - st.ouiPct);
          return (
            <article
              key={q.id}
              className={`bloc p-4 ${q.etat === 'exigence' ? 'bloc-rouge' : q.etat === 'ecartee' ? 'opacity-70' : ''}`}
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="affiche text-xs text-gris">
                  {index + 1}/{sujet.questions.length}
                </span>
                <EtatQuestionBadge question={q} />
              </div>
              <p className="affiche text-lg text-texte sm:text-xl">
                <TexteCitoyen texte={q.texte} />
              </p>

              {/* Les trois pourcentages, énormes. */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-xl border-[3px] border-jaune bg-carte2 px-2 py-2 text-center">
                  <p className="affiche-large text-3xl text-jaune sm:text-4xl">{Math.round(st.ouiPct)}%</p>
                  <p className="text-[10px] font-black uppercase text-gris">OUI · {nombre(q.oui)}</p>
                </div>
                <div className="rounded-xl border-[3px] border-rouge bg-carte2 px-2 py-2 text-center">
                  <p className="affiche-large text-3xl text-rouge sm:text-4xl">{Math.round(st.nonPct)}%</p>
                  <p className="text-[10px] font-black uppercase text-gris">NON · {nombre(q.non)}</p>
                </div>
                <div className="rounded-xl border-[3px] border-bord bg-carte2 px-2 py-2 text-center">
                  <p className="affiche-large text-3xl text-texte sm:text-4xl">{Math.round(st.sansPct)}%</p>
                  <p className="text-[10px] font-black uppercase text-gris">sans avis</p>
                </div>
              </div>

              <div className="mt-3">
                <Jauge oui={q.oui} non={q.non} sansAvis={q.sansAvis} hauteur={24} />
              </div>

              {/* Chez toi / moyenne France : deux blocs face à face. */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl border-2 border-bord bg-carte2 p-3">
                  <p className="text-[10px] font-black uppercase tracking-wide text-gris">Chez toi · {nomRegion(regionId)}</p>
                  <p className="affiche-large text-2xl text-jaune">{Math.round(local)}%</p>
                  <p className="text-[10px] font-bold text-gris">
                    {ecart >= 0 ? '+' : ''}
                    {ecart} points vs la moyenne
                  </p>
                </div>
                <div className="rounded-xl border-2 border-bord bg-carte2 p-3">
                  <p className="text-[10px] font-black uppercase tracking-wide text-gris">Moyenne France</p>
                  <p className="affiche-large text-2xl text-texte">{Math.round(st.ouiPct)}%</p>
                  <p className="text-[10px] font-bold text-gris">{nombre(st.total)} votants</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <span className="affiche text-xs text-jaune-clair">
                  💰 {Math.round(q.budgetMoyen)} pts de budget moyen
                </span>
                <Etiquette>{q.poste}</Etiquette>
              </div>

              <div className="mt-2">
                <MaPosition question={q} cle={`${sujet.id}:${q.id}`} />
              </div>

              <VoteSatisfaction sujet={sujet} question={q} />
            </article>
          );
        })}
      </div>

      {/* ---------------------------- BUDGET DU PEUPLE --------------------------- */}
      <Panneau>
        <TitreSection>💰 Où le peuple veut mettre l’argent</TitreSection>
        <ul className="space-y-3">
          {sujet.questions.map((q) => (
            <li key={q.id}>
              <div className="flex items-center justify-between gap-3">
                <span className="affiche text-xs text-texte">{q.poste}</span>
                <span className="affiche text-lg text-jaune">{Math.round(q.budgetMoyen)} pts</span>
              </div>
              <div className="mt-1 h-4 w-full overflow-hidden rounded-full bg-bord">
                <div className="h-full bg-jaune" style={{ width: `${(q.budgetMoyen / maxBudget) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-gris">
          {nombre(sujet.budgetVotants)} citoyens ont scellé une répartition. Total distribué :{' '}
          {Math.round(sujet.questions.reduce((acc, q) => acc + q.budgetMoyen, 0))} points sur {REGLAGES.budgetTotal}.
        </p>
      </Panneau>

      {/* ------------------------------ TRANSPARENCE ----------------------------- */}
      <Panneau>
        <TitreSection>🔎 Transparence totale</TitreSection>
        <p className="text-xs text-gris">
          Tous les compteurs sont publics, y compris les votes archivés pour suspicion : rien n’est jamais effacé.
          {exigences(etat, { niveau: sujet.niveau, territoire: sujet.territoire }).length > 0 &&
            ` ${exigences(etat, { niveau: sujet.niveau, territoire: sujet.territoire }).length} exigence(s) de ce périmètre sont déjà au cahier des doléances.`}
        </p>
        <div className="mt-3">
          <GrosBouton variante="neutre" onClick={() => window.print()}>
            🖨️ Imprimer ces résultats
          </GrosBouton>
        </div>
      </Panneau>
    </div>
  );
}

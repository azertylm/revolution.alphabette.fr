import { useRevolution } from '../contexte';
import { exigences, soutienSujet } from '../moteur';
import { nomRegion } from '../regions';
import { REGLAGES } from '../reglages';
import type { Question, Sujet } from '../types';
import { nombre, pct, pourcentageRegion, statsQuestion, totalVotes } from '../outils';
import { Badge, Jauge, JaugeQuestion, Panneau, TitreSection } from '../ui';

/** La position de mon propre vote par rapport à la moyenne du peuple. */
function MaPosition({ question }: { question: Question }) {
  const { etat } = useRevolution();
  const mon = etat.mesVotes[question.id] ?? null;
  if (!mon) return null;
  const st = statsQuestion(question);
  const pourcentage = mon === 'oui' ? st.ouiPct : mon === 'non' ? st.nonPct : st.sansPct;
  const majoritaire = pourcentage >= 50;
  return (
    <p className={`mt-1 text-[11px] font-bold ${majoritaire ? 'text-jaune' : 'text-gris'}`}>
      {majoritaire
        ? `Tu es dans le sens du peuple (${Math.round(pourcentage)} % partagent ton avis).`
        : `Tu es minoritaire — ${Math.round(pourcentage)} % partagent ton avis.`}
    </p>
  );
}

function EtatQuestionBadge({ question }: { question: Question }) {
  const { etat } = useRevolution();
  if (question.etat === 'exigence') {
    const statuts: Record<string, { texte: string; ton: 'jaune' | 'rouge' | 'gris' | 'vert' }> = {
      'a-presenter': { texte: '🟡 À présenter', ton: 'jaune' },
      presentee: { texte: '🔴 Présentée', ton: 'rouge' },
      'en-reponse': { texte: '🔵 En réponse', ton: 'gris' },
      relancee: { texte: '✊ Relancée par le peuple', ton: 'rouge' },
      satisfaite: { texte: '✅ Satisfaite', ton: 'vert' },
    };
    const statut = statuts[question.statut ?? 'a-presenter'] ?? statuts['a-presenter'];
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Badge ton="rouge">✊ Exigence du peuple</Badge>
        <Badge ton={statut.ton}>{statut.texte}</Badge>
        {question.reponse && <Badge ton="gris">Réponse de l’État : {question.reponse}</Badge>}
      </div>
    );
  }
  if (question.etat === 'ecartee') return <Badge ton="gris">🚫 Écartée par le peuple</Badge>;
  const st = statsQuestion(question);
  if (st.ouiPct >= REGLAGES.seuilBascule && st.total > 0)
    return <Badge ton="jaune">🟡 À {pct(st.ouiPct)} de OUI — le seuil des {REGLAGES.consensusExigence} % est proche</Badge>;
  return <Badge ton="gris">En vote</Badge>;
}

/** Le vote de satisfaction du peuple sur la réponse de l'État. */
function VoteSatisfaction({ sujet, question }: { sujet: Sujet; question: Question }) {
  const { agir, etat } = useRevolution();
  if (!question.satisfaction || question.statut === 'relancee') {
    if (question.statut === 'relancee')
      return (
        <p className="mt-2 text-[11px] font-bold text-rouge">
          Plus de {REGLAGES.satisfactionRejet} % du peuple n’est pas satisfait : l’exigence est relancée avec priorité
          renforcée et repart au vote.
        </p>
      );
    return null;
  }
  const total = question.satisfaction.satisfait + question.satisfaction.pasSatisfait;
  const cle = `${sujet.id}:${question.id}`;
  const aVote = etat.mesVotes[cle];
  return (
    <div className="mt-3 rounded-xl border border-bord bg-carte2 p-3">
      <p className="text-xs font-bold text-texte">⚪ L’État a répondu : es-tu satisfait de la réponse ?</p>
      <p className="mt-1 text-[11px] text-gris">
        {nombre(total)} citoyens ont répondu · {pct((question.satisfaction.pasSatisfait / Math.max(1, total)) * 100)} de NON
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={Boolean(aVote)}
          onClick={() => agir({ type: 'satisfaction', sujetId: sujet.id, questionId: question.id, satisfait: true })}
          className="affiche rounded-xl bg-jaune px-3 py-2 text-xs text-black disabled:opacity-40"
        >
          ✅ Satisfait
        </button>
        <button
          type="button"
          disabled={Boolean(aVote)}
          onClick={() => agir({ type: 'satisfaction', sujetId: sujet.id, questionId: question.id, satisfait: false })}
          className="affiche rounded-xl bg-rouge px-3 py-2 text-xs text-white disabled:opacity-40"
        >
          ❌ Pas satisfait
        </button>
        {aVote && <span className="self-center text-[11px] text-gris">C’est compté, merci.</span>}
      </div>
    </div>
  );
}

/** L'onglet « Résultats » d'un sujet : la voix du peuple, sans boîte noire. */
export function Resultats({ sujet }: { sujet: Sujet }) {
  const { etat } = useRevolution();
  const regionId = etat.citoyen?.region ?? 'occitanie';
  const exigencesSujet = sujet.questions.filter((q) => q.etat === 'exigence');
  const consensus = (exigencesSujet.length / Math.max(1, sujet.questions.length)) * 100;
  const participation = etat.historique.length
    ? (sujet.votants / Math.max(1, etat.historique.reduce((acc, h) => acc + h.votants, 0))) * 100
    : 0;
  const partage = etat.partages[sujet.id];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-4">
        <Panneau className="text-center">
          <p className="affiche text-3xl text-jaune">{nombre(sujet.votants)}</p>
          <p className="text-[11px] font-bold uppercase text-gris">votants</p>
        </Panneau>
        <Panneau className="text-center">
          <p className="affiche text-3xl text-rouge">{nombre(sujet.verifies)}</p>
          <p className="text-[11px] font-bold uppercase text-gris">dont citoyens vérifiés</p>
        </Panneau>
        <Panneau className="text-center">
          <p className="affiche text-3xl text-gris">{nombre(sujet.archives)}</p>
          <p className="text-[11px] font-bold uppercase text-gris">votes archivés (suspicion)</p>
        </Panneau>
        <Panneau className="text-center">
          <p className="affiche text-3xl text-jaune">{pct(consensus)}</p>
          <p className="text-[11px] font-bold uppercase text-gris">du sujet est une exigence</p>
        </Panneau>
      </div>

      <Panneau>
        <p className="text-xs text-gris">
          Transparence totale : tous les compteurs sont publics, y compris les votes archivés pour suspicion — ils ne
          sont jamais effacés. Part de participation au sein de l’écosystème : {pct(Math.min(100, participation))}.
        </p>
      </Panneau>

      {sujet.questions.map((q, index) => {
        const st = statsQuestion(q);
        const local = pourcentageRegion(st.ouiPct, `${sujet.id}-${index}`, regionId);
        return (
          <Panneau key={q.id} accent={q.etat === 'exigence' ? 'rouge' : q.etat === 'ecartee' ? undefined : 'jaune'}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="affiche max-w-2xl text-sm text-texte sm:text-base">{q.texte}</p>
              <EtatQuestionBadge question={q} />
            </div>
            <div className="mt-3">
              <JaugeQuestion question={q} />
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-bord bg-carte2 px-3 py-2">
                <p className="text-[10px] font-bold uppercase text-gris">Chez toi — {nomRegion(regionId)}</p>
                <p className="affiche text-lg text-jaune">{pct(local)} OUI</p>
              </div>
              <div className="rounded-xl border border-bord bg-carte2 px-3 py-2">
                <p className="text-[10px] font-bold uppercase text-gris">Moyenne France</p>
                <p className="affiche text-lg text-texte">{pct(st.ouiPct)} OUI</p>
              </div>
              <div className="rounded-xl border border-bord bg-carte2 px-3 py-2">
                <p className="text-[10px] font-bold uppercase text-gris">Budget moyen du peuple</p>
                <p className="affiche text-lg text-jaune">{Math.round(q.budgetMoyen)} pts</p>
              </div>
            </div>
            <MaPosition question={q} />
            <VoteSatisfaction sujet={sujet} question={q} />
          </Panneau>
        );
      })}

      <Panneau>
        <TitreSection>Répartition budgétaire moyenne</TitreSection>
        <ul className="space-y-2">
          {sujet.questions.map((q) => {
            const max = Math.max(...sujet.questions.map((x) => x.budgetMoyen), 1);
            return (
              <li key={q.id} className="text-xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-texte">{q.poste}</span>
                  <span className="text-jaune">{Math.round(q.budgetMoyen)} pts</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-bord">
                  <div className="h-full bg-jaune" style={{ width: `${(q.budgetMoyen / max) * 100}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-[11px] text-gris">
          {nombre(sujet.budgetVotants)} citoyens ont scellé une répartition. Somme des moyennes :{' '}
          {Math.round(sujet.questions.reduce((acc, q) => acc + q.budgetMoyen, 0))} points sur {REGLAGES.budgetTotal}.
        </p>
      </Panneau>

      <Panneau>
        <TitreSection>Consensus-meter</TitreSection>
        <div className="flex items-center gap-4">
          <p className="affiche text-5xl text-jaune">{pct(soutienSujet(sujet) * 100)}</p>
          <div className="flex-1">
            <Jauge
              oui={sujet.questions.reduce((acc, q) => acc + q.oui, 0)}
              non={sujet.questions.reduce((acc, q) => acc + q.non, 0)}
              sansAvis={sujet.questions.reduce((acc, q) => acc + q.sansAvis, 0)}
            />
            <p className="mt-2 text-[11px] text-gris">
              Une question qui dépasse {REGLAGES.consensusExigence} % de OUI devient une exigence et rejoint
              automatiquement le cahier des doléances. Les votes exprimés ici : {nombre(totalVotes(sujet.questions[0]) * 5)}.
            </p>
          </div>
        </div>
        {exigences(etat, { niveau: sujet.niveau, territoire: sujet.territoire }).length > 0 && (
          <p className="mt-3 text-xs font-bold text-rouge">
            ✊ {exigences(etat, { niveau: sujet.niveau, territoire: sujet.territoire }).length} exigence(s) de ce
            périmètre sont déjà dans le cahier des doléances.
          </p>
        )}
        {partage && (
          <p className="mt-3 text-xs text-gris">
            📣 Ton lien de partage a fait voter {nombre(partage.votes)} personnes ({partage.lien}).
          </p>
        )}
      </Panneau>
    </div>
  );
}

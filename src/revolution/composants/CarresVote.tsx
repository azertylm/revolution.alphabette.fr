import { useState } from 'react';
import { useRevolution } from '../contexte';
import { useNav } from '../navigation';
import { REGLAGES } from '../reglages';
import type { ChoixVote, Question, Sujet } from '../types';
import { nombre, pct, statsQuestion } from '../outils';
import { Badge, Etiquette } from '../ui';

/* ==========================================================================
   LES CARRÉS DE VOTE — la pièce maîtresse de l'application.

   Trois gros carrés : OUI / NON / SANS AVIS. On tape dedans pour voter, et le
   pourcentage des autres votants est écrit EN ÉNORME À L'INTÉRIEUR du carré,
   avec le nombre de voix et une jauge de remplissage.

   Rien à lire, rien à comprendre : le chiffre est au milieu du bouton.
   ========================================================================== */

export function CarresVote({
  sujetId,
  question,
  taille = 'normal',
}: {
  sujetId: string;
  question: Question;
  taille?: 'normal' | 'compact';
}) {
  const { etat, agir } = useRevolution();
  const nav = useNav();
  const [anim, setAnim] = useState<string | null>(null);
  const cle = `${sujetId}:${question.id}`;
  const monVote = etat.mesVotes[cle] ?? null;
  const st = statsQuestion(question);
  const desactive = question.etat === 'ecartee';

  const voter = (choix: ChoixVote) => {
    if (!etat.citoyen) {
      nav.demanderIdentite('Pour voter, il faut une identité citoyenne — pseudo et code PIN, 15 secondes.');
      return;
    }
    agir({ type: 'voter', sujetId, questionId: question.id, choix });
    setAnim(choix);
    window.setTimeout(() => setAnim(null), 320);
  };

  const carres: { id: ChoixVote; libelle: string; emoji: string; valeur: number; voix: number; classe: string }[] = [
    { id: 'oui', libelle: 'Oui', emoji: '✅', valeur: st.ouiPct, voix: question.oui, classe: 'carre-vote--oui' },
    { id: 'non', libelle: 'Non', emoji: '❌', valeur: st.nonPct, voix: question.non, classe: 'carre-vote--non' },
    {
      id: 'sans-avis',
      libelle: 'Sans avis',
      emoji: '🤷',
      valeur: st.sansPct,
      voix: question.sansAvis,
      classe: 'carre-vote--sans',
    },
  ];

  return (
    <div className={`grid grid-cols-3 gap-2 ${taille === 'compact' ? 'sm:gap-2' : 'sm:gap-3'}`}>
      {carres.map((c) => {
        const choisi = monVote === c.id;
        return (
          <button
            key={c.id}
            type="button"
            disabled={desactive}
            aria-pressed={choisi}
            aria-label={`${c.libelle} — ${Math.round(c.valeur)} % des ${nombre(st.total)} votants`}
            onClick={() => voter(c.id)}
            className={`carre-vote ${c.classe} ${choisi ? 'carre-vote--choisi' : ''} ${anim === c.id ? 'pop' : ''}`}
            style={taille === 'compact' ? { minHeight: '5.75rem' } : undefined}
          >
            {choisi && <span className="ruban-choix">✓ ton vote</span>}
            <span className={taille === 'compact' ? 'text-base leading-none' : 'text-xl leading-none'}>{c.emoji}</span>
            <span className="libelle">{c.libelle}</span>
            <span className="pourcentage">
              {Math.round(c.valeur)}
              <span className="text-[0.45em]">%</span>
            </span>
            <span className="grain">{nombre(c.voix)} voix</span>
            <span className="remplissage" style={{ width: `${c.valeur}%` }} />
          </button>
        );
      })}
    </div>
  );
}

/** Ce que le peuple pense de mon vote, en une ligne, écrit gros. */
function MonPositionnement({ question, cle }: { question: Question; cle: string }) {
  const { etat } = useRevolution();
  const mon = etat.mesVotes[cle] ?? null;
  if (!mon) return null;
  const st = statsQuestion(question);
  const valeur = mon === 'oui' ? st.ouiPct : mon === 'non' ? st.nonPct : st.sansPct;
  const majoritaire = valeur >= 50;
  return (
    <p
      className={`affiche text-[13px] leading-tight ${majoritaire ? 'text-jaune' : 'text-gris'}`}
    >
      {majoritaire
        ? `✊ Tu es avec le peuple — ${Math.round(valeur)} % ont voté comme toi`
        : `↔️ Tu es minoritaire — ${Math.round(valeur)} % ont voté comme toi`}
    </p>
  );
}

/** Étiquette d'état d'une question, version affiche. */
export function EtatQuestionBadge({ question }: { question: Question }) {
  const st = statsQuestion(question);
  if (question.etat === 'exigence') {
    const statuts: Record<string, string> = {
      'a-presenter': '🟡 À présenter',
      presentee: '🔴 Présentée',
      'en-reponse': '🔵 En réponse',
      relancee: '✊ Relancée',
      satisfaite: '✅ Satisfaite',
    };
    return (
      <span className="flex flex-wrap gap-1">
        <Badge ton="rouge">✊ Exigence</Badge>
        <Badge ton="jaune">{statuts[question.statut ?? 'a-presenter']}</Badge>
      </span>
    );
  }
  if (question.etat === 'ecartee') return <Badge ton="gris">🚫 Écartée par le peuple</Badge>;
  if (st.ouiPct >= REGLAGES.seuilBascule && st.total > 0)
    return <Badge ton="jaune">🟡 {Math.round(st.ouiPct)} % — seuil à portée</Badge>;
  return <Badge ton="gris">En vote</Badge>;
}

/**
 * Une question complète, prête à voter : le texte en gros, les trois carrés,
 * et l'état de mon vote en dessous. Utilisée sur l'accueil ET sur le sujet.
 */
export function BlocQuestion({
  sujet,
  question,
  numero,
  total,
  compact,
}: {
  sujet: Sujet;
  question: Question;
  numero?: number;
  total?: number;
  compact?: boolean;
}) {
  const { etat } = useRevolution();
  const monVote = etat.mesVotes[`${sujet.id}:${question.id}`];
  return (
    <div className={`bloc ${question.etat === 'exigence' ? 'bloc-rouge' : ''} p-3 sm:p-5`}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {numero !== undefined && total !== undefined && (
          <span className="affiche text-xs text-gris">
            {numero}/{total}
          </span>
        )}
        <Etiquette>{question.poste}</Etiquette>
        <EtatQuestionBadge question={question} />
      </div>

      <p className={`affiche text-texte ${compact ? 'text-lg sm:text-xl' : 'text-xl sm:text-3xl'}`}>{question.texte}</p>

      <div className="mt-3">
        <CarresVote sujetId={sujet.id} question={question} taille={compact ? 'compact' : 'normal'} />
      </div>

      <div className="mt-2 space-y-1">
        {monVote ? (
          <MonPositionnement question={question} cle={`${sujet.id}:${question.id}`} />
        ) : (
          <p className="text-[11px] font-bold uppercase tracking-wide text-gris">
            👆 Touche un carré pour voter — {REGLAGES.consensusExigence} % de OUI = exigence du peuple
          </p>
        )}
        {monVote && (
          <p className="text-[11px] text-gris">
            Modifiable jusqu’à la prochaine Refonte · {pct(100)} public, aucune IP stockée
          </p>
        )}
      </div>
    </div>
  );
}

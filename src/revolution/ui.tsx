import type { ReactNode } from 'react';
import { nombre, statsQuestion } from './outils';
import type { Question } from './types';

/* ==========================================================================
   Les briques d'interface communes : panneaux, badges, jauges, gros boutons.
   Charte : jaune #F2B705, rouge #C8102E, fond sombre, typo « affiche ».
   ========================================================================== */

export function Panneau({
  children,
  className = '',
  accent,
}: {
  children: ReactNode;
  className?: string;
  accent?: 'jaune' | 'rouge';
}) {
  const bord = accent === 'jaune' ? 'border-l-4 border-l-jaune' : accent === 'rouge' ? 'border-l-4 border-l-rouge' : '';
  return (
    <section className={`rounded-2xl border border-bord bg-carte p-4 sm:p-5 ${bord} ${className}`}>{children}</section>
  );
}

export function Badge({
  children,
  ton = 'gris',
  className = '',
}: {
  children: ReactNode;
  ton?: 'jaune' | 'rouge' | 'gris' | 'vert';
  className?: string;
}) {
  const tons: Record<string, string> = {
    jaune: 'bg-jaune text-black',
    rouge: 'bg-rouge text-white',
    vert: 'bg-emerald-600 text-white',
    gris: 'bg-carte2 text-gris border border-bord',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${tons[ton]} ${className}`}
    >
      {children}
    </span>
  );
}

export function TitreSection({ children, droite }: { children: ReactNode; droite?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="affiche text-xl text-texte sm:text-2xl">{children}</h2>
      {droite}
    </div>
  );
}

export function GrosBouton({
  children,
  onClick,
  variante = 'jaune',
  disabled,
  titre,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  variante?: 'jaune' | 'rouge' | 'neutre' | 'vert';
  disabled?: boolean;
  titre?: string;
  className?: string;
}) {
  const variantes: Record<string, string> = {
    jaune: 'bg-jaune text-black hover:brightness-110',
    rouge: 'bg-rouge text-white hover:brightness-110',
    vert: 'bg-emerald-600 text-white hover:brightness-110',
    neutre: 'bg-carte2 text-texte border border-bord hover:bg-bord',
  };
  return (
    <button
      type="button"
      title={titre}
      disabled={disabled}
      onClick={onClick}
      className={`affiche rounded-xl px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-40 ${variantes[variante]} ${className}`}
    >
      {children}
    </button>
  );
}

/** Barre de résultat : jaune = OUI, rouge = NON, gris = sans avis. */
export function Jauge({
  oui,
  non,
  sansAvis,
  hauteur = 14,
}: {
  oui: number;
  non: number;
  sansAvis: number;
  hauteur?: number;
}) {
  const total = Math.max(1, oui + non + sansAvis);
  const parts = [
    { valeur: (oui / total) * 100, classe: 'bg-jaune' },
    { valeur: (non / total) * 100, classe: 'bg-rouge' },
    { valeur: (sansAvis / total) * 100, classe: 'bg-bord' },
  ];
  return (
    <div className="flex w-full overflow-hidden rounded-full bg-bord" style={{ height: hauteur }} role="img">
      {parts.map((p, i) => (
        <div key={i} className={p.classe} style={{ width: `${p.valeur}%` }} />
      ))}
    </div>
  );
}

/** Jauge d'une question, avec les pourcentages affichés. */
export function JaugeQuestion({ question, compact }: { question: Question; compact?: boolean }) {
  const st = statsQuestion(question);
  return (
    <div className="space-y-1.5">
      <Jauge oui={question.oui} non={question.non} sansAvis={question.sansAvis} hauteur={compact ? 10 : 16} />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-gris">
        <span className="text-jaune">■ {Math.round(st.ouiPct)} % OUI</span>
        <span className="text-rouge">■ {Math.round(st.nonPct)} % NON</span>
        <span>■ {Math.round(st.sansPct)} % sans avis</span>
        <span className="text-texte">{nombre(st.total)} votants</span>
        {question.budgetMoyen > 0 && <span className="text-jaune">{Math.round(question.budgetMoyen)} pts de budget moyen</span>}
      </div>
    </div>
  );
}

/** Grand chiffre de compteur, style « compteur de manifestation ». */
export function Compteur({
  valeur,
  legende,
  ton = 'jaune',
  suffixe,
}: {
  valeur: string | number;
  legende: string;
  ton?: 'jaune' | 'rouge' | 'texte';
  suffixe?: string;
}) {
  const couleurs = { jaune: 'text-jaune', rouge: 'text-rouge', texte: 'text-texte' };
  return (
    <div className="rounded-2xl border border-bord bg-carte px-3 py-3 text-center">
      <div className={`affiche text-2xl sm:text-3xl ${couleurs[ton]}`}>
        {typeof valeur === 'number' ? nombre(valeur) : valeur}
        {suffixe}
      </div>
      <div className="mt-1 text-[11px] font-bold uppercase tracking-wide text-gris">{legende}</div>
    </div>
  );
}

export function Etiquette({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg border border-bord bg-carte2 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-gris ${className}`}
    >
      {children}
    </span>
  );
}

export function Choix({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

import type { ReactNode } from 'react';
import { nombre, statsQuestion } from './outils';
import type { Question } from './types';

/* ==========================================================================
   Les briques d'interface — version « affiche », pensée pour le pouce.

   · tout est gros, contrasté, avec une ombre dure ;
   · une cible tactile ne descend jamais sous 56 px ;
   · les pourcentages sont écrits en énorme, directement dans les barres.
   ========================================================================== */

export function Panneau({
  children,
  className = '',
  accent,
  dure,
}: {
  children: ReactNode;
  className?: string;
  accent?: 'jaune' | 'rouge';
  dure?: boolean;
}) {
  const teinte = accent === 'jaune' ? 'bloc-jaune' : accent === 'rouge' ? 'bloc-rouge' : '';
  return (
    <section className={`bloc ${teinte} ${dure ? 'ombre-dure' : ''} p-4 sm:p-5 ${className}`}>{children}</section>
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
    vert: 'bg-emerald-500 text-black',
    gris: 'bg-carte2 text-gris border-2 border-bord',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${tons[ton]} ${className}`}
    >
      {children}
    </span>
  );
}

/** Titre de section : bandeau jaune penché, comme un titre de manif. */
export function TitreSection({
  children,
  droite,
  rouge,
}: {
  children: ReactNode;
  droite?: ReactNode;
  rouge?: boolean;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h2 className={`bandeau affiche text-base sm:text-xl ${rouge ? 'bandeau-rouge' : ''}`}>{children}</h2>
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
    jaune: 'bg-jaune text-black ombre-dure-jaune active:translate-y-[3px] active:shadow-none',
    rouge: 'bg-rouge text-white ombre-dure-rouge active:translate-y-[3px] active:shadow-none',
    vert: 'bg-emerald-500 text-black ombre-dure active:translate-y-[3px] active:shadow-none',
    neutre: 'bg-carte2 text-texte border-[3px] border-bord active:bg-bord',
  };
  return (
    <button
      type="button"
      title={titre}
      disabled={disabled}
      onClick={onClick}
      className={`affiche min-h-[3.5rem] rounded-xl px-5 py-3 text-sm leading-tight disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none ${variantes[variante]} ${className}`}
    >
      {children}
    </button>
  );
}

/** Barre de résultat segmentée, avec le pourcentage écrit dans la barre. */
export function Jauge({ oui, non, sansAvis, hauteur = 30 }: { oui: number; non: number; sansAvis: number; hauteur?: number }) {
  const total = Math.max(1, oui + non + sansAvis);
  const parts = [
    { valeur: (oui / total) * 100, classe: 'bg-jaune', texte: 'text-black' },
    { valeur: (non / total) * 100, classe: 'bg-rouge', texte: 'text-white' },
    { valeur: (sansAvis / total) * 100, classe: 'bg-[#6b6b6b]', texte: 'text-white' },
  ];
  return (
    <div className="barre-resultat" style={{ height: hauteur }} role="img" aria-label="Répartition des votes">
      {parts.map((p, i) => (
        <span
          key={i}
          className={`${p.classe} ${p.texte}`}
          style={{ width: `${p.valeur}%`, minWidth: p.valeur > 0 ? '0.9rem' : 0 }}
        >
          {p.valeur >= 12 ? `${Math.round(p.valeur)} %` : ''}
        </span>
      ))}
    </div>
  );
}

/** La barre d'une question, avec les chiffres en dessous — gros et lisibles. */
export function JaugeQuestion({ question, compact }: { question: Question; compact?: boolean }) {
  const st = statsQuestion(question);
  return (
    <div className="space-y-2">
      <Jauge oui={question.oui} non={question.non} sansAvis={question.sansAvis} hauteur={compact ? 22 : 32} />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-black uppercase tracking-wide">
        <span className="text-jaune">■ {Math.round(st.ouiPct)} % OUI</span>
        <span className="text-rouge">■ {Math.round(st.nonPct)} % NON</span>
        <span className="text-gris">■ {Math.round(st.sansPct)} % sans avis</span>
        <span className="text-texte">{nombre(st.total)} votants</span>
        {question.budgetMoyen > 0 && <span className="text-jaune-clair">{Math.round(question.budgetMoyen)} pts</span>}
      </div>
    </div>
  );
}

/** Grand chiffre, style compteur de manifestation. */
export function Compteur({
  valeur,
  legende,
  ton = 'jaune',
  suffixe,
  classeValeur,
}: {
  valeur: string | number;
  legende: string;
  ton?: 'jaune' | 'rouge' | 'texte';
  suffixe?: string;
  classeValeur?: string;
}) {
  const couleurs = { jaune: 'text-jaune', rouge: 'text-rouge', texte: 'text-texte' };
  return (
    <div className="bloc px-3 py-3 text-center">
      <div className={`affiche-large ${classeValeur ?? 'text-3xl sm:text-4xl'} ${couleurs[ton]}`}>
        {typeof valeur === 'number' ? nombre(valeur) : valeur}
        {suffixe}
      </div>
      <div className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-gris">{legende}</div>
    </div>
  );
}

export function Etiquette({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg border-2 border-bord bg-carte2 px-2 py-1 text-[11px] font-black uppercase tracking-wide text-gris ${className}`}
    >
      {children}
    </span>
  );
}

export function Choix({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

import type { ReactNode } from 'react';
import { nombre } from './donnees';

/* ==========================================================================
   Les briques d'interface — version « affiche », pensée pour le pouce :
   tout est gros, contrasté, avec une ombre dure ; une cible tactile ne
   descend jamais sous 56 px.
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
  const teinte = accent === 'jaune' ? 'bloc-jaune' : accent === 'rouge' ? 'bloc-rouge' : '';
  return <section className={`bloc ${teinte} p-4 sm:p-5 ${className}`}>{children}</section>;
}

export function Badge({ children, ton = 'gris' }: { children: ReactNode; ton?: 'jaune' | 'rouge' | 'gris' | 'vert' }) {
  const tons: Record<string, string> = {
    jaune: 'bg-jaune text-black',
    rouge: 'bg-rouge text-white',
    vert: 'bg-emerald-500 text-black',
    gris: 'bg-carte2 text-gris border-2 border-bord',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-black uppercase tracking-wide ${tons[ton]}`}>
      {children}
    </span>
  );
}

export function Titre({ children, droite, rouge }: { children: ReactNode; droite?: ReactNode; rouge?: boolean }) {
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
  type = 'button',
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  variante?: 'jaune' | 'rouge' | 'neutre';
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}) {
  const variantes: Record<string, string> = {
    jaune: 'bg-jaune text-black ombre-dure-jaune active:translate-y-[3px] active:shadow-none',
    rouge: 'bg-rouge text-white ombre-dure-rouge active:translate-y-[3px] active:shadow-none',
    neutre: 'bg-carte2 text-texte border-[3px] border-bord active:bg-bord',
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`affiche min-h-[3.5rem] rounded-xl px-5 py-3 text-sm leading-tight disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none ${variantes[variante]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Puce({
  children,
  actif,
  onClick,
}: {
  children: ReactNode;
  actif?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actif}
      className={`min-h-11 rounded-xl border-[3px] px-3 py-2 text-left text-sm font-bold ${
        actif ? 'border-jaune bg-jaune text-black' : 'border-bord bg-carte2 text-texte'
      }`}
    >
      {children}
    </button>
  );
}

const TEINTES = ['bg-jaune text-black', 'bg-rouge text-white', 'bg-carte2 text-texte', 'bg-emerald-500 text-black'];

/**
 * Les gros carrés de réponse. Les pourcentages des autres ne s'affichent
 * qu'APRÈS ta réponse, pour ne pas influencer ton choix.
 */
export function Carres({
  choix,
  monChoix,
  compteurs,
  onChoisir,
  occupe,
}: {
  choix: string[];
  monChoix: number | null;
  compteurs: number[] | null;
  onChoisir: (i: number) => void;
  occupe?: boolean;
}) {
  const total = compteurs ? compteurs.reduce((a, b) => a + b, 0) : 0;
  const voirResultats = monChoix !== null && compteurs !== null && total > 0;
  return (
    <div>
      <div className={`grid gap-2 ${choix.length === 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {choix.map((c, i) => {
          const pctVal = voirResultats ? Math.round(((compteurs?.[i] ?? 0) / total) * 100) : null;
          const choisi = monChoix === i;
          return (
            <button
              key={c}
              type="button"
              disabled={monChoix !== null || occupe}
              onClick={() => onChoisir(i)}
              aria-pressed={choisi}
              className={`relative min-h-[4.5rem] overflow-hidden rounded-xl border-[3px] px-2 py-2 text-center ${
                choisi ? `border-transparent ${TEINTES[i % 4]}` : 'border-bord bg-carte2 text-texte'
              } ${monChoix !== null && !choisi ? 'opacity-70' : ''}`}
            >
              {pctVal !== null && !choisi && (
                <span className="absolute inset-y-0 left-0 bg-bord/60" style={{ width: `${pctVal}%` }} aria-hidden="true" />
              )}
              <span className="relative block text-sm font-black leading-tight">{c}</span>
              {pctVal !== null && <span className="affiche-large relative block text-2xl">{pctVal} %</span>}
              {choisi && <span className="relative block text-[10px] font-black uppercase">ton choix</span>}
            </button>
          );
        })}
      </div>
      {voirResultats && (
        <p className="mt-2 text-xs text-gris">
          {nombre(total)} réponse{total > 1 ? 's' : ''} sur Révolution — consultation ouverte, pas un sondage
          représentatif.
        </p>
      )}
    </div>
  );
}

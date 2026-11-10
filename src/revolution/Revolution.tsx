import { Fournisseur, useRev } from './contexte';
import { ALaUne } from './vues/ALaUne';
import { Comment } from './vues/Comment';
import { PourToi } from './vues/PourToi';
import { Poser } from './vues/Poser';
import { Questions, QuestionSeule } from './vues/Questions';

/* ==========================================================================
   Révolution — repartie de zéro (novembre 2026).

   · « À la une » : des questions neutres tirées de l'actualité du moment,
     classées pour toi (région, sujets), mises à jour toutes les 3 heures ;
   · « Questions » : celles que posent syndicats, associations, collectifs,
     élus et citoyens, à partager par lien ou QR code ;
   · aucune donnée simulée : un compteur à zéro affiche zéro.
   ========================================================================== */

const ONGLETS: { route: string; nom: string; emoji: string }[] = [
  { route: '/', nom: 'À la une', emoji: '📰' },
  { route: '/questions', nom: 'Questions', emoji: '✊' },
  { route: '/poser', nom: 'Poser', emoji: '✍️' },
  { route: '/pour-toi', nom: 'Pour toi', emoji: '🎯' },
];

function Contenu() {
  const { route } = useRev();
  if (route.startsWith('/q/')) return <QuestionSeule id={decodeURIComponent(route.slice(3))} />;
  if (route === '/questions') return <Questions />;
  if (route === '/poser') return <Poser />;
  if (route === '/pour-toi') return <PourToi />;
  if (route === '/comment') return <Comment />;
  return <ALaUne />;
}

function Cadre() {
  const { route, aller } = useRev();
  const actif = (r: string) => (r === '/' ? route === '/' : route.startsWith(r));
  return (
    <div className="min-h-full bg-fond pb-28 text-texte">
      <header className="mx-auto flex w-full max-w-2xl items-start justify-between gap-3 px-4 pt-4">
        <div>
          <p className="affiche text-xl leading-none text-jaune">Révolution</p>
          <p className="mt-1 text-xs text-gris">L’actualité, ton avis, celui des autres.</p>
        </div>
        <button type="button" onClick={() => aller('/comment')} className="shrink-0 text-xs font-bold text-gris underline">
          Comment ça marche ?
        </button>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 pt-4">
        <Contenu />
      </main>

      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-30 border-t-[3px] border-bord bg-carte pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto grid max-w-2xl grid-cols-4">
          {ONGLETS.map((o) => (
            <button
              key={o.route}
              type="button"
              onClick={() => aller(o.route)}
              aria-current={actif(o.route) ? 'page' : undefined}
              className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-black uppercase ${
                actif(o.route) ? 'text-jaune' : 'text-gris'
              }`}
            >
              <span className="text-xl" aria-hidden="true">
                {o.emoji}
              </span>
              {o.nom}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function Revolution() {
  return (
    <Fournisseur>
      <Cadre />
    </Fournisseur>
  );
}

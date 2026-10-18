import { useRevolution } from '../contexte';
import { exigences, statsGlobales } from '../moteur';
import { dateLisible, heureLisible, nombre } from '../outils';
import { Badge, Etiquette, Panneau, TitreSection } from '../ui';

/* ==========================================================================
   📜 Le journal de refonte : ce qui a changé à chaque heure, en langage clair.
   Et la participation heure par heure — pas de boîte noire.
   ========================================================================== */

const TEINTES: Record<string, { emoji: string; ton: 'jaune' | 'rouge' | 'gris' | 'vert' }> = {
  refonte: { emoji: '🔄', ton: 'gris' },
  montee: { emoji: '📈', ton: 'jaune' },
  descente: { emoji: '📉', ton: 'gris' },
  question: { emoji: '🔁', ton: 'jaune' },
  exigence: { emoji: '✊', ton: 'rouge' },
  ecartee: { emoji: '🚫', ton: 'rouge' },
  assemblee: { emoji: '🏛️', ton: 'jaune' },
};

export function Journal() {
  const { etat } = useRevolution();
  const stats = statsGlobales(etat);
  const liste = exigences(etat);
  const maximum = Math.max(1, ...etat.historique.map((h) => h.votants));
  const agregés = etat.historique.reduce((acc, h) => acc + h.votants, 0);

  return (
    <div className="space-y-5">
      <Panneau>
        <TitreSection droite={<Badge ton="jaune">Cycle n°{nombre(etat.cycles)}</Badge>}>
          Journal de refonte
        </TitreSection>
        <p className="text-xs text-gris">
          Chaque heure, les votes sont agrégés, les priorités reclassées et le journal publié. Aucune décision n’est
          écrite à la main : tout sort des votes.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-bord bg-carte2 px-3 py-2">
            <p className="text-[10px] font-bold uppercase text-gris">Dernière refonte</p>
            <p className="affiche text-sm text-texte">
              {dateLisible(etat.derniereRefonte)} · {heureLisible(etat.derniereRefonte)}
            </p>
          </div>
          <div className="rounded-xl border border-bord bg-carte2 px-3 py-2">
            <p className="text-[10px] font-bold uppercase text-gris">Votes agrégés (24 derniers cycles)</p>
            <p className="affiche text-sm text-jaune">{nombre(agregés)}</p>
          </div>
          <div className="rounded-xl border border-bord bg-carte2 px-3 py-2">
            <p className="text-[10px] font-bold uppercase text-gris">Exigences au cahier</p>
            <p className="affiche text-sm text-rouge">{nombre(liste.length)}</p>
          </div>
        </div>
      </Panneau>

      <Panneau>
        <TitreSection>Participation heure par heure</TitreSection>
        <div className="flex h-32 items-end gap-1">
          {etat.historique.map((h, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1" title={`${h.votants} votes · ${h.exigences} exigences`}>
              <div
                className="w-full rounded-t bg-jaune"
                style={{ height: `${Math.max(4, (h.votants / maximum) * 100)}%` }}
              />
              <span className="text-[9px] text-gris">{heureLisible(h.date).slice(0, 2)}h</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-gris">
          Chaque barre est une heure de votes. Historique public, y compris les votes archivés pour suspicion :{' '}
          {nombre(etat.sujets.reduce((acc, s) => acc + s.archives, 0))} votes archivés sur{' '}
          {nombre(stats.votesTotaux)} exprimés.
        </p>
      </Panneau>

      <section className="space-y-3">
        {etat.journal.map((entree) => {
          const teinte = TEINTES[entree.type] ?? TEINTES.refonte;
          return (
            <article
              key={entree.id}
              className={`rounded-2xl border bg-carte p-4 ${
                entree.type === 'exigence' || entree.type === 'ecartee' ? 'border-rouge/50' : 'border-bord'
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Etiquette>
                  {heureLisible(entree.date)} · {dateLisible(entree.date)}
                </Etiquette>
                <Badge ton={teinte.ton}>
                  {teinte.emoji} {entree.type}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-texte">{entree.texte}</p>
            </article>
          );
        })}
        {etat.journal.length === 0 && (
          <Panneau>
            <p className="text-sm text-gris">Le journal est vide : la prochaine Refonte va l’écrire.</p>
          </Panneau>
        )}
      </section>
    </div>
  );
}

import { useRevolution } from '../contexte';
import { useNav } from '../navigation';
import { REGLAGES } from '../reglages';
import type { TypeNotification } from '../types';
import { dateLisible, heureLisible, nombre } from '../outils';
import { Badge, GrosBouton, Panneau, TitreSection } from '../ui';

/* ==========================================================================
   🔔 Le centre de notifications.
   Quatre types, pas un de plus :
   1. 🔄 Refonte passée  2. 📅 Rendez-vous (J-7, J-3, J-1, jour J)
   3. ✊ Mobilisation urgente  4. 🗳️ Vote qui peut faire basculer une exigence
   Un interrupteur pour chacun, et rien d'autre.
   ========================================================================== */

const TYPES: Record<TypeNotification, { label: string; emoji: string; reglage: keyof import('../types').Etat['reglagesNotif'] }> = {
  refonte: { label: 'Résumé de la Refonte', emoji: '🔄', reglage: 'refontes' },
  'rendez-vous': { label: 'Rendez-vous avec l’État', emoji: '📅', reglage: 'mobilisation' },
  mobilisation: { label: 'Mobilisation urgente (exigence attaquée)', emoji: '✊', reglage: 'mobilisation' },
  seuil: { label: 'Vote qui peut faire basculer une exigence', emoji: '🗳️', reglage: 'seuils' },
};

export function Notifications() {
  const { etat, agir } = useRevolution();
  const nav = useNav();
  const nonLues = etat.notifications.filter((n) => !n.lu);

  return (
    <div className="space-y-5">
      <Panneau>
        <TitreSection
          droite={
            <div className="flex flex-wrap items-center gap-2">
              <Badge ton="rouge">{nonLues.length} non lue(s)</Badge>
              <GrosBouton variante="neutre" onClick={() => agir({ type: 'lire-notifications' })}>
                Tout marquer comme lu
              </GrosBouton>
            </div>
          }
        >
          🔔 Centre de notifications
        </TitreSection>
        <p className="text-xs text-gris">
          Seuls {Object.keys(TYPES).length} types de notifications existent. Aucun spam, aucune relance commerciale :
          la cloche ne sonne que quand le peuple a quelque chose à faire.
        </p>
      </Panneau>

      <section className="space-y-3">
        {etat.notifications.length === 0 && (
          <Panneau>
            <p className="text-sm text-gris">Rien pour l’instant. La prochaine Refonte va remplir la cloche.</p>
          </Panneau>
        )}
        {etat.notifications.map((notif) => (
          <article
            key={notif.id}
            className={`rounded-2xl border p-4 ${
              notif.lu ? 'border-bord bg-carte' : notif.urgent ? 'border-rouge bg-rouge/10' : 'border-jaune/60 bg-carte'
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge ton={notif.urgent ? 'rouge' : notif.lu ? 'gris' : 'jaune'}>
                {TYPES[notif.type].emoji} {TYPES[notif.type].label}
              </Badge>
              <span className="text-[11px] text-gris">
                {dateLisible(notif.date)} · {heureLisible(notif.date)}
              </span>
              {!notif.lu && <span className="h-2 w-2 rounded-full bg-rouge" aria-label="non lue" />}
            </div>
            <p className="affiche mt-2 text-base text-texte">{notif.titre}</p>
            <p className="mt-1 text-sm text-gris">{notif.texte}</p>
            {notif.cible && (
              <div className="mt-3">
                <GrosBouton
                  variante={notif.urgent ? 'rouge' : 'jaune'}
                  onClick={() => {
                    agir({ type: 'lire-notification', notificationId: notif.id });
                    nav.aller({ vue: notif.cible?.vue as never, sujetId: notif.cible?.sujetId, questionId: notif.cible?.questionId });
                  }}
                >
                  {notif.urgent ? '✊ Agir maintenant' : 'Ouvrir'}
                </GrosBouton>
              </div>
            )}
          </article>
        ))}
      </section>

      <Panneau accent="jaune">
        <TitreSection>⚙️ Réglages des notifications</TitreSection>
        <ul className="space-y-2">
          {(Object.keys(TYPES) as TypeNotification[]).map((type) => {
            const reglage = TYPES[type].reglage;
            const actif = etat.reglagesNotif[reglage];
            return (
              <li key={type} className="flex items-center justify-between gap-3 rounded-xl border border-bord bg-carte2 px-3 py-2">
                <span className="text-sm text-texte">
                  {TYPES[type].emoji} {TYPES[type].label}
                </span>
                <button
                  type="button"
                  onClick={() => agir({ type: 'reglages-notif', reglages: { [reglage]: !actif } })}
                  className={`affiche rounded-lg px-3 py-1 text-xs ${actif ? 'bg-jaune text-black' : 'border border-bord bg-carte text-gris'}`}
                  aria-pressed={actif}
                >
                  {actif ? 'Activé' : 'Coupé'}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-[11px] text-gris">
          Les notifications de rendez-vous suivent le calendrier : rappel à J-7, J-3, J-1 et le jour J à partir de{' '}
          {REGLAGES.verrouillageHeure} h, heure de verrouillage du cahier. {nombre(nonLues.length)} alerte(s) t’attendent
          encore.
        </p>
      </Panneau>
    </div>
  );
}

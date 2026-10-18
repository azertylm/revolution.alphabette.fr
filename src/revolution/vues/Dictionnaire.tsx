import { PageDictionnaire } from '../composants/Dictionnaire';
import { Badge, Panneau, TitreSection } from '../ui';
import { useRevolution } from '../contexte';

/* ==========================================================================
   LE DICTIONNAIRE CITOYEN (prompt 9) — le « mode jargon off » en pleine page.

   Objectif : zéro mot d'administration sans sa traduction. Le dictionnaire
   grandit tout seul : chaque terme rencontré dans l'application y entre.
   ========================================================================== */

export function Dictionnaire() {
  const { etat, agir } = useRevolution();
  return (
    <div className="space-y-5">
      <Panneau accent="jaune">
        <TitreSection droite={<Badge ton="jaune">🧠 jargon off</Badge>}>📚 Le dictionnaire citoyen</TitreSection>
        <p className="text-sm text-texte">
          Un mot compliqué sans explication, c’est un mur. Ici, chaque terme d’administration est traduit en une phrase,
          et une version « niveau école » est disponible pour tout le monde.
        </p>
      </Panneau>

      <PageDictionnaire />

      <Panneau>
        <TitreSection>♿ Accessibilité universelle</TitreSection>
        <ul className="space-y-2">
          <li className="flex items-center justify-between gap-3 rounded-xl border border-bord bg-carte2 px-3 py-2">
            <span className="text-sm text-texte">🗣️ Mode lecture facile (cartes niveau école)</span>
            <button
              type="button"
              className={`affiche rounded-lg px-3 py-1 text-xs ${
                etat.accessibilite.lectureFacile ? 'bg-jaune text-black' : 'border border-bord bg-carte text-gris'
              }`}
              onClick={() =>
                agir({ type: 'accessibilite', reglages: { lectureFacile: !etat.accessibilite.lectureFacile } })
              }
            >
              {etat.accessibilite.lectureFacile ? 'Activé' : 'Coupé'}
            </button>
          </li>
        </ul>
        <p className="mt-3 text-[11px] text-gris">
          Les deux réglages d’accessibilité se pilotent depuis ton profil (mode lecture facile, texte agrandi). Le but :
          que l’application soit utilisable par un adolescent de 15 ans comme par une personne de 75 ans, sans aide.
        </p>
      </Panneau>
    </div>
  );
}

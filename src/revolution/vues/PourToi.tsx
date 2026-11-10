import { useRev } from '../contexte';
import { ETAT_VIDE, REGIONS, THEMES } from '../donnees';
import { GrosBouton, Panneau, Puce, Titre } from '../ui';

export function PourToi() {
  const { etat, modifier, aller } = useRev();
  const { profil } = etat;
  const nbReponses = Object.keys(etat.reponses).length;

  const basculer = (id: string) =>
    modifier((e) => ({
      ...e,
      profil: {
        ...e.profil,
        themes: e.profil.themes.includes(id) ? e.profil.themes.filter((t) => t !== id) : [...e.profil.themes, id],
      },
    }));

  return (
    <div className="space-y-4">
      <Titre>Pour toi</Titre>
      <p className="text-sm text-gris">
        Ces réglages restent sur ton téléphone : ils servent seulement à classer l’actualité. Ils ne sont envoyés
        nulle part.
      </p>

      <Panneau className="space-y-2">
        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-gris">Ma région</span>
          <select
            value={profil.region ?? ''}
            onChange={(e) => modifier((x) => ({ ...x, profil: { ...x.profil, region: e.target.value || null } }))}
            className="mt-1 w-full rounded-xl border-[3px] border-bord bg-carte2 p-3 text-base text-texte outline-none focus:border-jaune"
          >
            <option value="">Je ne précise pas</option>
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nom}
              </option>
            ))}
          </select>
        </label>
      </Panneau>

      <Panneau className="space-y-2">
        <p className="text-xs font-black uppercase tracking-wide text-gris">Les sujets qui me touchent</p>
        <div className="grid grid-cols-2 gap-2">
          {THEMES.map((t) => (
            <Puce key={t.id} actif={profil.themes.includes(t.id)} onClick={() => basculer(t.id)}>
              {t.emoji} {t.nom}
            </Puce>
          ))}
        </div>
      </Panneau>

      <GrosBouton
        className="w-full"
        onClick={() => {
          modifier((e) => ({ ...e, bienvenueVue: true }));
          aller('/');
        }}
      >
        Voir mes questions du moment
      </GrosBouton>

      <Panneau className="space-y-2">
        <p className="text-xs font-black uppercase tracking-wide text-gris">Mes données sur cet appareil</p>
        <p className="text-sm text-texte">
          {nbReponses} réponse{nbReponses > 1 ? 's' : ''} notée{nbReponses > 1 ? 's' : ''}, {etat.brouillons.length}{' '}
          question{etat.brouillons.length > 1 ? 's' : ''} en attente.
        </p>
        <button
          type="button"
          className="text-sm text-gris underline"
          onClick={() => {
            if (window.confirm('Effacer tes réglages, tes réponses et tes questions en attente de cet appareil ?')) {
              modifier(() => ({ ...ETAT_VIDE, bienvenueVue: true }));
            }
          }}
        >
          Tout effacer de cet appareil
        </button>
        <p className="text-[11px] text-gris">
          Les réponses déjà comptées dans le recueil partagé restent dans les totaux (elles sont anonymes et ne
          peuvent pas être reliées à toi).
        </p>
      </Panneau>
    </div>
  );
}

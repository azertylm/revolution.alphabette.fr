import { useEffect, useState } from 'react';
import { useRev } from '../contexte';
import { chargerActu, ilYa } from '../donnees';
import { raisonInactif } from '../partage';
import type { Actu } from '../types';
import { Badge, Panneau, Titre } from '../ui';

export function Comment() {
  const { partageEtat } = useRev();
  const [actu, setActu] = useState<Actu | null>(null);
  useEffect(() => {
    void chargerActu().then(setActu);
  }, []);
  const fluxOk = actu?.sources.filter((s) => s.ok).length ?? 0;

  return (
    <div className="space-y-4">
      <Titre>Comment ça marche</Titre>

      <Panneau className="space-y-2">
        <p className="affiche text-jaune">1. Les questions du moment</p>
        <p className="text-sm text-texte">
          Plusieurs fois par jour (toutes les trois heures environ, de la matinée à la soirée), Révolution lit l’actualité publique (franceinfo et Google Actualités, par thème et par
          région). Les faits divers, le sport et les jeux sont écartés. Chaque sujet garde le lien vers son article.
        </p>
        <p className="text-sm text-texte">
          La question posée est toujours neutre : « Ce sujet compte-t-il pour vous ? », « Sur cette mesure, d’après ce
          que vous en savez » ou « Soutenez-vous ce mouvement ? », avec une réponse « Je ne sais pas » ou « Sans
          avis ». Révolution ne prend parti pour personne.
        </p>
        {actu && (
          <p className="text-xs text-gris">
            Dernière récolte {ilYa(actu.genereLe)} : {actu.sujets.length} sujets retenus, {fluxOk} sources sur{' '}
            {actu.sources.length} ont répondu.
          </p>
        )}
      </Panneau>

      <Panneau className="space-y-2">
        <p className="affiche text-jaune">2. Les questions posées par tous</p>
        <p className="text-sm text-texte">
          Un syndicat, une association, un collectif, un élu ou un citoyen peut poser sa question et partager le lien
          (ou le QR code sur un tract). Le nom de l’auteur est celui qu’il a déclaré : il n’est pas vérifié.
        </p>
        <p className="text-sm text-texte">
          Une question signalée par 5 personnes est masquée en attendant d’être revue. L’auteur peut la retirer à tout
          moment.
        </p>
      </Panneau>

      <Panneau className="space-y-2">
        <p className="affiche text-jaune">3. Tes réponses</p>
        <p className="text-sm text-texte">
          Tes réponses sont anonymes : aucun nom, aucun e-mail, aucune position. Seul un identifiant technique
          anonyme permet de compter une seule réponse par appareil. Ta réponse individuelle n’est pas publique : seuls
          les totaux le sont, et ils ne s’affichent qu’après ta propre réponse, pour ne pas t’influencer.
        </p>
        <p className="text-sm text-texte">
          Ce sont des consultations ouvertes : chacun peut répondre, les résultats ne représentent pas l’opinion de
          toute la population. Ce ne sont pas des sondages.
        </p>
      </Panneau>

      <Panneau className="space-y-2">
        <p className="affiche text-jaune">4. État du recueil partagé</p>
        <p className="text-sm text-texte">
          {partageEtat === 'actif' && (
            <>
              <Badge ton="vert">Ouvert</Badge> Les réponses et les questions sont partagées entre tous.
            </>
          )}
          {partageEtat === 'verification' && 'Vérification en cours…'}
          {partageEtat === 'inactif' && (
            <>
              <Badge ton="rouge">Pas encore ouvert</Badge> Raison : {raisonInactif() || 'inconnue'}. En attendant, tes
              réponses restent sur cet appareil.
            </>
          )}
        </p>
      </Panneau>
    </div>
  );
}

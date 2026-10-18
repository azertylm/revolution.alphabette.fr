import { useRevolution } from '../contexte';
import { useNav } from '../navigation';
import { REGLAGES } from '../reglages';
import { emojiNiveau, nomNiveau } from '../regions';
import { dateLisible, nombre } from '../outils';
import { Badge, GrosBouton, Panneau, TitreSection } from '../ui';

/* ==========================================================================
   La file de modération communautaire : le peuple filtre ses propres sujets.
   10 validations → officiel ; 10 rejets → archivé (jamais supprimé).
   Les seuils sont dans src/revolution/reglages.ts.
   ========================================================================== */

export function Attente() {
  const { etat, agir } = useRevolution();
  const nav = useNav();
  const enAttente = etat.sujets.filter((s) => s.statut === 'en-attente');
  const archives = etat.sujets.filter((s) => s.statut === 'ecarte');

  return (
    <div className="space-y-6">
      <Panneau>
        <TitreSection droite={<Badge ton="gris">{enAttente.length} sujets</Badge>}>Sujets en attente</TitreSection>
        <p className="text-xs text-gris">
          Un sujet proposé n’est jamais voté directement : il passe d’abord par ici. Seuils en cours :{' '}
          <strong className="text-jaune">{REGLAGES.seuilValidations} validations</strong> pour devenir officiel,{' '}
          <strong className="text-rouge">{REGLAGES.seuilRejets} rejets</strong> pour être archivé.
        </p>
      </Panneau>

      {enAttente.length === 0 && (
        <Panneau>
          <p className="text-sm text-gris">Aucun sujet en attente. Le peuple a tout tranché.</p>
        </Panneau>
      )}

      {enAttente.map((sujet) => {
        const dejaJuge = etat.sujetsModeres.includes(sujet.id);
        const regionNom = etat.citoyen?.pseudo;
        return (
          <Panneau key={sujet.id} accent="jaune">
            <div className="flex items-start gap-3">
              <span className="text-3xl">{sujet.emoji}</span>
              <div className="flex-1">
                <h3 className="affiche text-lg text-texte">{sujet.nom}</h3>
                <p className="text-xs text-gris">« {sujet.probleme} »</p>
                <p className="mt-1 text-[11px] text-gris">
                  proposé par {sujet.auteur} · {dateLisible(sujet.creeLe)} · {emojiNiveau(sujet.niveau)}{' '}
                  {sujet.niveau === 'national' ? 'France entière' : sujet.territoire}
                </p>
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-bord bg-carte2 p-3">
                <p className="text-[11px] font-bold uppercase text-gris">✔ Ça me concerne aussi</p>
                <p className="affiche text-2xl text-jaune">
                  {sujet.validations}/{REGLAGES.seuilValidations}
                </p>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-bord">
                  <div
                    className="h-full bg-jaune"
                    style={{ width: `${Math.min(100, (sujet.validations / REGLAGES.seuilValidations) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="rounded-xl border border-bord bg-carte2 p-3">
                <p className="text-[11px] font-bold uppercase text-gris">✖ Pas un vrai problème</p>
                <p className="affiche text-2xl text-rouge">
                  {sujet.rejets}/{REGLAGES.seuilRejets}
                </p>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-bord">
                  <div
                    className="h-full bg-rouge"
                    style={{ width: `${Math.min(100, (sujet.rejets / REGLAGES.seuilRejets) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-bold text-gris">
                Voir les 5 questions dérivées automatiquement
              </summary>
              <ol className="mt-2 space-y-1 text-xs text-gris">
                {sujet.questions.map((q, i) => (
                  <li key={q.id}>
                    <span className="text-jaune">{i + 1}.</span> {q.texte}
                  </li>
                ))}
              </ol>
            </details>

            {dejaJuge ? (
              <p className="mt-3 text-xs font-bold text-jaune">✔ Ton avis est enregistré sur ce sujet.</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                <GrosBouton
                  onClick={() => {
                    if (!etat.citoyen) {
                      nav.demanderIdentite('Valider un sujet demande une identité citoyenne — mais pas un statut vérifié.');
                      return;
                    }
                    agir({ type: 'moderer', sujetId: sujet.id, choix: 'valider' });
                  }}
                >
                  ✔️ Ça me concerne aussi
                </GrosBouton>
                <GrosBouton
                  variante="rouge"
                  onClick={() => {
                    if (!etat.citoyen) {
                      nav.demanderIdentite('Rejeter un sujet demande une identité citoyenne.');
                      return;
                    }
                    agir({ type: 'moderer', sujetId: sujet.id, choix: 'rejeter' });
                  }}
                >
                  ✖️ Pas un vrai problème
                </GrosBouton>
                {regionNom && <span className="self-center text-[11px] text-gris">Tu juges en tant que {regionNom}.</span>}
              </div>
            )}
          </Panneau>
        );
      })}

      <section>
        <TitreSection droite={<Badge ton="gris">{archives.length} archivés</Badge>}>
          Sujets écartés (archivés)
        </TitreSection>
        <Panneau>
          {archives.length === 0 ? (
            <p className="text-sm text-gris">Aucun sujet écarté pour l’instant.</p>
          ) : (
            <ul className="space-y-3">
              {archives.map((s) => (
                <li key={s.id} className="rounded-xl border border-bord bg-carte2 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="affiche text-sm text-texte">
                        {s.emoji} {s.nom}
                      </p>
                      <p className="text-[11px] text-gris">« {s.probleme} »</p>
                      <p className="mt-1 text-[11px] text-gris">
                        {nomNiveau(s.niveau)} · {s.territoire} · proposé par {s.auteur}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge ton="rouge">✖ {s.rejets} rejets</Badge>
                      <p className="mt-1 text-[11px] text-gris">✔ {s.validations} validations</p>
                    </div>
                  </div>
                  {s.signalements.length > 0 && (
                    <p className="mt-2 text-[11px] text-gris">
                      Contenu archivé après {s.signalements.length} signalement(s) de pairs. Les votes déjà exprimés
                      restent visibles dans le journal public : rien n’est effacé.
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-[11px] text-gris">
            {nombre(etat.sujets.length)} sujets au total, dont {nombre(enAttente.length)} en attente et{' '}
            {nombre(archives.length)} archivés.
          </p>
        </Panneau>
      </section>
    </div>
  );
}

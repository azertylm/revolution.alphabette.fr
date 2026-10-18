import { useRevolution } from '../contexte';
import { useNav } from '../navigation';
import { emojiNiveau, nomNiveau } from '../regions';
import type { RolePoste, Section as TypeSection } from '../types';
import { dateLisible, nombre } from '../outils';
import { Badge, Etiquette, GrosBouton, Panneau, TitreSection } from '../ui';

/* ==========================================================================
   🏛️ Les sections locales : la Révolution existe aussi hors ligne.
   Rôles strictement organisateurs — coordinateur, modérateurs, trésorier —
   élus par la section tous les 6 mois. Aucun rôle ne peut modifier une
   question, un vote ou un résultat.
   ========================================================================== */

const ROLES: { poste: RolePoste; label: string; mission: string }[] = [
  { poste: 'coordinateur', label: 'Coordinateur', mission: 'Organise le rendez-vous local et transmet le cahier.' },
  { poste: 'moderateur', label: 'Modérateur', mission: 'Nettoie les échanges hors-sujet de la section.' },
  { poste: 'tresorier', label: 'Trésorier', mission: 'Tient les comptes de la section, publiquement.' },
];

function BadgePoste({ poste, titulaire, electionLe }: { poste: RolePoste; titulaire: string | null; electionLe: string }) {
  const role = ROLES.find((r) => r.poste === poste);
  return (
    <div className="rounded-xl border border-bord bg-carte2 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gris">{role?.label ?? poste}</p>
      <p className="affiche text-sm text-texte">{titulaire ?? 'Poste vacant'}</p>
      <p className="text-[10px] text-gris">Élu le {dateLisible(electionLe)} · mandat 6 mois</p>
      <p className="mt-1 text-[10px] text-gris">{role?.mission}</p>
    </div>
  );
}

function CarteSection({ section }: { section: TypeSection }) {
  const { etat, agir } = useRevolution();
  const nav = useNav();

  return (
    <Panneau accent="jaune">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="affiche text-lg text-texte">
            {emojiNiveau(section.niveau)} Section {nomNiveau(section.niveau).toLowerCase()} — {section.territoire}
          </p>
          <p className="text-[11px] text-gris">
            {nombre(section.citoyensActifs)} citoyens actifs · {section.roles.length} rôle(s) pourvu(s)
          </p>
        </div>
        <Etiquette>Ordre du jour : les 5 sujets du moment</Etiquette>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {section.roles.map((role) => (
          <BadgePoste key={role.poste} poste={role.poste} titulaire={role.titulaire} electionLe={role.electionLe} />
        ))}
      </div>

      {section.candidats.length > 0 ? (
        <div className="mt-4">
          <TitreSection droite={<Badge ton="rouge">Élection ouverte — tous les 6 mois</Badge>}>
            Candidatures à la section
          </TitreSection>
          <ul className="space-y-3">
            {section.candidats.map((candidat) => {
              const total = candidat.oui + candidat.non + candidat.sansAvis;
              const dejaVote = etat.mesElections.includes(candidat.id);
              return (
                <li key={candidat.id} className="rounded-xl border border-bord bg-carte2 p-3">
                  <p className="text-sm font-bold text-texte">
                    {candidat.pseudo} <span className="text-gris">— {ROLES.find((r) => r.poste === candidat.poste)?.label}</span>
                  </p>
                  <p className="mt-1 text-xs italic text-gris">« {candidat.phrase} »</p>
                  <p className="mt-1 text-[11px] text-gris">
                    {nombre(total)} votants · {Math.round((candidat.oui / Math.max(1, total)) * 100)} % de OUI
                  </p>
                  {dejaVote ? (
                    <p className="mt-2 text-[11px] font-bold text-jaune">✔ Ton vote est enregistré.</p>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <GrosBouton
                        onClick={() => {
                          if (!etat.citoyen) {
                            nav.demanderIdentite('Élire un coordinateur demande une identité citoyenne.');
                            return;
                          }
                          agir({ type: 'soutenir-candidat', sectionId: section.id, candidatId: candidat.id, choix: 'oui' });
                        }}
                      >
                        ✅ Je soutiens
                      </GrosBouton>
                      <GrosBouton
                        variante="rouge"
                        onClick={() => {
                          if (!etat.citoyen) {
                            nav.demanderIdentite('Voter contre une candidature demande une identité citoyenne.');
                            return;
                          }
                          agir({ type: 'soutenir-candidat', sectionId: section.id, candidatId: candidat.id, choix: 'non' });
                        }}
                      >
                        ❌ Non
                      </GrosBouton>
                      <GrosBouton
                        variante="neutre"
                        onClick={() => {
                          if (!etat.citoyen) {
                            nav.demanderIdentite('Voter demande une identité citoyenne.');
                            return;
                          }
                          agir({
                            type: 'soutenir-candidat',
                            sectionId: section.id,
                            candidatId: candidat.id,
                            choix: 'sans-avis',
                          });
                        }}
                      >
                        🤷 Sans avis
                      </GrosBouton>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="mt-3 text-[11px] text-gris">
          Aucune élection en cours dans cette section. Les candidatures s’ouvrent tous les 6 mois ; chacun peut se
          présenter avec une phrase, sans CV.
        </p>
      )}

      <p className="mt-3 text-[11px] text-gris">
        Les rôles ne peuvent ni modifier une question, ni un vote, ni un résultat : les questions sont dérivées
        automatiquement, les votes sont publics et le cahier est généré par le moteur. Ils organisent, ils ne décident
        pas.
      </p>
    </Panneau>
  );
}

export function Sections() {
  const { etat } = useRevolution();
  const nav = useNav();

  const parNiveau = (['national', 'region', 'departement', 'commune'] as const).map((niveau) => ({
    niveau,
    sections: etat.sections.filter((s) => s.niveau === niveau),
  }));

  return (
    <div className="space-y-5">
      <Panneau>
        <TitreSection droite={<Etiquette>{etat.sections.length} sections</Etiquette>}>
          🏛️ Les sections locales
        </TitreSection>
        <p className="text-xs text-gris">
          Une section par territoire — commune, département, région — plus une section nationale. Calendrier
          multi-niveaux : chaque section organise ses rendez-vous dans son périmètre, avec son propre cahier de
          doléances.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <GrosBouton variante="neutre" onClick={() => nav.aller({ vue: 'fil' })}>
            🗺️ Voir la carte « Le fil du peuple »
          </GrosBouton>
          <GrosBouton variante="neutre" onClick={() => nav.aller({ vue: 'rendez-vous' })}>
            📅 Calendrier multi-niveaux
          </GrosBouton>
        </div>
      </Panneau>

      {parNiveau.map(
        (groupe) =>
          groupe.sections.length > 0 && (
            <section key={groupe.niveau} className="space-y-3">
              <TitreSection droite={<Badge ton="gris">{groupe.sections.length}</Badge>}>
                {emojiNiveau(groupe.niveau)} Niveau {nomNiveau(groupe.niveau).toLowerCase()}
              </TitreSection>
              {groupe.sections.map((section) => (
                <CarteSection key={section.id} section={section} />
              ))}
            </section>
          ),
      )}
    </div>
  );
}

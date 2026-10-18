import { useState } from 'react';
import {
  ASSEMBLEES,
  SIEGES,
  assembleeDeSection,
  bilanAssemblee,
  classementCandidats,
  mandatsEnCours,
} from '../assemblee';
import { useRevolution } from '../contexte';
import { useNav } from '../navigation';
import { REGLAGES } from '../reglages';
import { dateLisible, nombre } from '../outils';
import { Badge, Choix, Compteur, Etiquette, GrosBouton, Panneau, TitreSection } from '../ui';

/* ==========================================================================
   🏛️ L'ASSEMBLÉE DU PEUPLE — vingt administrateurs par région.

   Le citoyen soutient des volontaires ; la machine fait tout le reste :
   échéances, dépouillement, installation des sièges, ouverture des sections.
   Aucun administrateur ne peut toucher à un vote, une question ou un
   résultat : l'Assemblée organise et transmet, elle ne décide pas.
   ========================================================================== */

const POSTES: { cle: 'coordinateur' | 'moderateur' | 'tresorier'; label: string }[] = [
  { cle: 'coordinateur', label: 'Coordination' },
  { cle: 'moderateur', label: 'Modération' },
  { cle: 'tresorier', label: 'Trésorerie' },
];

/** Les 20 sièges d'une assemblée, remplis ou libres, en un coup d'œil. */
function GrilleSieges({ regionId }: { regionId: string }) {
  const { etat } = useRevolution();
  const mandats = mandatsEnCours(etat, regionId);
  const cases = Array.from({ length: SIEGES }, (_, i) => mandats[i] ?? null);
  return (
    <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
      {cases.map((m, i) => (
        <div
          key={m?.id ?? `libre-${i}`}
          className={`rounded-lg border-[3px] px-1 py-1.5 text-center ${
            m ? 'border-bord bg-carte2' : 'border-dashed border-bord bg-carte/50'
          }`}
          title={m ? `Mandat jusqu'au ${dateLisible(m.fin)}` : 'Siège libre : installé à la prochaine Refonte'}
        >
          <p className="text-[9px] font-black text-gris">#{i + 1}</p>
          <p className={`affiche truncate text-[11px] leading-tight ${m ? 'text-texte' : 'text-gris'}`}>
            {m ? m.titulaire : 'libre'}
          </p>
          <p className="truncate text-[9px] text-gris">{m ? dateLisible(m.fin) : 'au vote'}</p>
        </div>
      ))}
    </div>
  );
}

/** Un volontaire : sa phrase, son soutien, et les trois gros boutons. */
function CarteVolontaire({ id }: { id: string }) {
  const { etat, agir } = useRevolution();
  const nav = useNav();
  const candidat = etat.candidatsAdmin.find((c) => c.id === id);
  if (!candidat) return null;
  const deja = etat.soutiensAdmin.includes(candidat.id);
  const plafond = etat.soutiensAdmin.length >= REGLAGES.soutiensParCitoyen;
  const voter = (choix: 'oui' | 'non' | 'sans-avis') => {
    if (!etat.citoyen) {
      nav.demanderIdentite('Pour soutenir un volontaire, il faut être citoyen.');
      return;
    }
    agir({ type: 'soutenir-administrateur', candidatId: candidat.id, choix });
  };
  return (
    <div className="rounded-xl border-[3px] border-bord bg-carte p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="affiche text-base text-texte">
          {candidat.dejaElu && '🎖️ '}
          {candidat.pseudo}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Badge ton="jaune">{nombre(candidat.voix)} soutien{candidat.voix > 1 ? 's' : ''}</Badge>
          {candidat.reserves > 0 && <Badge ton="gris">{nombre(candidat.reserves)} réserve(s)</Badge>}
        </div>
      </div>
      <p className="mt-2 text-[13px] text-gris">« {candidat.phrase} »</p>
      <Choix>
        <GrosBouton
          variante={deja ? 'neutre' : 'jaune'}
          disabled={deja || plafond}
          onClick={() => voter('oui')}
          className="flex-1"
        >
          ✅ {deja ? 'Soutenu' : 'Je soutiens'}
        </GrosBouton>
        <GrosBouton variante="neutre" disabled={deja || plafond} onClick={() => voter('non')}>
          ❌ Non
        </GrosBouton>
        <GrosBouton variante="neutre" disabled={deja || plafond} onClick={() => voter('sans-avis')}>
          🤷 Sans avis
        </GrosBouton>
      </Choix>
      {plafond && !deja && (
        <p className="mt-2 text-[11px] text-gris">
          Tu as déjà soutenu {REGLAGES.soutiensParCitoyen} volontaires : personne ne soutient tout le monde.
        </p>
      )}
    </div>
  );
}

export function Assemblee() {
  const { etat, agir } = useRevolution();
  const nav = useNav();
  const [choisie, setChoisie] = useState(etat.citoyen?.region ?? 'occitanie');
  const [phrase, setPhrase] = useState('');

  const bilan = bilanAssemblee(etat);
  const volontaires = classementCandidats(etat, choisie);
  const pourvus = mandatsEnCours(etat, choisie);
  const nomChoisi = ASSEMBLEES.find((a) => a.id === choisie)?.nom ?? 'France';
  const maSection = etat.sections.find((s) => assembleeDeSection(s) === choisie);
  const membre = Boolean(maSection && etat.adhesions.includes(maSection.id));
  const monPseudo = etat.citoyen?.pseudo ?? '';
  const maCandidature = etat.candidatsAdmin.find((c) => c.regionId === choisie && c.pseudo === monPseudo);
  const dernieres = etat.journal.filter((e) => e.type === 'assemblee').slice(0, 4);

  return (
    <div className="space-y-5">
      <div>
        <TitreSection droite={<Badge ton="rouge">tout est automatique</Badge>}>
          🏛️ L’Assemblée du peuple
        </TitreSection>
        <Panneau accent="jaune" dure>
          <p className="text-[14px] leading-relaxed text-texte">
            <strong className="affiche">{SIEGES} administrateurs par région</strong>, élus en continu par les
            citoyens inscrits. Tu soutiens des volontaires ; la machine se charge du reste : dépouillement,
            installation des sièges libres, fin des mandats, ouverture des sections locales.
          </p>
          <p className="mt-2 text-[13px] text-gris">
            Règle absolue : un administrateur <strong>ne peut pas</strong> modifier un vote, une question ou un
            résultat. Il organise les réunions, modère les échanges et porte le cahier du peuple. Un mandat dure{' '}
            {Math.round(REGLAGES.mandatMs / (30 * 24 * 60 * 60 * 1000))} mois, sans reconduction automatique.
          </p>
        </Panneau>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Compteur valeur={`${bilan.siegesPourvus}/${bilan.siegesTotal}`} legende="sièges pourvus" ton="jaune" />
        <Compteur valeur={bilan.assemblees} legende="assemblées (1 par région)" ton="texte" />
        <Compteur valeur={bilan.sectionsOuvertes} legende="sections ouvertes" ton="texte" />
        <Compteur valeur={bilan.membres} legende="citoyens inscrits" ton="rouge" />
      </div>

      {/* ======================= MA SECTION LOCALE ========================= */}
      <div>
        <TitreSection droite={<Badge ton="jaune">{nombre(pourvus.length)}/{SIEGES} sièges</Badge>}>
          📍 Ma section — {nomChoisi}
        </TitreSection>
        <Panneau>
          {maSection ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="affiche text-lg text-texte">Section de {maSection.territoire}</p>
                  <p className="text-[12px] text-gris">
                    {nombre(maSection.membres)} citoyens inscrits · {nombre(maSection.citoyensActifs)} participants actifs
                    {maSection.ouverteLe && ` · ouverte le ${dateLisible(maSection.ouverteLe)}`}
                  </p>
                </div>
                {membre && <Badge ton="vert">✅ tu es membre</Badge>}
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {POSTES.map(({ cle, label }) => {
                  const role = maSection.roles.find((r) => r.poste === cle);
                  return (
                    <div key={cle} className="rounded-xl border-2 border-bord bg-carte2 px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-wide text-gris">{label}</p>
                      <p className="affiche truncate text-sm text-texte">{role?.titulaire ?? 'vacant'}</p>
                      <p className="text-[10px] text-gris">
                        {role?.titulaire ? `depuis le ${dateLisible(role.electionLe)}` : 'élu automatiquement'}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3">
                {membre ? (
                  <GrosBouton
                    variante="neutre"
                    onClick={() => agir({ type: 'quitter-section', sectionId: maSection.id })}
                  >
                    Quitter la section
                  </GrosBouton>
                ) : (
                  <GrosBouton
                    variante="jaune"
                    className="w-full"
                    onClick={() => {
                      if (!etat.citoyen) {
                        nav.demanderIdentite('Pour rejoindre une section locale, il faut être citoyen.');
                        return;
                      }
                      agir({ type: 'rejoindre-section', sectionId: maSection.id });
                    }}
                  >
                    🏛️ Rejoindre la section de {maSection.territoire}
                  </GrosBouton>
                )}
              </div>
            </>
          ) : (
            <div>
              <p className="text-[14px] text-texte">
                Il n’y a pas encore de section à {nomChoisi}. Elle s’ouvrira <strong>toute seule</strong> dès que{' '}
                {REGLAGES.demandesPourOuvrir} volontaires s’y présenteront pour l’animer.
              </p>
              <p className="mt-2 text-[12px] text-gris">
                En attendant, tu peux te porter volontaire ci-dessous : c’est exactement ce qui déclenche l’ouverture.
              </p>
            </div>
          )}
        </Panneau>
      </div>

      {/* ======================= LES 20 SIÈGES ============================ */}
      <div>
        <TitreSection droite={<Etiquette>{Math.round((pourvus.length / SIEGES) * 100)} % pourvu</Etiquette>}>
          🪑 Les {SIEGES} sièges — {nomChoisi}
        </TitreSection>
        <Panneau>
          <GrilleSieges regionId={choisie} />
          <p className="mt-3 text-[12px] text-gris">
            Les sièges libres sont installés <strong>au fur et à mesure</strong> : {REGLAGES.installationsParRefonte} au
            maximum par Refonte, toujours au volontaire le mieux soutenu. Une place se libère à la fin du mandat,
            jamais avant.
          </p>
        </Panneau>
      </div>

      {/* ======================= SE PORTER VOLONTAIRE ====================== */}
      <div>
        <TitreSection>✊ Me porter volontaire</TitreSection>
        <Panneau accent="rouge">
          {maCandidature ? (
            <>
              <p className="affiche text-base text-texte">Tu es candidat(e) à {nomChoisi}</p>
              <p className="mt-1 text-[13px] text-gris">
                « {maCandidature.phrase} » — {nombre(maCandidature.voix)} soutien(s). Dès que tu dépasses le seuil et
                qu’un siège est libre, tu es installé(e) sans aucune démarche.
              </p>
            </>
          ) : (
            <>
              <p className="text-[13px] text-texte">
                Une phrase, c’est tout. Aucun CV, aucune étiquette, aucun argent. Tu deviens éligible dès le premier
                soutien citoyen.
              </p>
              <textarea
                value={phrase}
                onChange={(e) => setPhrase(e.target.value.slice(0, 140))}
                rows={2}
                placeholder="Ce que je ferai, en une phrase…"
                className="mt-3 w-full rounded-xl border-[3px] border-bord bg-carte px-3 py-2 text-[14px] text-texte"
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <GrosBouton
                  variante="rouge"
                  disabled={phrase.trim().length < 10}
                  onClick={() => {
                    if (!etat.citoyen) {
                      nav.demanderIdentite('Pour te porter volontaire, il faut être citoyen.');
                      return;
                    }
                    agir({ type: 'candidater', phrase: phrase.trim() });
                    setPhrase('');
                  }}
                >
                  ✊ Me porter volontaire
                </GrosBouton>
                <span className="text-[11px] text-gris">{140 - phrase.length} caractères restants</span>
              </div>
            </>
          )}
        </Panneau>
      </div>

      {/* ======================= LES VOLONTAIRES =========================== */}
      <div>
        <TitreSection droite={<Badge ton="gris">{volontaires.length} en attente</Badge>}>
          🗳️ Les volontaires — {nomChoisi}
        </TitreSection>
        <div className="space-y-2">
          {volontaires.slice(0, 8).map((c) => (
            <CarteVolontaire key={c.id} id={c.id} />
          ))}
          {volontaires.length === 0 && (
            <Panneau>
              <p className="text-[13px] text-gris">
                Personne n’est encore volontaire ici. Sois le premier : l’Assemblée se remplit toujours par le bas.
              </p>
            </Panneau>
          )}
        </div>
        <p className="mt-2 text-[11px] text-gris">
          Un citoyen soutient {REGLAGES.soutiensParCitoyen} volontaires au maximum. Le soutien n’est jamais un vote de
          confiance définitive : à chaque refonte, les soutiens évoluent.
        </p>
      </div>

      {/* ======================= LA RÉGIE AUTOMATIQUE ====================== */}
      <div>
        <TitreSection>⚙️ Ce que la machine fait toute seule</TitreSection>
        <Panneau accent="jaune">
          <ul className="space-y-2 text-[13px] text-texte">
            <li>⏳ <strong>Fin des mandats</strong> : à la date prévue, le siège est libéré et remis au vote. Sans exception.</li>
            <li>🪑 <strong>Installation des sièges</strong> : {REGLAGES.installationsParRefonte} par Refonte, au volontaire le mieux soutenu.</li>
            <li>🏛️ <strong>Ouverture des sections</strong> : dès {REGLAGES.demandesPourOuvrir} volontaires, la section locale s’ouvre seule.</li>
            <li>🎖️ <strong>Coordination</strong> : le premier élu d’une région prend la coordination de sa section.</li>
            <li>🔔 <strong>Information</strong> : chaque élection est publiée au journal et notifiée à ceux qui ont soutenu.</li>
          </ul>
          {dernieres.length > 0 && (
            <div className="mt-3 space-y-2 border-t-2 border-bord pt-3">
              <p className="text-[10px] font-black uppercase tracking-wide text-gris">Dernier bulletin automatique</p>
              {dernieres.map((e) => (
                <p key={e.id} className="text-[12px] text-gris">
                  {e.texte}
                </p>
              ))}
            </div>
          )}
        </Panneau>
      </div>

      {/* ======================= S'ORGANISER =============================== */}
      <div>
        <TitreSection>🏘️ S’organiser, réfléchir, proposer</TitreSection>
        <Panneau>
          <p className="text-[13px] text-texte">
            Une section, c’est une poignée de voisins qui se retrouvent : on y discute des propositions, on prépare
            les réunions, on porte le cahier du peuple. L’Assemblée ne remplace jamais le vote : elle l’organise.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <GrosBouton variante="jaune" onClick={() => nav.aller({ vue: 'accueil' })}>
              ✊ Proposer une idée au vote
            </GrosBouton>
            <GrosBouton variante="neutre" onClick={() => nav.aller({ vue: 'sections' })}>
              Les sections près de chez moi
            </GrosBouton>
            <GrosBouton variante="neutre" onClick={() => nav.aller({ vue: 'rendez-vous' })}>
              📅 Le cahier & les rendez-vous
            </GrosBouton>
          </div>
        </Panneau>
      </div>

      {/* ======================= LES AUTRES ASSEMBLÉES ===================== */}
      <div>
        <TitreSection>🗺️ Toutes les assemblées</TitreSection>
        <div className="space-y-1.5">
          {ASSEMBLEES.map((a) => {
            const p = mandatsEnCours(etat, a.id).length;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setChoisie(a.id)}
                className={`flex w-full items-center gap-2 rounded-xl border-[3px] px-3 py-2 text-left ${
                  a.id === choisie ? 'border-jaune bg-carte2' : 'border-bord bg-carte'
                }`}
              >
                <span className="affiche min-w-0 flex-1 truncate text-[13px] text-texte">
                  {a.id === 'national' ? '🇫🇷 ' : ''}
                  {a.nom}
                  {a.id === etat.citoyen?.region && <span className="text-jaune"> · ma région</span>}
                </span>
                <span className="h-2.5 w-20 shrink-0 overflow-hidden rounded-full bg-carte2 sm:w-28">
                  <span className="block h-full bg-jaune" style={{ width: `${(p / SIEGES) * 100}%` }} />
                </span>
                <span className={`affiche shrink-0 text-[12px] ${p >= SIEGES ? 'text-emerald-500' : 'text-gris'}`}>
                  {p}/{SIEGES}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <GrosBouton variante="neutre" onClick={() => nav.aller({ vue: 'sections' })}>
            Toutes les sections locales
          </GrosBouton>
          <GrosBouton variante="neutre" onClick={() => nav.aller({ vue: 'fil' })}>
            🗺️ Le fil du peuple
          </GrosBouton>
        </div>
      </div>
    </div>
  );
}

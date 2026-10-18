import { useMemo, useState } from 'react';
import { ExportCahier } from '../composants/ExportCahier';
import { useRevolution } from '../contexte';
import { exigences, statsGlobales, type Exigence } from '../moteur';
import { useNav } from '../navigation';
import { REGLAGES } from '../reglages';
import { region } from '../regions';
import type { Niveau, RendezVous as Rdv } from '../types';
import { aujourdHui } from '../etat';
import { dateLisible, joursRestants, nombre, pct, statsQuestion } from '../outils';
import { Badge, Etiquette, GrosBouton, Panneau, TitreSection } from '../ui';

/* ==========================================================================
   📅 Le rendez-vous avec l'État : un calendrier multi-niveaux (ma commune,
   mon département, ma région, national), avec pour chacun son compte à rebours
   et son cahier de doléances généré depuis les votes de son périmètre.
   ========================================================================== */

const STATUTS_EXIGENCE: Record<string, { emoji: string; texte: string; ton: 'jaune' | 'rouge' | 'gris' | 'vert' }> = {
  'a-presenter': { emoji: '🟡', texte: 'À présenter', ton: 'jaune' },
  presentee: { emoji: '🔴', texte: 'Présentée', ton: 'rouge' },
  'en-reponse': { emoji: '🔵', texte: 'En réponse', ton: 'gris' },
  relancee: { emoji: '✊', texte: 'Relancée par le peuple', ton: 'rouge' },
  satisfaite: { emoji: '⚪', texte: 'Réponse du peuple : satisfaite', ton: 'vert' },
};

function LigneExigence({ exigence, rang }: { exigence: Exigence; rang: number }) {
  const { agir } = useRevolution();
  const nav = useNav();
  const { sujet, question, score } = exigence;
  const st = statsQuestion(question);
  const statut = STATUTS_EXIGENCE[question.statut ?? 'a-presenter'];

  return (
    <li className="rounded-2xl border border-bord bg-carte p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1">
          <p className="affiche text-sm text-texte sm:text-base">
            <span className="mr-2 text-jaune">{rang}.</span>
            {sujet.emoji} {sujet.nom} — {question.texte}
          </p>
          <p className="mt-1 text-[11px] font-bold text-gris">
            {pct(st.ouiPct)} OUI · {nombre(st.total)} votants · {Math.round(question.budgetMoyen)} pts de budget moyen ·
            score {nombre(score)}
          </p>
          <p className="mt-1 text-[11px] italic text-gris">
            {nombre(st.total)} citoyens ont voté OUI à {pct(st.ouiPct)} et alloué en moyenne{' '}
            {Math.round(question.budgetMoyen)} points de budget à cette mesure.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge ton={statut.ton}>
            {statut.emoji} {statut.texte}
          </Badge>
          <Etiquette>{sujet.niveau === 'national' ? 'France entière' : sujet.territoire}</Etiquette>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {(question.statut ?? 'a-presenter') === 'a-presenter' && (
          <GrosBouton variante="rouge" onClick={() => agir({ type: 'presenter-exigence', sujetId: sujet.id, questionId: question.id })}>
            🔴 Déposer à l’État
          </GrosBouton>
        )}
        {question.statut === 'presentee' && (
          <>
            <span className="self-center text-[11px] text-gris">Réponse de l’État (simulée) :</span>
            <GrosBouton variante="vert" onClick={() => agir({ type: 'reponse-etat', sujetId: sujet.id, questionId: question.id, reponse: 'accepte' })}>
              ✅ Accepté
            </GrosBouton>
            <GrosBouton variante="rouge" onClick={() => agir({ type: 'reponse-etat', sujetId: sujet.id, questionId: question.id, reponse: 'refuse' })}>
              ❌ Refusé
            </GrosBouton>
            <GrosBouton variante="neutre" onClick={() => agir({ type: 'reponse-etat', sujetId: sujet.id, questionId: question.id, reponse: 'etude' })}>
              🔵 Renvoi à étude
            </GrosBouton>
          </>
        )}
        {(question.statut === 'en-reponse' || question.statut === 'relancee') && (
          <GrosBouton variante="jaune" onClick={() => nav.aller({ vue: 'sujet', sujetId: sujet.id, questionId: question.id })}>
            ⚪ Voter la satisfaction du peuple
          </GrosBouton>
        )}
      </div>
    </li>
  );
}

export function RendezVous() {
  const { etat, agir } = useRevolution();
  const nav = useNav();
  const [onglet, setOnglet] = useState<'calendrier' | 'historique'>('calendrier');
  const [perimetreId, setPerimetreId] = useState<'commune' | 'departement' | 'region' | 'national'>('region');
  const [formulaire, setFormulaire] = useState({ date: aujourdHui(), heure: '15:00', nature: 'Audience', lieu: '' });

  const infos = region(etat.citoyen?.region ?? 'occitanie');
  const perimetres: { id: 'commune' | 'departement' | 'region' | 'national'; niveau: Niveau; territoire: string; label: string }[] = [
    { id: 'commune', niveau: 'commune', territoire: infos.communeExemple, label: `🏘️ ${infos.communeExemple}` },
    { id: 'departement', niveau: 'departement', territoire: infos.departementExemple, label: `🏛️ ${infos.departementExemple}` },
    { id: 'region', niveau: 'region', territoire: infos.nom, label: `🗺️ ${infos.nom}` },
    { id: 'national', niveau: 'national', territoire: 'France', label: '🇫🇷 National' },
  ];
  const perimetre = perimetres.find((p) => p.id === perimetreId) ?? perimetres[2];

  const liste = useMemo(
    () => exigences(etat, { niveau: perimetre.niveau, territoire: perimetre.territoire }),
    [etat, perimetre.niveau, perimetre.territoire],
  );
  const rdvs = etat.rendezVous
    .filter((r) => r.niveau === perimetre.niveau && r.territoire === perimetre.territoire)
    .sort((a, b) => a.date.localeCompare(b.date));
  const prochain = rdvs.find((r) => r.statut === 'officiel' && joursRestants(r.date) >= 0);
  const proposes = rdvs.filter((r) => r.statut === 'propose');
  const passe = etat.rendezVous.filter((r) => r.statut === 'termine');
  const stats = statsGlobales(etat);
  const verrouille = prochain ? joursRestants(prochain.date) === 0 && new Date().getHours() >= REGLAGES.verrouillageHeure : false;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setOnglet('calendrier')}
          className={`affiche rounded-xl px-3 py-2 text-xs ${onglet === 'calendrier' ? 'bg-jaune text-black' : 'border border-bord bg-carte text-gris'}`}
        >
          📅 Calendrier & cahier
        </button>
        <button
          type="button"
          onClick={() => setOnglet('historique')}
          className={`affiche rounded-xl px-3 py-2 text-xs ${onglet === 'historique' ? 'bg-jaune text-black' : 'border border-bord bg-carte text-gris'}`}
        >
          📚 Historique des rendez-vous
        </button>
      </div>

      {onglet === 'calendrier' && (
        <>
          <nav className="flex flex-wrap gap-2">
            {perimetres.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPerimetreId(p.id)}
                className={`rounded-xl px-3 py-2 text-xs font-bold ${
                  perimetreId === p.id ? 'bg-rouge text-white' : 'border border-bord bg-carte text-gris'
                }`}
              >
                {p.label}
              </button>
            ))}
          </nav>

          {verrouille && (
            <Panneau accent="rouge">
              <p className="affiche text-sm text-rouge">
                🔒 Cahier verrouillé à {REGLAGES.verrouillageHeure} h : il ne peut plus changer jusqu’à la fin du
                rendez-vous. {liste.length} exigences vont être présentées au nom du peuple.
              </p>
            </Panneau>
          )}

          {prochain ? (
            <Panneau accent="rouge">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Badge ton="rouge">📅 Prochain rendez-vous — {perimetre.label}</Badge>
                  <p className="affiche mt-2 text-2xl text-texte sm:text-4xl">
                    {dateLisible(prochain.date)} · {prochain.heure}
                  </p>
                  <p className="mt-1 text-sm text-texte">
                    {prochain.nature} — {prochain.lieu}
                  </p>
                  <p className="mt-1 text-[11px] text-gris">
                    {nombre(prochain.validations)} validations citoyennes · {liste.length} exigences dans le cahier
                  </p>
                </div>
                <div className="rounded-2xl border border-bord bg-carte2 px-4 py-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gris">Jours restants</p>
                  <p className="affiche text-4xl text-jaune sm:text-5xl">{joursRestants(prochain.date)}</p>
                </div>
              </div>
            </Panneau>
          ) : (
            <Panneau>
              <p className="text-sm text-gris">
                Aucun rendez-vous officiel dans ce périmètre. N’importe qui peut en déclarer un : la communauté le
                valide ensuite.
              </p>
            </Panneau>
          )}

          {proposes.length > 0 && (
            <Panneau>
              <TitreSection>Rendez-vous proposés par des citoyens</TitreSection>
              <ul className="space-y-3">
                {proposes.map((rdv) => (
                  <li key={rdv.id} className="rounded-xl border border-bord bg-carte2 p-3">
                    <p className="text-sm font-bold text-texte">
                      {dateLisible(rdv.date)} · {rdv.heure} — {rdv.nature}
                    </p>
                    <p className="text-[11px] text-gris">{rdv.lieu}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge ton="jaune">
                        {rdv.validations}/{REGLAGES.seuilValidations} validations
                      </Badge>
                      <GrosBouton
                        variante="neutre"
                        disabled={etat.rdvValides.includes(rdv.id)}
                        onClick={() => {
                          if (!etat.citoyen) {
                            nav.demanderIdentite('Valider un rendez-vous demande une identité citoyenne.');
                            return;
                          }
                          agir({ type: 'valider-rdv', rdvId: rdv.id });
                        }}
                      >
                        ✔️ Je valide ce rendez-vous
                      </GrosBouton>
                    </div>
                  </li>
                ))}
              </ul>
            </Panneau>
          )}

          <Panneau>
            <TitreSection>Déclarer un rendez-vous</TitreSection>
            <div className="grid gap-2 sm:grid-cols-4">
              <input
                type="date"
                value={formulaire.date}
                onChange={(e) => setFormulaire({ ...formulaire, date: e.target.value })}
                className="rounded-xl border border-bord bg-carte2 p-3 text-sm text-texte outline-none focus:border-jaune"
              />
              <input
                type="time"
                value={formulaire.heure}
                onChange={(e) => setFormulaire({ ...formulaire, heure: e.target.value })}
                className="rounded-xl border border-bord bg-carte2 p-3 text-sm text-texte outline-none focus:border-jaune"
              />
              <input
                value={formulaire.nature}
                onChange={(e) => setFormulaire({ ...formulaire, nature: e.target.value })}
                placeholder="Négociation, audience, réunion interministérielle…"
                className="rounded-xl border border-bord bg-carte2 p-3 text-sm text-texte outline-none focus:border-jaune"
              />
              <input
                value={formulaire.lieu}
                onChange={(e) => setFormulaire({ ...formulaire, lieu: e.target.value })}
                placeholder="Lieu"
                className="rounded-xl border border-bord bg-carte2 p-3 text-sm text-texte outline-none focus:border-jaune"
              />
            </div>
            <div className="mt-3">
              <GrosBouton
                disabled={!formulaire.lieu.trim()}
                onClick={() => {
                  if (!etat.citoyen) {
                    nav.demanderIdentite('Déclarer un rendez-vous demande une identité citoyenne.');
                    return;
                  }
                  agir({
                    type: 'declarer-rdv',
                    niveau: perimetre.niveau,
                    territoire: perimetre.territoire,
                    date: formulaire.date,
                    heure: formulaire.heure,
                    nature: formulaire.nature,
                    lieu: formulaire.lieu,
                  });
                }}
              >
                📅 Déclarer ce rendez-vous ({perimetre.label})
              </GrosBouton>
            </div>
          </Panneau>

          <section>
            <TitreSection droite={<Badge ton="rouge">{liste.length} exigences</Badge>}>
              Le cahier des doléances — {perimetre.label}
            </TitreSection>
            <ul className="space-y-3">
              {liste.map((e, i) => (
                <LigneExigence key={e.question.id} exigence={e} rang={i + 1} />
              ))}
            </ul>
            {liste.length === 0 && (
              <Panneau>
                <p className="text-sm text-gris">
                  Aucune exigence dans ce périmètre : il faut qu’une question dépasse {REGLAGES.consensusExigence} % de
                  OUI après une Refonte.
                </p>
              </Panneau>
            )}
          </section>

          <ExportCahier rdv={prochain ?? null} liste={liste} />
        </>
      )}

      {onglet === 'historique' && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Panneau accent="rouge">
              <p className="affiche text-5xl text-rouge sm:text-6xl">{pct(stats.reponseEtat)}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-gris">
                des exigences du peuple ont reçu une réponse de l’État
              </p>
            </Panneau>
            <Panneau accent="jaune">
              <p className="affiche text-5xl text-jaune sm:text-6xl">{pct(stats.satisfactionPeuple)}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-gris">
                des réponses ont satisfait le peuple
              </p>
            </Panneau>
          </div>

          <ul className="space-y-3">
            {passe.map((rdv) => (
              <li key={rdv.id} className="rounded-2xl border border-bord bg-carte p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="affiche text-lg text-texte">
                      {dateLisible(rdv.date)} · {rdv.heure}
                    </p>
                    <p className="text-sm text-texte">
                      {rdv.nature} — {rdv.lieu}
                    </p>
                    <p className="mt-1 text-[11px] text-gris">
                      {rdv.niveau === 'national' ? 'France entière' : rdv.territoire} ·{' '}
                      {nombre(rdv.validations)} validations citoyennes
                    </p>
                  </div>
                  {rdv.bilan && (
                    <div className="grid gap-2 sm:grid-cols-3">
                      <div className="rounded-xl border border-bord bg-carte2 px-3 py-2 text-center">
                        <p className="affiche text-lg text-texte">{rdv.bilan.exigencesPresentees}</p>
                        <p className="text-[10px] font-bold uppercase text-gris">exigences présentées</p>
                      </div>
                      <div className="rounded-xl border border-bord bg-carte2 px-3 py-2 text-center">
                        <p className="affiche text-lg text-rouge">{pct(rdv.bilan.tauxReponse)}</p>
                        <p className="text-[10px] font-bold uppercase text-gris">réponses de l’État</p>
                      </div>
                      <div className="rounded-xl border border-bord bg-carte2 px-3 py-2 text-center">
                        <p className="affiche text-lg text-jaune">{pct(rdv.bilan.satisfaction)}</p>
                        <p className="text-[10px] font-bold uppercase text-gris">satisfaction du peuple</p>
                      </div>
                    </div>
                  )}
                </div>
                {rdv.bilan && (
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-bord">
                    <div className="h-full bg-jaune" style={{ width: `${rdv.bilan.satisfaction}%` }} />
                  </div>
                )}
              </li>
            ))}
          </ul>
          <Panneau>
            <p className="text-xs text-gris">
              Chiffres cumulés sur {nombre(passe.length)} rendez-vous passés et {nombre(stats.exigencesPresentees)}{' '}
              exigences déposées. Le peuple garde une trace horodatée de chaque réponse : l’historique est public et ne
              peut pas être réécrit.
            </p>
          </Panneau>
        </>
      )}
    </div>
  );
}

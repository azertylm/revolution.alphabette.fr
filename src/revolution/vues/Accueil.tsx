import { useMemo } from 'react';
import { useRevolution } from '../contexte';
import { MOBILISES_DU_MOIS } from '../donnees';
import { classement, exigences, scoreSujet } from '../moteur';
import { useNav } from '../navigation';
import { dansPerimetre, emojiNiveau, nomRegion } from '../regions';
import type { Sujet } from '../types';
import { dateLisible, joursRestants, nombre, pct } from '../outils';
import { Badge, Etiquette, GrosBouton, Jauge, Panneau, TitreSection } from '../ui';

function Tuile({ sujet, rang }: { sujet: Sujet; rang: number }) {
  const { etat } = useRevolution();
  const nav = useNav();
  const mes = sujet.questions.filter((q) => etat.mesVotes[`${sujet.id}:${q.id}`]).length;
  const exigencesSujet = sujet.questions.filter((q) => q.etat === 'exigence').length;
  const oui = sujet.questions.reduce((acc, q) => acc + q.oui, 0);
  const non = sujet.questions.reduce((acc, q) => acc + q.non, 0);
  const sans = sujet.questions.reduce((acc, q) => acc + q.sansAvis, 0);
  const ouiPct = oui + non + sans > 0 ? (oui / (oui + non + sans)) * 100 : 0;

  return (
    <button
      type="button"
      onClick={() => nav.aller({ vue: 'sujet', sujetId: sujet.id })}
      className="w-full rounded-2xl border border-bord bg-carte p-4 text-left transition hover:border-jaune"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-3xl sm:text-4xl" aria-hidden>
          {sujet.emoji}
        </span>
        <div className="flex flex-col items-end gap-1">
          <Etiquette className="border-jaune text-jaune">
            #{rang} du classement
          </Etiquette>
          <Etiquette>
            {emojiNiveau(sujet.niveau)} {sujet.niveau === 'national' ? 'France entière' : sujet.territoire}
          </Etiquette>
        </div>
      </div>
      <h3 className="affiche mt-3 text-xl text-texte sm:text-2xl">{sujet.nom}</h3>
      <p className="mt-1 line-clamp-2 text-xs text-gris">{sujet.probleme}</p>
      <div className="mt-3">
        <Jauge oui={oui} non={non} sansAvis={sans} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-gris">
        <span className="text-jaune">{pct(ouiPct)} de OUI</span>
        <span>{nombre(sujet.votants)} votants</span>
        <span>
          {sujet.questions.length} questions · {exigencesSujet} exigence{exigencesSujet > 1 ? 's' : ''}
        </span>
        {mes > 0 && <span className="text-jaune">✔ tu as voté {mes}/5</span>}
      </div>
    </button>
  );
}

export function Accueil() {
  const { etat } = useRevolution();
  const nav = useNav();
  const regionNom = etat.citoyen ? nomRegion(etat.citoyen.region) : 'Occitanie';

  const officiels = useMemo(() => classement(etat.sujets), [etat.sujets]);
  const visibles = officiels.filter((s) => dansPerimetre(s.niveau, s.territoire, nav.perimetre));
  const masques = officiels.length - visibles.length;
  const enAttente = etat.sujets.filter((s) => s.statut === 'en-attente');
  const liste = exigences(etat);
  const prochain = etat.rendezVous
    .filter((rdv) => rdv.statut === 'officiel' && joursRestants(rdv.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  return (
    <div className="space-y-6">
      {/* Sélecteur de territoire : un seul geste. */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => nav.setPerimetre(etat.citoyen?.region ?? 'occitanie')}
          className={`affiche rounded-xl px-3 py-2 text-xs ${
            nav.perimetre !== 'tout' ? 'bg-jaune text-black' : 'border border-bord bg-carte text-gris'
          }`}
        >
          🗺️ Ma région — {regionNom} ▾
        </button>
        <button
          type="button"
          onClick={() => nav.setPerimetre('tout')}
          className={`affiche rounded-xl px-3 py-2 text-xs ${
            nav.perimetre === 'tout' ? 'bg-jaune text-black' : 'border border-bord bg-carte text-gris'
          }`}
        >
          🇫🇷 Toute la France ▾
        </button>
        {masques > 0 && nav.perimetre !== 'tout' && (
          <span className="text-[11px] font-bold text-gris">+ {masques} sujet(s) dans d’autres territoires</span>
        )}
      </div>

      {prochain && (
        <Panneau accent="rouge">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Badge ton="rouge">📅 Prochain rendez-vous avec l’État</Badge>
              <p className="affiche mt-2 text-lg text-texte">
                {dateLisible(prochain.date)} · {prochain.heure} — {prochain.nature}
              </p>
              <p className="text-xs text-gris">
                {prochain.lieu} · dans {joursRestants(prochain.date)} jour(s) · {liste.length} exigences dans le cahier
              </p>
            </div>
            <GrosBouton variante="rouge" onClick={() => nav.aller({ vue: 'rendez-vous' })}>
              Voir le cahier
            </GrosBouton>
          </div>
        </Panneau>
      )}

      <section>
        <TitreSection droite={<Etiquette>{visibles.length} sujets</Etiquette>}>
          Les sujets du moment
        </TitreSection>
        <div className="grid gap-3 sm:grid-cols-2">
          {visibles.map((sujet, index) => (
            <Tuile key={sujet.id} sujet={sujet} rang={index + 1} />
          ))}
        </div>
        {visibles.length === 0 && (
          <Panneau>
            <p className="text-sm text-gris">
              Aucun sujet officiel dans ce territoire pour l’instant. Propose le premier avec « + Proposer un sujet ».
            </p>
          </Panneau>
        )}
      </section>

      <section>
        <TitreSection droite={<Badge ton="gris">{enAttente.length} en attente</Badge>}>
          File de modération communautaire
        </TitreSection>
        <Panneau>
          {enAttente.length === 0 ? (
            <p className="text-sm text-gris">Aucun sujet en attente : le peuple a tout tranché.</p>
          ) : (
            <ul className="space-y-3">
              {enAttente.slice(0, 3).map((s) => (
                <li key={s.id} className="flex items-start justify-between gap-3">
                  <span className="text-sm">
                    <span className="mr-2 text-xl">{s.emoji}</span>
                    <span className="font-bold">{s.nom}</span>
                    <span className="block text-[11px] text-gris">
                      ✔ {s.validations}/10 « ça me concerne aussi » · ✖ {s.rejets}/10 rejets
                    </span>
                  </span>
                  <GrosBouton variante="neutre" onClick={() => nav.aller({ vue: 'attente' })}>
                    Juger
                  </GrosBouton>
                </li>
              ))}
            </ul>
          )}
        </Panneau>
      </section>

      <section>
        <TitreSection>🏆 Mobilisés du mois</TitreSection>
        <Panneau>
          <ul className="space-y-2">
            {MOBILISES_DU_MOIS.slice(0, 5).map((m, i) => (
              <li key={m.pseudo} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2">
                  <span className="affiche w-6 text-jaune">{i + 1}</span>
                  <span className="font-bold">{m.pseudo}</span>
                  {m.badge === 'verifie' && <Badge ton="rouge">✔ vérifié</Badge>}
                </span>
                <span className="text-[11px] font-bold text-gris">{nombre(m.votes)} votants amenés</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-gris">
            Classement anonyme : aucun pouvoir supplémentaire, seulement des citoyens qui font voter les autres. Le
            mode discret remplace le pseudo par « Citoyen #… ».
          </p>
        </Panneau>
      </section>

      <p className="text-center text-[11px] text-gris">
        Score de soutien = votes × part de OUI × intensité budgétaire. Sujet le mieux placé :{' '}
        {visibles[0] ? `${visibles[0].nom} (${nombre(scoreSujet(visibles[0]))})` : '—'}
      </p>
    </div>
  );
}

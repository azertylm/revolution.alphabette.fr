import { useMemo } from 'react';
import { BlocQuestion } from '../composants/CarresVote';
import { TexteCitoyen } from '../composants/Dictionnaire';
import { MinuteDuJour } from '../composants/MinuteDuJour';
import { useRevolution } from '../contexte';
import { MOBILISES_DU_MOIS } from '../donnees';
import { dejaVote } from '../etat';
import { classement, exigences, statsGlobales } from '../moteur';
import { useNav } from '../navigation';
import { REGLAGES } from '../reglages';
import { dansPerimetre, emojiNiveau, nomRegion } from '../regions';
import type { Sujet } from '../types';
import { dateLisible, joursRestants, nombre, pct } from '../outils';
import { Badge, Etiquette, GrosBouton, Jauge, Panneau, TitreSection } from '../ui';

/* ==========================================================================
   L'ACCUEIL — un fil d'actualité où l'on peut voter sans quitter la page.

   Chaque sujet s'affiche comme une affiche : gros titre, gros chiffre, et
   directement la question à laquelle il te reste à répondre, avec ses trois
   carrés de vote. « Pratico-flashy » : on ouvre, on tape, c'est voté.
   ========================================================================== */

function Points({ faits, total }: { faits: number; total: number }) {
  return (
    <span className="flex items-center gap-1" title={`${faits} vote(s) sur ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-2.5 w-2.5 rounded-full ${i < faits ? 'bg-jaune' : 'bg-bord'}`}
        />
      ))}
    </span>
  );
}

function CarteSujet({ sujet, rang }: { sujet: Sujet; rang: number }) {
  const { etat } = useRevolution();
  const nav = useNav();
  const votesFaits = dejaVote(etat, sujet.id);
  const exigencesSujet = sujet.questions.filter((q) => q.etat === 'exigence').length;
  const oui = sujet.questions.reduce((acc, q) => acc + q.oui, 0);
  const non = sujet.questions.reduce((acc, q) => acc + q.non, 0);
  const sans = sujet.questions.reduce((acc, q) => acc + q.sansAvis, 0);
  const ouiPct = oui + non + sans > 0 ? (oui / (oui + non + sans)) * 100 : 0;

  const questionPhare =
    sujet.questions.find((q) => q.etat !== 'ecartee' && !etat.mesVotes[`${sujet.id}:${q.id}`]) ??
    sujet.questions.find((q) => q.etat !== 'ecartee') ??
    sujet.questions[0];

  return (
    <article className="bloc ombre-dure overflow-hidden p-0">
      {/* En-tête du sujet : l'affiche. */}
      <header className="border-b-[3px] border-bord bg-carte2 p-4">
        <div className="flex items-start gap-3">
          <span className="text-5xl leading-none sm:text-6xl" aria-hidden>
            {sujet.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="affiche text-2xl text-texte sm:text-3xl">{sujet.nom}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge ton="jaune">#{rang} du classement</Badge>
              <Etiquette>
                {emojiNiveau(sujet.niveau)} {sujet.niveau === 'national' ? 'Toute la France' : sujet.territoire}
              </Etiquette>
              {exigencesSujet > 0 && <Badge ton="rouge">✊ {exigencesSujet} exigence(s)</Badge>}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="affiche-large text-4xl text-jaune sm:text-5xl">{Math.round(ouiPct)}%</p>
            <p className="text-[10px] font-black uppercase tracking-wide text-gris">de OUI</p>
          </div>
        </div>

        <p className="mt-3 text-sm text-gris">
          « <TexteCitoyen texte={sujet.probleme} /> »
        </p>

        <div className="mt-3">
          <Jauge oui={oui} non={non} sansAvis={sans} hauteur={26} />
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] font-black uppercase tracking-wide text-gris">
          <span>{nombre(sujet.votants)} votants · {sujet.questions.length} questions</span>
          <span className="flex items-center gap-2">
            <Points faits={votesFaits} total={5} />
            {votesFaits}/5 votés
          </span>
        </div>
      </header>

      {/* La question du moment : on vote sur place. */}
      <div className="space-y-3 p-3 sm:p-4">
        <p className="affiche text-xs text-jaune">
          {votesFaits >= 5 ? '✅ Tu as répondu aux 5 questions' : '👆 Réponds maintenant, sans quitter l’accueil'}
        </p>
        <BlocQuestion sujet={sujet} question={questionPhare} compact />

        <div className="flex flex-wrap gap-2">
          <GrosBouton variante="neutre" onClick={() => nav.aller({ vue: 'sujet', sujetId: sujet.id })}>
            Voir les 5 questions, les résultats et la section →
          </GrosBouton>
        </div>
      </div>
    </article>
  );
}

export function Accueil() {
  const { etat, maintenant } = useRevolution();
  const nav = useNav();
  const regionNom = etat.citoyen ? nomRegion(etat.citoyen.region) : 'Occitanie';
  const stats = useMemo(() => statsGlobales(etat), [etat]);

  const officiels = useMemo(() => classement(etat.sujets), [etat.sujets]);
  const visibles = officiels.filter((s) => dansPerimetre(s.niveau, s.territoire, nav.perimetre));
  const masques = officiels.length - visibles.length;
  const enAttente = etat.sujets.filter((s) => s.statut === 'en-attente');
  const liste = exigences(etat);
  const prochain = etat.rendezVous
    .filter((rdv) => rdv.statut === 'officiel' && joursRestants(rdv.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const restantes = officiels.reduce(
    (acc, s) => acc + s.questions.filter((q) => q.etat !== 'ecartee' && !etat.mesVotes[`${s.id}:${q.id}`]).length,
    0,
  );
  const actifs = stats.citoyensActifs + Math.floor((maintenant % 3600000) / 9000);

  return (
    <div className="space-y-5">
      {/* ------------------- LES VOTES, PREMIER ÉLÉMENT DE L'ÉCRAN ----------------- */}
      <section>
        <TitreSection droite={<Badge ton="gris">{visibles.length} sujets</Badge>}>
          ✊ Vote maintenant
        </TitreSection>
        <div className="grid gap-4 lg:grid-cols-2">
          {visibles.map((sujet, index) => (
            <CarteSujet key={sujet.id} sujet={sujet} rang={index + 1} />
          ))}
        </div>
        {visibles.length === 0 && (
          <Panneau>
            <p className="text-sm text-gris">
              Aucun sujet officiel dans ce territoire. Touche « + Proposer un sujet » pour lancer le premier.
            </p>
          </Panneau>
        )}
      </section>

      {/* ------------------- LA MINUTE CITOYENNE (après les votes) ------------------ */}
      <MinuteDuJour />

      {/* ------------------- LE COMPTEUR -------------------------------------------- */}
      <section className="bloc bloc-jaune ombre-dure-jaune p-4 text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gris">Combien sommes-nous ?</p>
        <p key={actifs} className="monte affiche-large mt-1 text-[3.4rem] leading-none text-jaune sm:text-[5rem]">
          {nombre(actifs)}
        </p>
        <p className="mt-1 text-xs font-black uppercase tracking-wide text-gris">
          citoyens actifs · {nombre(stats.votesTotaux)} votes exprimés
        </p>
        {restantes > 0 ? (
          <button
            type="button"
            onClick={() => {
              const premier = visibles[0];
              if (premier) nav.aller({ vue: 'sujet', sujetId: premier.id });
            }}
            className="affiche mt-3 w-full rounded-xl bg-texte px-4 py-3 text-sm text-fond"
          >
            ✊ {restantes} question{restantes > 1 ? 's' : ''} attendent ton vote
          </button>
        ) : (
          <p className="affiche mt-3 rounded-xl bg-carte2 px-4 py-3 text-sm text-jaune">
            Bravo, tu as tout voté. Reviens après la Refonte.
          </p>
        )}
      </section>

      {/* ------------------------------ LE TERRITOIRE ----------------------------- */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => nav.setPerimetre(etat.citoyen?.region ?? 'occitanie')}
          className={`affiche min-h-[3.5rem] rounded-xl border-[3px] px-3 py-2 text-xs leading-tight ${
            nav.perimetre !== 'tout' ? 'border-jaune bg-jaune text-black' : 'border-bord bg-carte text-gris'
          }`}
        >
          🗺️ Ma région
          <span className="block text-[10px] opacity-80">{regionNom}</span>
        </button>
        <button
          type="button"
          onClick={() => nav.setPerimetre('tout')}
          className={`affiche min-h-[3.5rem] rounded-xl border-[3px] px-3 py-2 text-xs leading-tight ${
            nav.perimetre === 'tout' ? 'border-jaune bg-jaune text-black' : 'border-bord bg-carte text-gris'
          }`}
        >
          🇫🇷 Toute la France
          <span className="block text-[10px] opacity-80">{masques > 0 && nav.perimetre !== 'tout' ? `+${masques} ailleurs` : 'le pays entier'}</span>
        </button>
      </div>

      {/* ------------------------------ LE RENDEZ-VOUS ---------------------------- */}
      {prochain && (
        <section className="bloc bloc-rouge ombre-dure-rouge p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Badge ton="rouge">📅 Rendez-vous avec l’État</Badge>
              <p className="affiche mt-2 text-xl text-texte sm:text-2xl">
                {dateLisible(prochain.date)} · {prochain.heure}
              </p>
              <p className="text-xs font-bold text-gris">
                {prochain.nature} — {prochain.lieu}
              </p>
              <p className="mt-1 text-xs font-black uppercase text-jaune">
                {liste.length} exigences au cahier · dans {joursRestants(prochain.date)} jour(s)
              </p>
            </div>
            <GrosBouton variante="rouge" onClick={() => nav.aller({ vue: 'rendez-vous' })}>
              Voir le cahier
            </GrosBouton>
          </div>
        </section>
      )}

      {/* ------------------------------ LA MODÉRATION ----------------------------- */}
      <section>
        <TitreSection droite={<Badge ton="jaune">{enAttente.length} en attente</Badge>} rouge>
          File de modération
        </TitreSection>
        {enAttente.length === 0 ? (
          <Panneau>
            <p className="text-sm text-gris">Aucun sujet en attente : le peuple a tout tranché.</p>
          </Panneau>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {enAttente.slice(0, 2).map((s) => (
              <article key={s.id} className="bloc p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="affiche text-lg text-texte">
                    {s.emoji} {s.nom}
                  </p>
                  <Etiquette>{s.territoire}</Etiquette>
                </div>
                <p className="mt-1 text-xs text-gris">« {s.probleme} »</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border-2 border-jaune bg-carte2 px-3 py-2 text-center">
                    <p className="affiche text-2xl text-jaune">
                      {s.validations}/{REGLAGES.seuilValidations}
                    </p>
                    <p className="text-[10px] font-black uppercase text-gris">ça me concerne</p>
                  </div>
                  <div className="rounded-xl border-2 border-rouge bg-carte2 px-3 py-2 text-center">
                    <p className="affiche text-2xl text-rouge">
                      {s.rejets}/{REGLAGES.seuilRejets}
                    </p>
                    <p className="text-[10px] font-black uppercase text-gris">pas un vrai problème</p>
                  </div>
                </div>
                <div className="mt-3">
                  <GrosBouton variante="neutre" onClick={() => nav.aller({ vue: 'attente' })}>
                    Juger les {enAttente.length} sujets en attente →
                  </GrosBouton>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------ MOBILISÉS -------------------------------- */}
      <section>
        <TitreSection>🏆 Mobilisés du mois</TitreSection>
        <Panneau>
          <ul className="space-y-2">
            {MOBILISES_DU_MOIS.slice(0, 4).map((m, i) => (
              <li key={m.pseudo} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <span className="affiche text-2xl text-jaune">{i + 1}</span>
                  <span className="affiche text-sm text-texte">{m.pseudo}</span>
                  {m.badge === 'verifie' && <Badge ton="rouge">✔ vérifié</Badge>}
                </span>
                <span className="text-[11px] font-black uppercase text-gris">{nombre(m.votes)} votants</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-gris">
            Classement anonyme : aucun pouvoir de plus, seulement des citoyens qui font voter les autres. Mode discret :
            le pseudo devient « Citoyen #… ».
          </p>
        </Panneau>
      </section>

      <p className="text-center text-[11px] text-gris">
        Score de soutien = votes × part de OUI × intensité budgétaire · seuil d’exigence : {REGLAGES.consensusExigence} %
        de OUI · satisfaction du peuple : {pct(stats.satisfactionPeuple)}
      </p>
    </div>
  );
}

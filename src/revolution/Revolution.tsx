import { useMemo, useState } from 'react';
import { FournisseurRevolution, useRevolution } from './contexte';
import { exigences, statsGlobales } from './moteur';
import { ProviderNav, type Cible, type ValeurNav, type Vue } from './navigation';
import { duree, joursRestants, nombre } from './outils';
import { Badge, GrosBouton } from './ui';
import { Onboarding } from './composants/Onboarding';
import { ProposerSujet } from './composants/ProposerSujet';
import { Accueil } from './vues/Accueil';
import { Attente } from './vues/Attente';
import { FilDuPeuple } from './vues/FilDuPeuple';
import { Journal } from './vues/Journal';
import { Notifications } from './vues/Notifications';
import { Profil } from './vues/Profil';
import { RendezVous } from './vues/RendezVous';
import { Sections } from './vues/Sections';
import { VueSujet } from './vues/VueSujet';

const ONGLETS: { vue: Vue; emoji: string; label: string }[] = [
  { vue: 'accueil', emoji: '🏠', label: 'Accueil' },
  { vue: 'attente', emoji: '⚖️', label: 'En attente' },
  { vue: 'journal', emoji: '📜', label: 'Journal' },
  { vue: 'rendez-vous', emoji: '📅', label: 'Rendez-vous' },
  { vue: 'notifications', emoji: '🔔', label: 'Alertes' },
];

/** Le bandeau de cycle : le décompte de la prochaine Refonte. */
function BandeauCycle() {
  const { msRestants, dureeCycle, fraction, refondreMaintenant, etat, agir } = useRevolution();
  return (
    <div className="border-b border-bord bg-carte px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="affiche text-jaune text-sm sm:text-base">
          🔄 Prochaine refonte dans {duree(msRestants)}
        </p>
        <div className="flex items-center gap-2">
          <Badge ton="gris">Cycle n°{nombre(etat.cycles)}</Badge>
          <button
            type="button"
            onClick={() => agir({ type: 'cycle-accelere', actif: !etat.cycleAccelere })}
            className={`rounded-lg border px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${
              etat.cycleAccelere ? 'border-jaune bg-jaune text-black' : 'border-bord bg-carte2 text-gris'
            }`}
            title="Cycle accéléré : 60 secondes au lieu d'une heure (prototype)"
          >
            ⏩ {etat.cycleAccelere ? 'Accéléré (60 s)' : 'Cycle normal (1 h)'}
          </button>
          <button
            type="button"
            onClick={refondreMaintenant}
            className="rounded-lg border border-bord bg-carte2 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-gris"
            title="Déclencher la Refonte tout de suite (démonstration)"
          >
            ▶︎ Refondre maintenant
          </button>
        </div>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bord">
        <div className="h-full bg-jaune" style={{ width: `${fraction * 100}%` }} />
      </div>
      <p className="mt-1 text-[11px] text-gris">
        {dureeCycle === 60_000
          ? 'Cycle accéléré pour la démonstration : chaque minute, les votes sont agrégés et les priorités reclassées.'
          : 'Chaque heure, les votes sont agrégés, les priorités reclassées et le journal publié.'}
      </p>
    </div>
  );
}

/** « Combien sommes-nous ? » — le premier chiffre de l'écran. */
function CompteurCitoyens() {
  const { etat, maintenant } = useRevolution();
  const stats = useMemo(() => statsGlobales(etat), [etat]);
  const actifs = stats.citoyensActifs + Math.floor((maintenant % 3600000) / 9000);
  return (
    <div className="rounded-2xl border border-bord bg-carte px-4 py-3 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gris">Combien sommes-nous ?</p>
      <p key={actifs} className="monte affiche text-3xl text-jaune sm:text-5xl">
        {nombre(actifs)}
      </p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-gris">
        citoyens actifs · {nombre(stats.votesTotaux)} votes exprimés
      </p>
    </div>
  );
}

function Application() {
  const { etat } = useRevolution();
  const [vue, setVue] = useState<Vue>('accueil');
  const [sujetId, setSujetId] = useState<string | null>(null);
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [perimetre, setPerimetre] = useState<string>(etat.citoyen?.region ?? 'occitanie');
  const [identiteDemandee, setIdentiteDemandee] = useState(false);
  const [raisonIdentite, setRaisonIdentite] = useState<string | undefined>(undefined);
  const [proposeOuvert, setProposeOuvert] = useState(false);

  const listeExigences = exigences(etat);
  const nonLues = etat.notifications.filter((n) => !n.lu);
  const rdvAujourdhui = etat.rendezVous.find((rdv) => rdv.statut === 'officiel' && joursRestants(rdv.date) === 0);

  const nav: ValeurNav = {
    vue,
    sujetId,
    questionId,
    perimetre,
    setPerimetre,
    aller: (cible: Cible) => {
      if (cible.sujetId) setSujetId(cible.sujetId);
      setQuestionId(cible.questionId ?? null);
      setVue(cible.vue);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    demanderIdentite: (raison?: string) => {
      setRaisonIdentite(raison);
      setIdentiteDemandee(true);
    },
  };

  return (
    <ProviderNav valeur={nav}>
      <div className="min-h-screen bg-fond pb-32 text-texte">
        {/* ------------------------------- L'en-tête ------------------------------ */}
        <header className="border-b-4 border-b-jaune px-4 pt-5 pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="affiche text-3xl text-texte sm:text-5xl">
                À force de tirer sur le fil du peuple,
                <span className="block text-jaune">il casse.</span>
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gris">
                La démocratie continue : on propose, on vote, on priorise. Le résultat devient la position du peuple
                avant chaque rendez-vous avec l’État.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => nav.aller({ vue: 'notifications' })}
                className="relative rounded-xl border border-bord bg-carte px-3 py-2 text-xl"
                title="Centre de notifications"
              >
                🔔
                {nonLues.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 rounded-full bg-rouge px-1.5 py-0.5 text-[10px] font-black text-white">
                    {nonLues.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => nav.aller({ vue: 'profil' })}
                className="rounded-xl border border-bord bg-carte px-3 py-2 text-left"
                title="Profil et réglages"
              >
                <span className="block text-[11px] font-bold uppercase tracking-wide text-gris">Citoyen</span>
                <span className="affiche text-sm text-texte">
                  {etat.citoyen ? etat.citoyen.pseudo : 'S’identifier'}
                </span>
                {etat.citoyen && (
                  <span className="mt-1 block">
                    <Badge ton={etat.citoyen.badge === 'verifie' ? 'rouge' : etat.citoyen.badge === 'jeune' ? 'vert' : 'jaune'}>
                      {etat.citoyen.badge === 'verifie'
                        ? '✔ Citoyen vérifié'
                        : etat.citoyen.badge === 'jeune'
                          ? '🌱 Jeune citoyen'
                          : 'Citoyen'}
                    </Badge>
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <CompteurCitoyens />
            <div className="flex flex-wrap gap-2">
              <GrosBouton variante="neutre" onClick={() => nav.aller({ vue: 'sections' })}>
                🏛️ Sections
              </GrosBouton>
              <GrosBouton variante="neutre" onClick={() => nav.aller({ vue: 'fil' })}>
                🗺️ Le fil du peuple
              </GrosBouton>
            </div>
          </div>
        </header>

        {rdvAujourdhui && (
          <div className="clignote border-b border-jaune bg-jaune px-4 py-3 text-center">
            <p className="affiche text-black text-base sm:text-lg">
              📅 Rendezvous AUJOURD’HUI — le cahier est verrouillé à 18 h
            </p>
          </div>
        )}

        <BandeauCycle />

        {/* ------------------------------- Le contenu ----------------------------- */}
        <main className="px-4 py-5">
          {vue === 'accueil' && <Accueil />}
          {vue === 'sujet' && <VueSujet />}
          {vue === 'journal' && <Journal />}
          {vue === 'rendez-vous' && <RendezVous />}
          {vue === 'attente' && <Attente />}
          {vue === 'notifications' && <Notifications />}
          {vue === 'sections' && <Sections />}
          {vue === 'fil' && <FilDuPeuple />}
          {vue === 'profil' && <Profil />}
        </main>

        {/* ------------------------- Bouton flottant (proposer) ------------------- */}
        {(vue === 'accueil' || vue === 'attente') && (
          <button
            type="button"
            onClick={() => setProposeOuvert(true)}
            className="affiche fixed right-4 bottom-24 z-30 rounded-2xl bg-jaune px-5 py-4 text-sm text-black shadow-lg shadow-black/40 sm:text-base"
          >
            + Proposer un sujet
          </button>
        )}

        {/* ---------------------------- Barre de navigation ----------------------- */}
        <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-bord bg-carte/95 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-stretch justify-between px-1 py-1">
            {ONGLETS.map((onglet) => {
              const actif = vue === onglet.vue;
              const pastille =
                onglet.vue === 'notifications'
                  ? nonLues.length
                  : onglet.vue === 'attente'
                    ? etat.sujets.filter((s) => s.statut === 'en-attente').length
                    : onglet.vue === 'rendez-vous'
                      ? listeExigences.length
                      : 0;
              return (
                <button
                  key={onglet.vue}
                  type="button"
                  onClick={() => nav.aller({ vue: onglet.vue })}
                  className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-bold uppercase tracking-wide ${
                    actif ? 'bg-carte2 text-jaune' : 'text-gris'
                  }`}
                >
                  <span className="text-lg">{onglet.emoji}</span>
                  {onglet.label}
                  {pastille > 0 && (
                    <span className="absolute top-1 right-2 rounded-full bg-rouge px-1 text-[9px] font-black text-white">
                      {pastille}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {proposeOuvert && <ProposerSujet onFermer={() => setProposeOuvert(false)} />}
        {identiteDemandee && (
          <Onboarding raison={raisonIdentite} onFermer={() => setIdentiteDemandee(false)} />
        )}
      </div>
    </ProviderNav>
  );
}

/** Révolution : la base commune + toute l'application. */
export function Revolution() {
  return (
    <FournisseurRevolution>
      <Application />
    </FournisseurRevolution>
  );
}

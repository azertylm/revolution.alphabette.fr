import { useEffect, useState } from 'react';
import { FournisseurRevolution, useRevolution } from './contexte';
import { exigences } from './moteur';
import { ProviderNav, type Cible, type ValeurNav, type Vue } from './navigation';
import { REGLAGES } from './reglages';
import { duree, joursRestants } from './outils';
import { Badge } from './ui';
import { MinuteDuJour } from './composants/MinuteDuJour';
import { Onboarding } from './composants/Onboarding';
import { ProposerSujet } from './composants/ProposerSujet';
import { Accueil } from './vues/Accueil';
import { Assemblee } from './vues/Assemblee';
import { Attente } from './vues/Attente';
import { Dictionnaire } from './vues/Dictionnaire';
import { FilDuPeuple } from './vues/FilDuPeuple';
import { Journal } from './vues/Journal';
import { LivrePublic } from './vues/LivrePublic';
import { NotreContrat } from './vues/NotreContrat';
import { Notifications } from './vues/Notifications';
import { Profil } from './vues/Profil';
import { RendezVous } from './vues/RendezVous';
import { Sections } from './vues/Sections';
import { VueSujet } from './vues/VueSujet';

/* ==========================================================================
   LE CADRE DE L'APPLICATION — bandeau de Refonte, barre du bas, gros boutons.
   Mobile d'abord : tout est calé pour le pouce, puis élargi sur tablette.
   ========================================================================== */

const ONGLETS: { vue: Vue; emoji: string; label: string }[] = [
  { vue: 'accueil', emoji: '✊', label: 'Voter' },
  { vue: 'attente', emoji: '⚖️', label: 'Juger' },
  { vue: 'assemblee', emoji: '🏛️', label: 'Assemblée' },
  { vue: 'journal', emoji: '📜', label: 'Journal' },
  { vue: 'rendez-vous', emoji: '📅', label: 'Rendez-vous' },
  { vue: 'notifications', emoji: '🔔', label: 'Alertes' },
];

function BandeauCycle() {
  const { msRestants, fraction, refondreMaintenant, etat, agir } = useRevolution();
  return (
    <div className="border-b-[3px] border-bord bg-carte">
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-2 px-3 py-2 lg:max-w-5xl">
        <p className="affiche text-sm text-jaune sm:text-base">
          🔄 Refonte dans <span className="text-texte">{duree(msRestants)}</span>
        </p>
        <div className="flex items-center gap-1.5">
          <Badge ton="gris">Cycle {etat.cycles}</Badge>
          <button
            type="button"
            onClick={() => agir({ type: 'cycle-accelere', actif: !etat.cycleAccelere })}
            className={`affiche rounded-lg border-[3px] px-2.5 py-1.5 text-[10px] ${
              etat.cycleAccelere ? 'border-jaune bg-jaune text-black' : 'border-bord bg-carte2 text-gris'
            }`}
            title="Cycle accéléré : 60 secondes au lieu d’une heure (démonstration)"
          >
            ⏩ {etat.cycleAccelere ? '60 s' : '1 h'}
          </button>
          <button
            type="button"
            onClick={refondreMaintenant}
            className="affiche rounded-lg border-[3px] border-bord bg-carte2 px-2.5 py-1.5 text-[10px] text-gris"
            title="Déclencher la Refonte tout de suite"
          >
            ▶︎ Refondre
          </button>
        </div>
      </div>
      <div className="h-2 w-full bg-bord">
        <div className="h-full bg-jaune" style={{ width: `${fraction * 100}%` }} />
      </div>
      <p className="mx-auto w-full max-w-3xl px-3 py-1 text-[10px] text-gris lg:max-w-5xl">
        {etat.cycleAccelere
          ? 'Mode démonstration : chaque minute, les votes sont agrégés et les priorités reclassées.'
          : 'Chaque heure, les votes sont agrégés, les priorités reclassées et le journal publié.'}
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

  // Accessibilité (prompt 9) : « texte agrandi » grossit toute l'interface.
  useEffect(() => {
    document.documentElement.classList.toggle('texte-agrandi', etat.accessibilite.texteAgrandi);
  }, [etat.accessibilite.texteAgrandi]);

  const listeExigences = exigences(etat);
  const nonLues = etat.notifications.filter((n) => !n.lu);
  const enAttente = etat.sujets.filter((s) => s.statut === 'en-attente').length;
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

  const pastille = (v: Vue): number =>
    v === 'notifications' ? nonLues.length : v === 'attente' ? enAttente : v === 'rendez-vous' ? listeExigences.length : 0;

  return (
    <ProviderNav valeur={nav}>
      <div className="min-h-screen bg-fond pb-32 text-texte">
        {/* ================================ L'AFFICHE ============================== */}
        <header className="relative overflow-hidden border-b-[3px] border-bord bg-fond">
          <div className="flex h-2 w-full">
            <div className="h-full w-2/3 bg-jaune" />
            <div className="h-full w-1/3 bg-rouge" />
          </div>

          <div className="mx-auto w-full max-w-3xl px-3 py-4 lg:max-w-5xl">
            {/* L'affiche : le slogan respire sur toute la largeur, même sur un petit téléphone. */}
            <h1 className="affiche-large text-[clamp(1.65rem,7.2vw,3.6rem)] text-texte [text-wrap:balance]">
              À force de tirer sur le fil du peuple,{' '}
              <span className="mt-1 inline-block bg-jaune px-2 py-1 text-black">il casse.</span>
            </h1>

            {/* La rangée des raccourcis : mon compte à gauche, la cloche et les lieux à droite. */}
            <div className="mt-3 flex items-stretch gap-2">
              <button
                type="button"
                onClick={() => nav.aller({ vue: 'profil' })}
                className="flex min-h-[3.25rem] min-w-0 flex-1 items-center justify-between gap-2 rounded-xl border-[3px] border-bord bg-carte px-3 py-2 text-left"
              >
                <span className="affiche truncate text-sm text-texte">
                  {etat.citoyen ? `👤 ${etat.citoyen.pseudo}` : '👤 Je suis le peuple — s’identifier'}
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  {etat.citoyen ? (
                    <Badge
                      ton={etat.citoyen.badge === 'verifie' ? 'rouge' : etat.citoyen.badge === 'jeune' ? 'vert' : 'jaune'}
                    >
                      {etat.citoyen.badge === 'verifie' ? '✔ vérifié' : etat.citoyen.badge === 'jeune' ? '🌱 jeune' : 'citoyen'}
                    </Badge>
                  ) : (
                    <Badge ton="jaune">15 s</Badge>
                  )}
                  <span className="text-gris">→</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => nav.aller({ vue: 'notifications' })}
                className="relative flex min-h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-xl border-[3px] border-bord bg-carte text-2xl"
                title="Centre de notifications"
              >
                🔔
                {nonLues.length > 0 && (
                  <span className="absolute -top-2 -right-2 rounded-full bg-rouge px-1.5 py-0.5 text-[11px] font-black text-white">
                    {nonLues.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => nav.aller({ vue: 'assemblee' })}
                className="flex min-h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-xl border-[3px] border-bord bg-carte text-2xl"
                title="L'Assemblée du peuple — sections locales et administrateurs élus"
              >
                🏛️
              </button>
              <button
                type="button"
                onClick={() => nav.aller({ vue: 'fil' })}
                className="flex min-h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-xl border-[3px] border-bord bg-carte text-2xl"
                title="Le fil du peuple — carte de France"
              >
                🗺️
              </button>
              <button
                type="button"
                onClick={() => nav.aller({ vue: 'livre' })}
                className={`flex min-h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-xl border-[3px] text-2xl ${
                  vue === 'livre' ? 'border-jaune bg-jaune' : 'border-bord bg-carte'
                }`}
                title="Le livre public — tout ce qui se passe, vérifiable par tous"
              >
                📖
              </button>
            </div>

            {/* La rangée des repères : le livre, le contrat, le dictionnaire. */}
            <div className="mt-2 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => nav.aller({ vue: 'livre' })}
                className={`affiche min-h-[3rem] rounded-xl border-[3px] px-2 py-2 text-[11px] leading-tight ${
                  vue === 'livre' ? 'border-jaune bg-jaune text-black' : 'border-bord bg-carte text-gris'
                }`}
              >
                📖 Livre public
                <span className="block text-[10px] opacity-80">vérifiable</span>
              </button>
              <button
                type="button"
                onClick={() => nav.aller({ vue: 'contrat' })}
                className={`affiche min-h-[3rem] rounded-xl border-[3px] px-2 py-2 text-[11px] leading-tight ${
                  vue === 'contrat' ? 'border-rouge bg-rouge text-white' : 'border-bord bg-carte text-gris'
                }`}
              >
                📜 Notre contrat
                <span className="block text-[10px] opacity-80">{etat.contrat.modifiees} modifiée(s)</span>
              </button>
              <button
                type="button"
                onClick={() => nav.aller({ vue: 'dictionnaire' })}
                className={`affiche min-h-[3rem] rounded-xl border-[3px] px-2 py-2 text-[11px] leading-tight ${
                  vue === 'dictionnaire' ? 'border-jaune bg-jaune text-black' : 'border-bord bg-carte text-gris'
                }`}
              >
                📚 Dictionnaire
                <span className="block text-[10px] opacity-80">jargon off</span>
              </button>
            </div>
          </div>
        </header>

        {/* ============================== JOUR J ==================================== */}
        {rdvAujourdhui && (
          <div className="clignote border-b-[3px] border-jaune bg-jaune px-3 py-3 text-center">
            <p className="affiche mx-auto max-w-3xl text-sm text-black sm:text-lg lg:max-w-5xl">
              📅 Rendez-vous AUJOURD’HUI — cahier verrouillé à {REGLAGES.verrouillageHeure} h :{' '}
              {listeExigences.length} exigences vont être présentées au nom du peuple
            </p>
          </div>
        )}

        <BandeauCycle />

        {/* ================================ LE CONTENU ============================= */}
        <main className="mx-auto w-full max-w-3xl px-3 py-4 lg:max-w-5xl">
          {vue === 'accueil' && <MinuteDuJour />}
          {vue === 'accueil' && <Accueil />}
          {vue === 'sujet' && <VueSujet />}
          {vue === 'journal' && <Journal />}
          {vue === 'rendez-vous' && <RendezVous />}
          {vue === 'attente' && <Attente />}
          {vue === 'notifications' && <Notifications />}
          {vue === 'assemblee' && <Assemblee />}
          {vue === 'sections' && <Sections />}
          {vue === 'fil' && <FilDuPeuple />}
          {vue === 'livre' && <LivrePublic />}
          {vue === 'contrat' && <NotreContrat />}
          {vue === 'dictionnaire' && <Dictionnaire />}
          {vue === 'profil' && <Profil />}
        </main>

        {/* ============================== PROPOSER UN SUJET ======================== */}
        {(vue === 'accueil' || vue === 'attente') && (
          <button
            type="button"
            onClick={() => setProposeOuvert(true)}
            className="affiche ombre-dure-jaune fixed right-3 bottom-[6.5rem] z-30 min-h-[3.5rem] rounded-2xl bg-jaune px-4 py-3 text-sm text-black sm:right-5"
          >
            ＋ Proposer un sujet
          </button>
        )}

        {/* ============================ LA BARRE DU BAS ============================ */}
        <nav className="fixed inset-x-0 bottom-0 z-20 border-t-[3px] border-bord bg-carte/95 backdrop-blur">
          <div className="barre-basse mx-auto flex w-full max-w-3xl items-stretch justify-between px-1 pt-1 lg:max-w-5xl">
            {ONGLETS.map((o) => {
              const actif = vue === o.vue;
              const n = pastille(o.vue);
              return (
                <button
                  key={o.vue}
                  type="button"
                  onClick={() => nav.aller({ vue: o.vue })}
                  className={`relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 ${
                    actif ? 'bg-carte2' : ''
                  }`}
                >
                  <span className={`text-2xl leading-none ${actif ? '' : 'opacity-60'}`}>{o.emoji}</span>
                  <span
                    className={`affiche w-full truncate text-center text-[10px] leading-none ${actif ? 'text-jaune' : 'text-gris'}`}
                  >
                    {o.label}
                  </span>
                  {actif && <span className="absolute inset-x-3 -top-1 h-1 rounded-full bg-jaune" />}
                  {n > 0 && (
                    <span className="absolute top-0 right-1 rounded-full bg-rouge px-1.5 text-[10px] font-black text-white">
                      {n}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {proposeOuvert && <ProposerSujet onFermer={() => setProposeOuvert(false)} />}
        {identiteDemandee && <Onboarding raison={raisonIdentite} onFermer={() => setIdentiteDemandee(false)} />}
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

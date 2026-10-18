import { REGLAGES } from './reglages';
import { REGIONS, regionDeTerritoire } from './regions';
import { nombre } from './outils';
import type { CandidatAdmin, Etat, EntreeJournal, Mandat, Notification, Section } from './types';

/* ==========================================================================
   L'ASSEMBLÉE DU PEUPLE — vingt administrateurs par région.

   Tout est automatique : le citoyen soutient des volontaires, et la machine
   fait le reste. À chaque Refonte :
     · les mandats arrivés à échéance libèrent leur siège ;
     · de nouveaux volontaires se présentent ;
     · les soutiens évoluent ;
     · les sièges libres sont installés AU FUR ET À MESURE (plafonnés par
       refonte : jamais d'élection massive, jamais de vide) ;
     · les sections locales s'ouvrent d'elles-mêmes dès que la demande monte ;
     · l'administrateur élu devient coordinateur de sa section.

   Les administrateurs ne peuvent RIEN changer aux votes, aux questions ni aux
   résultats : ils organisent, modèrent et transmettent le cahier.
   ========================================================================== */

/** Nombre de sièges à pourvoir dans chaque assemblée. */
export const SIEGES = REGLAGES.siegesParRegion;

export interface Assemblee {
  /** Identifiant de région, ou « national ». */
  id: string;
  nom: string;
}

/** L'Assemblée nationale + une assemblée par région. */
export const ASSEMBLEES: Assemblee[] = [
  { id: 'national', nom: 'France' },
  ...REGIONS.map((r) => ({ id: r.id, nom: r.nom })),
];

export function nomAssemblee(id: string): string {
  return ASSEMBLEES.find((a) => a.id === id)?.nom ?? 'France';
}

/** Prénoms utilisés pour fabriquer des volontaires anonymes. */
export const PRENOMS_VOLONTAIRES = [
  'Louise', 'Marceau', 'Nour', 'Idriss', 'Perrine', 'Gaspard', 'Assia', 'Titouan',
  'Jeanne', 'Karim', 'Elsa', 'Malo', 'Suzanne', 'Anselme', 'Rachida', 'Honoré',
  'Maëlle', 'Barnabé', 'Sidonie', 'Ousmane', 'Clémence', 'Aurélien', 'Fatou', 'Léo',
];

/** Candidatures en une phrase, aucun CV. */
export const PHRASES_CANDIDATURE = [
  'Je tiens le registre des réunions depuis un an, je continue.',
  'Disponible le soir et le week-end, je peux organiser les rendez-vous locaux.',
  'Je connais les services de la région et je sais à qui écrire.',
  'Aucun mandat avant, aucune dette envers personne : je commence par écouter.',
  'Je propose de tenir les comptes et de tout publier, ligne par ligne.',
  'Mon seul programme : que le cahier du peuple arrive sur le bon bureau.',
  'Je peux animer les réunions de quartier et faire remonter ce qui bloque.',
  'Retraitée de l’administration, je sais lire un budget et poser les bonnes questions.',
];

/** Un pseudo de volontaire, jamais deux fois le même. */
export function nouveauPseudo(existants: Set<string>): string {
  for (let essai = 0; essai < 40; essai++) {
    const prenom = PRENOMS_VOLONTAIRES[Math.floor(Math.random() * PRENOMS_VOLONTAIRES.length)];
    const numero = 10 + Math.floor(Math.random() * 89);
    const pseudo = `${prenom}_${numero}`;
    if (!existants.has(pseudo)) return pseudo;
  }
  return `Citoyen #${10000 + Math.floor(Math.random() * 89999)}`;
}

/** Région rattachée à une section (l'Assemblée nationale pour le reste). */
export function assembleeDeSection(section: Section): string {
  if (section.niveau === 'national') return 'national';
  return regionDeTerritoire(section.territoire) ?? 'national';
}

/** Sièges pourvus d'une assemblée. */
export function mandatsEnCours(etat: Etat, regionId: string): Mandat[] {
  return etat.mandats.filter((m) => m.regionId === regionId);
}

/** Sièges encore libres dans une assemblée. */
export function siegesLibres(etat: Etat, regionId: string): number {
  return Math.max(0, SIEGES - mandatsEnCours(etat, regionId).length);
}

/** Volontaires d'une assemblée, les mieux soutenus d'abord. */
export function classementCandidats(etat: Etat, regionId: string): CandidatAdmin[] {
  return etat.candidatsAdmin
    .filter((c) => c.regionId === regionId)
    .sort((a, b) => b.voix - a.voix || a.inscritLe.localeCompare(b.inscritLe));
}

/** Le volontaire le mieux placé qui n'a jamais siégé (les nouveaux d'abord). */
export function prochainElu(etat: Etat, regionId: string): CandidatAdmin | undefined {
  const liste = classementCandidats(etat, regionId).filter(
    (c) => c.voix >= REGLAGES.seuilEligibilite && !etat.mandats.some((m) => m.regionId === regionId && m.titulaire === c.pseudo),
  );
  return liste.find((c) => !c.dejaElu) ?? liste[0];
}

export interface BilanAssemblee {
  siegesTotal: number;
  siegesPourvus: number;
  assemblees: number;
  sectionsOuvertes: number;
  membres: number;
  volontaires: number;
}

/** Les grands chiffres de l'Assemblée (transparence, en tête de l'onglet). */
export function bilanAssemblee(etat: Etat): BilanAssemblee {
  return {
    siegesTotal: SIEGES * ASSEMBLEES.length,
    siegesPourvus: etat.mandats.length,
    assemblees: ASSEMBLEES.length,
    sectionsOuvertes: etat.sections.length,
    membres: etat.sections.reduce((total, s) => total + (s.membres ?? 0), 0),
    volontaires: etat.candidatsAdmin.length,
  };
}

/* -------------------------------------------------------------------------- */
/* Le moteur automatique, appelé à chaque Refonte                              */
/* -------------------------------------------------------------------------- */

export interface EffetsAssemblee {
  mandats: Mandat[];
  candidatsAdmin: CandidatAdmin[];
  sections: Section[];
  journal: EntreeJournal[];
  notifications: Notification[];
}

const entree = (iso: string, texte: string): EntreeJournal => ({
  id: `j-${Math.random().toString(36).slice(2, 9)}`,
  date: iso,
  type: 'assemblee',
  texte,
});

const idNotif = (cle: string) => `notif-${cle}`;

/** Ouvre une section neuve, rôles vacants, prête à accueillir les citoyens. */
export function ouvrirSection(a: Assemblee, iso: string): Section {
  return {
    id: `section-region-${a.id}`,
    niveau: a.id === 'national' ? 'national' : 'region',
    territoire: a.nom,
    citoyensActifs: 900 + Math.floor(Math.random() * 4200),
    membres: 0,
    ouverteLe: iso,
    roles: [
      { poste: 'coordinateur', titulaire: null, electionLe: iso },
      { poste: 'moderateur', titulaire: null, electionLe: iso },
      { poste: 'tresorier', titulaire: null, electionLe: iso },
    ],
    candidats: [],
  };
}

/**
 * Fait vivre l'Assemblée : échéances, candidatures, soutiens, installations de
 * sièges, ouverture automatique des sections. Fonction pure : l'état d'entrée
 * n'est jamais modifié.
 */
export function faireVivreAssemblee(etat: Etat, iso: string): EffetsAssemblee {
  const journal: EntreeJournal[] = [];
  const notifications: Notification[] = [];
  const maintenant = Date.parse(iso);
  const mesSoutiens = new Set(etat.soutiensAdmin);

  // 1. Les mandats arrivés à échéance libèrent leur siège.
  const mandats: Mandat[] = [];
  for (const m of etat.mandats) {
    if (Date.parse(m.fin) > maintenant) {
      mandats.push({ ...m });
      continue;
    }
    journal.push(
      entree(
        iso,
        `⏳ Le mandat de ${m.titulaire} s'achève à ${nomAssemblee(m.regionId)} : son siège repart au vote. Six mois, pas un jour de plus.`,
      ),
    );
  }

  // 2. De nouveaux volontaires se présentent, dans une région tirée au sort.
  const candidatsAdmin = etat.candidatsAdmin.map((c) => ({ ...c }));
  const dejaLa = new Set(candidatsAdmin.map((c) => c.pseudo));
  const nouvelles = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < nouvelles; i++) {
    const a = ASSEMBLEES[Math.floor(Math.random() * ASSEMBLEES.length)];
    const pseudo = nouveauPseudo(dejaLa);
    dejaLa.add(pseudo);
    candidatsAdmin.push({
      id: `admin-${Date.now().toString(36)}-${i}`,
      regionId: a.id,
      territoire: a.nom,
      pseudo,
      phrase: PHRASES_CANDIDATURE[Math.floor(Math.random() * PHRASES_CANDIDATURE.length)],
      voix: Math.floor(Math.random() * 3),
      reserves: 0,
      inscritLe: iso,
      dejaElu: false,
    });
  }

  // 3. Les soutiens évoluent : la campagne ne s'arrête jamais.
  for (const c of candidatsAdmin) {
    c.voix += Math.round(Math.random() * 3);
    if (Math.random() < 0.18) c.reserves += 1;
  }

  // 4. Les sections : adhésions qui montent, et ouverture automatique dès que
  //    la demande dépasse le seuil.
  const sections = etat.sections.map((s) => ({ ...s, membres: s.membres ?? 0 }));
  for (let i = 0; i < REGLAGES.adhesionsParRefonte && sections.length; i++) {
    const s = sections[Math.floor(Math.random() * sections.length)];
    s.membres += 1 + Math.floor(Math.random() * 3);
  }
  for (const a of ASSEMBLEES) {
    if (sections.some((s) => s.territoire === a.nom)) continue;
    const demandes = candidatsAdmin.filter((c) => c.regionId === a.id).length;
    if (demandes < REGLAGES.demandesPourOuvrir) continue;
    sections.push(ouvrirSection(a, iso));
    journal.push(
      entree(
        iso,
        `🏛️ La section de ${a.nom} s'ouvre d'elle-même : ${demandes} volontaires s'étaient déjà manifestés pour l'animer.`,
      ),
    );
    notifications.push({
      id: idNotif(`section-${a.id}`),
      date: iso,
      type: 'mobilisation',
      titre: `🏛️ Une section s'ouvre près de chez toi`,
      texte: `${a.nom} a réuni assez de volontaires : la section locale est ouverte, les rôles sont à pourvoir.`,
      urgent: false,
      lu: false,
      cible: { vue: 'assemblee' },
    });
  }

  // 5. Installation des sièges, au fur et à mesure : on sert d'abord les
  //    assemblées les plus incomplètes, et jamais plus que le plafond par
  //    refonte. Les élus prennent aussi la coordination de leur section.
  const regionDuCitoyen = etat.citoyen?.region ?? 'national';
  const ordre = [...ASSEMBLEES].sort((a, b) => {
    const pourvusA = mandats.filter((m) => m.regionId === a.id).length;
    const pourvusB = mandats.filter((m) => m.regionId === b.id).length;
    if (pourvusA !== pourvusB) return pourvusA - pourvusB;
    if (a.id === regionDuCitoyen) return -1;
    if (b.id === regionDuCitoyen) return 1;
    return a.nom.localeCompare(b.nom);
  });

  let restants = REGLAGES.installationsParRefonte;
  for (const a of ordre) {
    if (restants <= 0) break;
    if (siegesLibres({ ...etat, mandats }, a.id) <= 0) continue;
    const dejaTitulaires = new Set(mandats.filter((m) => m.regionId === a.id).map((m) => m.titulaire));
    const eligibles = classementCandidats({ ...etat, candidatsAdmin }, a.id).filter(
      (c) => c.voix >= REGLAGES.seuilEligibilite && !dejaTitulaires.has(c.pseudo),
    );
    for (const c of eligibles) {
      if (restants <= 0) break;
      if (siegesLibres({ ...etat, mandats }, a.id) <= 0) break;
      const voixElection = c.voix;
      mandats.push({
        id: `mandat-${a.id}-${c.id}`,
        regionId: a.id,
        territoire: a.nom,
        titulaire: c.pseudo,
        debut: iso,
        fin: new Date(maintenant + REGLAGES.mandatMs).toISOString(),
        voix: voixElection,
      });
      const suivant = candidatsAdmin.find((x) => x.id === c.id);
      if (suivant) {
        suivant.dejaElu = true;
        suivant.voix = 0; // le mandat remet les compteurs à zéro : personne n'est propriétaire d'un siège
      }
      journal.push(
        entree(
          iso,
          `✊ ${c.pseudo} est élu(e) administrateur/administratrice de ${a.nom} avec ${nombre(voixElection)} soutien(s). Mandat de 6 mois, révocable par la section.`,
        ),
      );
      if (mesSoutiens.has(c.id)) {
        notifications.push({
          id: idNotif(`elu-${c.id}-${iso.slice(0, 13)}`),
          date: iso,
          type: 'mobilisation',
          titre: '✊ Ton candidat est élu',
          texte: `${c.pseudo} siège désormais à l'Assemblée de ${a.nom}. Tu peux suivre ses mandats dans l'Assemblée.`,
          urgent: true,
          lu: false,
          cible: { vue: 'assemblee' },
        });
      }
      // L'élu prend la coordination de sa section si le poste est vacant.
      const section = sections.find((s) => s.territoire === a.nom);
      if (section) {
        const poste = section.roles.find((r) => r.poste === 'coordinateur');
        if (poste && !poste.titulaire) {
          poste.titulaire = c.pseudo;
          poste.electionLe = iso;
        }
      }
      restants -= 1;
    }
  }

  return { mandats, candidatsAdmin, sections, journal, notifications };
}

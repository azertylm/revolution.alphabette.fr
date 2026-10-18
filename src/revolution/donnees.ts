import type { ModeleQuestion } from './categories';
import type {
  Candidat,
  EntreeJournal,
  Etat,
  MessageSection,
  Notification,
  Question,
  RendezVous,
  Section,
  Sujet,
} from './types';
import { categorie } from './categories';
import { jourISO } from './outils';

/* ==========================================================================
   Les données simulées du prototype.
   Elles jouent le rôle du backend : à chaque refonte, elles évoluent comme si
   des milliers de citoyens venaient de voter.
   ========================================================================== */

interface Graine {
  id: string;
  emoji: string;
  nom: string;
  probleme: string;
  categorie: Sujet['categorie'];
  niveau: Sujet['niveau'];
  territoire: string;
  votants: number;
  auteur: string;
  regionsSoutenantes?: string[];
  propositionNationale?: boolean;
  statut?: Sujet['statut'];
  validations?: number;
  rejets?: number;
  messages?: MessageSection[];
  questions: {
    texte: string;
    poste: string;
    oui: number;
    non: number;
    sansAvis: number;
    budget: number;
    etat?: Question['etat'];
    statut?: Question['statut'];
    reponse?: Question['reponse'];
    satisfaction?: Question['satisfaction'];
  }[];
}

let compteur = 0;
const cle = () => `id-${(compteur += 1)}`;

function question(sujetId: string, index: number, g: Graine['questions'][number]): Question {
  const total = g.oui + g.non + g.sansAvis;
  return {
    id: `${sujetId}-q${index + 1}`,
    texte: g.texte,
    poste: g.poste,
    oui: g.oui,
    non: g.non,
    sansAvis: g.sansAvis,
    verifies: Math.round(total * 0.62),
    archives: Math.round(total * 0.004),
    etat: g.etat ?? 'ouverte',
    budgetMoyen: g.budget,
    statut: g.statut,
    reponse: g.reponse,
    satisfaction: g.satisfaction,
    depuis: g.etat === 'exigence' ? new Date(Date.now() - 3 * 86400000).toISOString() : undefined,
  };
}

function creerSujet(g: Graine, creeLe: string): Sujet {
  const modele = categorie(g.categorie);
  const sujetId = g.id;
  return {
    id: sujetId,
    emoji: g.emoji,
    nom: g.nom,
    probleme: g.probleme,
    categorie: g.categorie,
    niveau: g.niveau,
    territoire: g.territoire,
    statut: g.statut ?? 'officiel',
    validations: g.validations ?? 0,
    rejets: g.rejets ?? 0,
    votants: g.votants,
    verifies: Math.round(g.votants * 0.62),
    archives: Math.round(g.votants * 0.004),
    questions: g.questions.map((q, i) => question(sujetId, i, q)),
    secours: [...modele.secours] as ModeleQuestion[],
    budgetVotants: Math.round(g.votants * 0.34),
    creeLe,
    auteur: g.auteur,
    messages: g.messages ?? [],
    signalements: [],
    regionsSoutenantes: g.regionsSoutenantes ?? [],
    propositionNationale: g.propositionNationale,
  };
}

const ilYA = (jours: number, heures = 0) =>
  new Date(Date.now() - jours * 86400000 - heures * 3600000).toISOString();

const msg = (pseudo: string, texte: string, jours: number, badge: MessageSection['badge'] = 'citoyen'): MessageSection => ({
  id: cle(),
  pseudo,
  badge,
  texte,
  date: ilYA(jours),
});

/* -------------------------------------------------------------------------- */
/* Les sujets                                                                  */
/* -------------------------------------------------------------------------- */

const GRAINES: Graine[] = [
  {
    id: 'toilettes-lycees',
    emoji: '🚽',
    nom: 'Toilettes des lycées',
    probleme: 'Dans quasiment tous les lycées de France, les toilettes sont sales et vétustes.',
    categorie: 'education',
    niveau: 'region',
    territoire: 'Occitanie',
    votants: 12480,
    auteur: 'Citoyen #48231',
    regionsSoutenantes: ['occitanie', 'bretagne', 'hauts-de-france', 'auvergne-rhone-alpes'],
    messages: [
      msg('Camille_31', 'Chez nous, deux blocs sur trois sont condamnés depuis la rentrée. On demande juste un état des lieux honnête.', 1, 'verifie'),
      msg('Citoyen #91244', 'Les agents d’entretien ne sont pas assez nombreux : le contrôle extérieur doit aussi vérifier les effectifs.', 2),
      msg('Sofia_B', 'Le budget au gabarit, c’est la vraie mesure : notre lycée a 1 200 élèves et 4 toilettes ouvertes.', 3, 'verifie'),
    ],
    questions: [
      { texte: 'Voulez-vous un contrôle extérieur aléatoire des toilettes dans les lycées de ta région ?', poste: 'Contrôles extérieurs', oui: 8920, non: 1180, sansAvis: 640, budget: 34, etat: 'exigence' },
      { texte: "Voulez-vous qu'un budget soit alloué selon le gabarit et le nombre d'élèves de chaque lycée ?", poste: 'Budget au gabarit', oui: 10410, non: 620, sansAvis: 380, budget: 41, etat: 'exigence', statut: 'presentee' },
      { texte: 'Voulez-vous que les résultats des contrôles soient rendus publics chaque trimestre ?', poste: 'Publicité des résultats', oui: 9880, non: 540, sansAvis: 720, budget: 18 },
      { texte: 'Voulez-vous un référendum local sur ce sujet ?', poste: 'Référendum local', oui: 5320, non: 4310, sansAvis: 940, budget: 7 },
      { texte: 'Voulez-vous que les défaillances des responsables soient sanctionnées ?', poste: 'Sanctions', oui: 6110, non: 2980, sansAvis: 1120, budget: 0 },
    ],
  },
  {
    id: 'pouvoir-achat',
    emoji: '💶',
    nom: "Pouvoir d'achat",
    probleme: "Les prix de l'alimentation et de l'énergie augmentent plus vite que les salaires.",
    categorie: 'economie',
    niveau: 'national',
    territoire: 'France',
    votants: 15902,
    auteur: 'Citoyen #10432',
    questions: [
      { texte: 'Voulez-vous un plafonnement des prix des biens de première nécessité ?', poste: 'Plafonnement', oui: 11240, non: 2980, sansAvis: 1680, budget: 38, etat: 'exigence', statut: 'en-reponse', reponse: 'etude', satisfaction: { satisfait: 1420, pasSatisfait: 3980 } },
      { texte: 'Voulez-vous que les marges des grands distributeurs soient rendues publiques ?', poste: 'Transparence des marges', oui: 10880, non: 2140, sansAvis: 2880, budget: 22, etat: 'exigence', statut: 'a-presenter' },
      { texte: 'Voulez-vous un contrôle citoyen annuel des aides publiques versées aux entreprises ?', poste: 'Contrôle des aides', oui: 8410, non: 3210, sansAvis: 4280, budget: 19 },
      { texte: 'Voulez-vous un référendum avant toute hausse d’impôt ou de taxe ?', poste: 'Référendum fiscal', oui: 10210, non: 4020, sansAvis: 1670, budget: 12, etat: 'exigence', statut: 'presentee' },
      { texte: 'Voulez-vous que les fraudeurs soient sanctionnés à la hauteur du préjudice causé ?', poste: 'Sanctions', oui: 9140, non: 1840, sansAvis: 4920, budget: 9 },
    ],
  },
  {
    id: 'hopital-public',
    emoji: '🏥',
    nom: 'Hôpital public',
    probleme: 'Les urgences ferment la nuit et les soins de proximité disparaissent dans nos territoires.',
    categorie: 'sante',
    niveau: 'departement',
    territoire: 'Haute-Garonne',
    votants: 9310,
    auteur: 'Citoyen #77310',
    messages: [
      msg('Dr_Martin', 'Le problème n’est pas le personnel, c’est l’organisation. Un contrôle trimestriel le montrerait en trois mois.', 1, 'verifie'),
    ],
    questions: [
      { texte: 'Voulez-vous que les soins urgents soient garantis à moins de 30 minutes de chaque domicile ?', poste: 'Accès aux urgences', oui: 7610, non: 890, sansAvis: 810, budget: 44, etat: 'exigence', statut: 'presentee' },
      { texte: "Voulez-vous que l'hôpital public soit prioritaire dans le budget national ?", poste: 'Budget hospitalier', oui: 7120, non: 1240, sansAvis: 950, budget: 31, etat: 'exigence' },
      { texte: 'Voulez-vous un contrôle citoyen trimestriel des services de santé de votre territoire ?', poste: 'Contrôle citoyen', oui: 6320, non: 1890, sansAvis: 1100, budget: 14 },
      { texte: "Voulez-vous un référendum local avant toute fermeture d'un service de santé public ?", poste: 'Référendum local', oui: 6890, non: 1420, sansAvis: 1000, budget: 11 },
      { texte: "Voulez-vous que les postes vacants soient pourvus avant tout recours à l'intérim ?", poste: 'Postes et intérim', oui: 4210, non: 3120, sansAvis: 1980, budget: 0 },
    ],
  },
  {
    id: 'justice-delais',
    emoji: '⚖️',
    nom: 'Justice — délais et lisibilité',
    probleme: 'Les affaires mettent des années à être jugées et les décisions restent illisibles pour les citoyens.',
    categorie: 'justice',
    niveau: 'national',
    territoire: 'France',
    votants: 6204,
    auteur: 'Citoyen #20871',
    questions: [
      { texte: 'Voulez-vous que les délais de jugement soient plafonnés et publiés ?', poste: 'Délais de jugement', oui: 4980, non: 620, sansAvis: 604, budget: 36, etat: 'exigence' },
      { texte: 'Voulez-vous un tirage au sort de citoyens pour contrôler les affaires sensibles ?', poste: 'Jury citoyen', oui: 3910, non: 1620, sansAvis: 674, budget: 24 },
      { texte: 'Voulez-vous que toutes les décisions de justice soient publiques et lisibles par tous ?', poste: 'Publicité des décisions', oui: 5120, non: 540, sansAvis: 544, budget: 27, etat: 'exigence' },
      { texte: "Voulez-vous un référendum sur l'indépendance de la justice ?", poste: 'Référendum', oui: 3410, non: 2120, sansAvis: 674, budget: 13 },
      { texte: 'Voulez-vous que les manquements des magistrats soient sanctionnés ?', poste: 'Sanctions', oui: 2980, non: 2410, sansAvis: 814, budget: 0 },
    ],
  },
  {
    id: 'transports-regionaux',
    emoji: '🚌',
    nom: 'Transports du quotidien',
    probleme: 'Les trains régionaux sont supprimés et les bus ne passent plus le soir en zone rurale.',
    categorie: 'transports',
    niveau: 'region',
    territoire: 'Bretagne',
    votants: 5112,
    auteur: 'Citoyen #60122',
    messages: [msg('Yann_29', 'Une ligne supprimée = un village isolé. On veut un vote avant, pas après.', 2)],
    questions: [
      { texte: 'Voulez-vous une fréquence minimale garantie sur les lignes de votre région ?', poste: 'Fréquence garantie', oui: 3980, non: 640, sansAvis: 492, budget: 33, etat: 'exigence' },
      { texte: 'Voulez-vous que les tarifs soient uniques et identiques sur tout le territoire ?', poste: 'Tarif unique', oui: 3410, non: 1120, sansAvis: 582, budget: 22 },
      { texte: 'Voulez-vous un contrôle citoyen trimestriel de la ponctualité ?', poste: 'Contrôle citoyen', oui: 3120, non: 980, sansAvis: 1012, budget: 18 },
      { texte: 'Voulez-vous un référendum local avant toute suppression de ligne ?', poste: 'Référendum local', oui: 4290, non: 480, sansAvis: 342, budget: 21, etat: 'exigence' },
      { texte: 'Voulez-vous que les opérateurs défaillants perdent leur contrat ?', poste: 'Sanctions des opérateurs', oui: 2140, non: 1980, sansAvis: 992, budget: 6 },
    ],
  },
  {
    id: 'eau-robinet',
    emoji: '🌍',
    nom: "Eau du robinet et pesticides",
    probleme: "L'eau du robinet est polluée par les pesticides dans de nombreuses communes rurales.",
    categorie: 'environnement',
    niveau: 'commune',
    territoire: 'Toulouse',
    votants: 3410,
    auteur: 'Citoyen #33127',
    messages: [msg('Aline_V', 'Les résultats d’analyses sont publiés en mairie… en tout petit. On veut des tests publics mensuels.', 1, 'verifie')],
    questions: [
      { texte: 'Voulez-vous un contrôle indépendant et aléatoire des rejets industriels ?', poste: 'Contrôles des rejets', oui: 2410, non: 410, sansAvis: 590, budget: 32, etat: 'exigence' },
      { texte: 'Voulez-vous que le budget écologique soit sanctuarisé et non réaffectable ?', poste: 'Budget sanctuarisé', oui: 2210, non: 620, sansAvis: 580, budget: 26 },
      { texte: 'Voulez-vous que les résultats des contrôles soient publics chaque trimestre ?', poste: 'Publicité des résultats', oui: 2680, non: 240, sansAvis: 490, budget: 24, etat: 'exigence' },
      { texte: 'Voulez-vous un référendum local avant tout projet industriel polluant ?', poste: 'Référendum local', oui: 2510, non: 380, sansAvis: 520, budget: 18 },
      { texte: 'Voulez-vous que les pollueurs paient la totalité de la dépollution ?', poste: 'Réparation du préjudice', oui: 1920, non: 780, sansAvis: 710, budget: 0 },
    ],
  },
  /* --- File de modération --- */
  {
    id: 'cantine-qualite',
    emoji: '🍽️',
    nom: 'Cantines scolaires — qualité et prix',
    probleme: 'Les cantines servent des repas industriels de mauvaise qualité alors que le prix augmente chaque année.',
    categorie: 'education',
    niveau: 'commune',
    territoire: 'Toulouse',
    votants: 0,
    auteur: 'Citoyen #74002',
    statut: 'en-attente',
    validations: 7,
    rejets: 1,
    questions: [
      { texte: 'Voulez-vous un contrôle extérieur aléatoire des cuisines centrales ?', poste: 'Contrôles', oui: 0, non: 0, sansAvis: 0, budget: 0 },
      { texte: 'Voulez-vous qu’un budget soit alloué selon le nombre de repas servis ?', poste: 'Budget au gabarit', oui: 0, non: 0, sansAvis: 0, budget: 0 },
      { texte: 'Voulez-vous que les menus et les fournisseurs soient publiés chaque trimestre ?', poste: 'Publicité', oui: 0, non: 0, sansAvis: 0, budget: 0 },
      { texte: 'Voulez-vous un référendum local sur le prix des repas ?', poste: 'Référendum', oui: 0, non: 0, sansAvis: 0, budget: 0 },
      { texte: 'Voulez-vous que les défaillances des fournisseurs soient sanctionnées ?', poste: 'Sanctions', oui: 0, non: 0, sansAvis: 0, budget: 0 },
    ],
  },
  {
    id: 'eclairage-public',
    emoji: '🔒',
    nom: 'Éclairage public et sécurité',
    probleme: 'Les rues sont éteintes la nuit depuis un an et les habitants ne se sentent plus en sécurité.',
    categorie: 'securite',
    niveau: 'commune',
    territoire: 'Brest',
    votants: 0,
    auteur: 'Citoyen #51009',
    statut: 'en-attente',
    validations: 4,
    rejets: 3,
    questions: [
      { texte: "Voulez-vous un contrôle citoyen indépendant de l'action des forces de l'ordre ?", poste: 'Contrôle citoyen', oui: 0, non: 0, sansAvis: 0, budget: 0 },
      { texte: 'Voulez-vous que toute surveillance soit autorisée localement et pour une durée limitée ?', poste: 'Encadrement', oui: 0, non: 0, sansAvis: 0, budget: 0 },
      { texte: 'Voulez-vous que les données collectées soient rendues publiques chaque trimestre ?', poste: 'Publicité', oui: 0, non: 0, sansAvis: 0, budget: 0 },
      { texte: 'Voulez-vous un référendum local sur ce sujet ?', poste: 'Référendum', oui: 0, non: 0, sansAvis: 0, budget: 0 },
      { texte: 'Voulez-vous que tout abus constaté soit sanctionné publiquement ?', poste: 'Sanctions', oui: 0, non: 0, sansAvis: 0, budget: 0 },
    ],
  },
  {
    id: 'parking-dimanche',
    emoji: '🚽',
    nom: 'Parking payant le dimanche',
    probleme: 'Le parking de la mairie est devenu payant le dimanche, ce qui pénalise les commerces du centre.',
    categorie: 'quotidien',
    niveau: 'commune',
    territoire: 'Caen',
    votants: 0,
    auteur: 'Citoyen #18840',
    statut: 'ecarte',
    validations: 2,
    rejets: 11,
    questions: [
      { texte: 'Voulez-vous un contrôle extérieur aléatoire, sans prévenir, sur ce sujet ?', poste: 'Contrôles', oui: 0, non: 0, sansAvis: 0, budget: 0 },
      { texte: 'Voulez-vous qu’un budget soit alloué selon la taille réelle des besoins locaux ?', poste: 'Budget', oui: 0, non: 0, sansAvis: 0, budget: 0 },
      { texte: 'Voulez-vous que les résultats des contrôles soient publics chaque trimestre ?', poste: 'Publicité', oui: 0, non: 0, sansAvis: 0, budget: 0 },
      { texte: 'Voulez-vous un référendum local sur ce sujet ?', poste: 'Référendum', oui: 0, non: 0, sansAvis: 0, budget: 0 },
      { texte: 'Voulez-vous que les responsables défaillants soient sanctionnés ?', poste: 'Sanctions', oui: 0, non: 0, sansAvis: 0, budget: 0 },
    ],
  },
];

function creerSujets(): Sujet[] {
  return GRAINES.map((g, index) => creerSujet(g, ilYA(6 - index, index * 3)));
}

/* -------------------------------------------------------------------------- */
/* Les sections locales                                                        */
/* -------------------------------------------------------------------------- */

const candidat = (pseudo: string, poste: Candidat['poste'], phrase: string, oui: number, non: number, sansAvis: number): Candidat => ({
  id: cle(),
  pseudo,
  poste,
  phrase,
  oui,
  non,
  sansAvis,
});

function creerSections(): Section[] {
  return [
    {
      id: 'section-national',
      niveau: 'national',
      territoire: 'France',
      citoyensActifs: 2348912,
      roles: [
        { poste: 'coordinateur', titulaire: 'Citoyen #48231', electionLe: ilYA(40) },
        { poste: 'moderateur', titulaire: 'Camille_31', electionLe: ilYA(40) },
        { poste: 'moderateur', titulaire: 'Sofia_B', electionLe: ilYA(40) },
      ],
      candidats: [],
    },
    {
      id: 'section-region-occitanie',
      niveau: 'region',
      territoire: 'Occitanie',
      citoyensActifs: 184320,
      roles: [
        { poste: 'coordinateur', titulaire: 'Citoyen #74002', electionLe: ilYA(120) },
        { poste: 'moderateur', titulaire: 'Aline_V', electionLe: ilYA(120) },
      ],
      candidats: [
        candidat('Camille_31', 'coordinateur', 'Je connais les 12 lycées du secteur et je peux organiser l’audience avec le rectorat.', 412, 88, 96),
        candidat('Citoyen #90122', 'coordinateur', 'Disponible en soirée et habitué des réunions publiques.', 210, 140, 188),
        candidat('Sofia_B', 'tresorier', 'Je tiens les comptes d’une association locale depuis 4 ans.', 288, 40, 120),
      ],
    },
    {
      id: 'section-region-bretagne',
      niveau: 'region',
      territoire: 'Bretagne',
      citoyensActifs: 96410,
      roles: [{ poste: 'coordinateur', titulaire: 'Yann_29', electionLe: ilYA(60) }],
      candidats: [candidat('Yann_29', 'coordinateur', 'Élu depuis 6 mois, je représente déjà la section au conseil régional.', 320, 44, 88)],
    },
    {
      id: 'section-commune-toulouse',
      niveau: 'commune',
      territoire: 'Toulouse',
      citoyensActifs: 41230,
      roles: [
        { poste: 'coordinateur', titulaire: 'Citoyen #33127', electionLe: ilYA(15) },
        { poste: 'moderateur', titulaire: 'Aline_V', electionLe: ilYA(15) },
        { poste: 'tresorier', titulaire: 'Citoyen #77120', electionLe: ilYA(15) },
      ],
      candidats: [],
    },
    {
      id: 'section-commune-brest',
      niveau: 'commune',
      territoire: 'Brest',
      citoyensActifs: 12890,
      roles: [{ poste: 'coordinateur', titulaire: 'Citoyen #51009', electionLe: ilYA(200) }],
      candidats: [candidat('Citoyen #51777', 'moderateur', 'Je propose de nettoyer les échanges hors-sujet, rien de plus.', 160, 30, 90)],
    },
    {
      id: 'section-region-hauts-de-france',
      niveau: 'region',
      territoire: 'Hauts-de-France',
      citoyensActifs: 122540,
      roles: [{ poste: 'coordinateur', titulaire: 'Citoyen #31002', electionLe: ilYA(180) }],
      candidats: [],
    },
    {
      id: 'section-region-auvergne-rhone-alpes',
      niveau: 'region',
      territoire: 'Auvergne-Rhône-Alpes',
      citoyensActifs: 158770,
      roles: [{ poste: 'coordinateur', titulaire: 'Citoyen #22140', electionLe: ilYA(90) }],
      candidats: [],
    },
  ];
}

/* -------------------------------------------------------------------------- */
/* Les rendez-vous                                                             */
/* -------------------------------------------------------------------------- */

function creerRendezVous(): RendezVous[] {
  return [
    {
      id: 'rdv-national',
      niveau: 'national',
      territoire: 'France',
      date: jourISO(new Date(Date.now() + 12 * 86400000)),
      heure: '15:00',
      nature: 'Audience parlementaire',
      lieu: 'Assemblée nationale — Paris',
      statut: 'officiel',
      validations: 42,
    },
    {
      id: 'rdv-region-occitanie',
      niveau: 'region',
      territoire: 'Occitanie',
      date: jourISO(new Date(Date.now() + 4 * 86400000)),
      heure: '18:30',
      nature: 'Négociation',
      lieu: 'Conseil régional — Toulouse',
      statut: 'officiel',
      validations: 18,
    },
    {
      id: 'rdv-commune-toulouse',
      niveau: 'commune',
      territoire: 'Toulouse',
      date: jourISO(new Date(Date.now() + 2 * 86400000)),
      heure: '09:00',
      nature: 'Audience',
      lieu: 'Mairie de Toulouse',
      statut: 'officiel',
      validations: 14,
    },
    {
      id: 'rdv-propose-brest',
      niveau: 'commune',
      territoire: 'Brest',
      date: jourISO(new Date(Date.now() + 21 * 86400000)),
      heure: '14:00',
      nature: 'Réunion interministérielle (proposée)',
      lieu: 'Sous-préfecture — Brest',
      statut: 'propose',
      validations: 6,
    },
    {
      id: 'rdv-historique-1',
      niveau: 'national',
      territoire: 'France',
      date: jourISO(new Date(Date.now() - 32 * 86400000)),
      heure: '10:00',
      nature: 'Négociation',
      lieu: 'Ministère de l’Éducation — Paris',
      statut: 'termine',
      validations: 61,
      bilan: { exigencesPresentees: 9, tauxReponse: 44, satisfaction: 11 },
    },
    {
      id: 'rdv-historique-2',
      niveau: 'region',
      territoire: 'Occitanie',
      date: jourISO(new Date(Date.now() - 61 * 86400000)),
      heure: '16:00',
      nature: 'Audience',
      lieu: 'Conseil régional — Toulouse',
      statut: 'termine',
      validations: 23,
      bilan: { exigencesPresentees: 5, tauxReponse: 60, satisfaction: 20 },
    },
    {
      id: 'rdv-historique-3',
      niveau: 'national',
      territoire: 'France',
      date: jourISO(new Date(Date.now() - 96 * 86400000)),
      heure: '11:30',
      nature: 'Audience parlementaire',
      lieu: 'Sénat — Paris',
      statut: 'termine',
      validations: 37,
      bilan: { exigencesPresentees: 7, tauxReponse: 29, satisfaction: 8 },
    },
  ];
}

/* -------------------------------------------------------------------------- */
/* Journal, historique, notifications                                          */
/* -------------------------------------------------------------------------- */

function creerJournal(): EntreeJournal[] {
  const h = (heures: number) => new Date(Date.now() - heures * 3600000).toISOString();
  return [
    { id: cle(), date: h(1), type: 'refonte', texte: 'Refonte de ' + new Date(Date.now() - 3600000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + ' — 4 812 votes agrégés sur 6 sujets. 0 question écartée.', },
    { id: cle(), date: h(1), type: 'exigence', texte: 'La question « Voulez-vous un référendum local avant toute suppression de ligne ? » passe à 88 % de OUI : elle devient une ✊ exigence du peuple.', },
    { id: cle(), date: h(2), type: 'montee', texte: 'Le sujet « Pouvoir d’achat » monte en 1ᵉʳ position.', },
    { id: cle(), date: h(3), type: 'ecartee', texte: 'Le peuple écarte « Voulez-vous que les défaillances des responsables soient sanctionnées ? » (72 % de NON).', },
    { id: cle(), date: h(4), type: 'refonte', texte: 'Refonte de ' + new Date(Date.now() - 4 * 3600000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + ' — 3 990 votes agrégés. La question « Contrôle extérieur aléatoire » passe à 78 % de OUI.', },
  ];
}

function creerHistorique() {
  return Array.from({ length: 8 }, (_, i) => {
    const heures = 8 - i;
    return {
      date: new Date(Date.now() - heures * 3600000).toISOString(),
      votants: 2400 + Math.round(Math.abs(Math.sin(i * 1.7)) * 4200),
      exigences: 8 + Math.round(Math.abs(Math.cos(i * 1.3)) * 4),
    };
  });
}

function creerNotifications(): Notification[] {
  const h = (heures: number) => new Date(Date.now() - heures * 3600000).toISOString();
  return [
    {
      id: 'notif-depart-1',
      date: h(1),
      type: 'refonte',
      titre: '🔄 La Refonte est passée',
      texte: 'Ton sujet « Toilettes des lycées » monte en 3ᵉ position 📈',
      urgent: false,
      lu: false,
      cible: { vue: 'sujet', sujetId: 'toilettes-lycees' },
    },
    {
      id: 'notif-depart-2',
      date: h(3),
      type: 'seuil',
      titre: '🗳️ Ton vote compte double',
      texte: '« Voulez-vous que les résultats des contrôles soient rendus publics chaque trimestre ? » est à 63 % de OUI, le seuil des 66 % est à portée.',
      urgent: true,
      lu: false,
      cible: { vue: 'sujet', sujetId: 'toilettes-lycees' },
    },
    {
      id: 'notif-depart-3',
      date: h(26),
      type: 'mobilisation',
      titre: '✊ Ton exigence est attaquée',
      texte: 'La question sur le plafonnement des prix est revenue au vote du peuple après une réponse de l’État. 74 % des citoyens n’en sont pas satisfaits.',
      urgent: true,
      lu: false,
      cible: { vue: 'rendez-vous' },
    },
  ];
}

/* -------------------------------------------------------------------------- */

export const CITOYEN_INITIAL = null;

/** L'état de départ, comme s'il existait déjà une communauté active. */
export function etatInitial(): Etat {
  const premiere = new Date(Date.now() - 3600000).toISOString();
  return {
    citoyen: CITOYEN_INITIAL,
    sujets: creerSujets(),
    sections: creerSections(),
    rendezVous: creerRendezVous(),
    mesVotes: {},
    mesBudgets: {},
    sujetsModeres: [],
    rdvValides: [],
    mesSignalements: [],
    mesElections: [],
    notifications: creerNotifications(),
    journal: creerJournal(),
    historique: creerHistorique(),
    dernierEnvoi: null,
    derniereRefonte: premiere,
    cycles: 147,
    cycleAccelere: false,
    reglagesNotif: { refontes: true, mobilisation: true, seuils: true },
    partages: {
      'toilettes-lycees': { lien: 'https://revolution.alphabette.fr/s/tlt7x', votes: 37 },
      'pouvoir-achat': { lien: 'https://revolution.alphabette.fr/s/pwa2k', votes: 112 },
    },
  };
}

/** Classement anonyme des « Mobilisés du mois » (pseudos seulement). */
export const MOBILISES_DU_MOIS = [
  { pseudo: 'Camille_31', votes: 1284, badge: 'verifie' as const },
  { pseudo: 'Yann_29', votes: 973, badge: 'verifie' as const },
  { pseudo: 'Aline_V', votes: 812, badge: 'citoyen' as const },
  { pseudo: 'Citoyen #48231', votes: 640, badge: 'citoyen' as const },
  { pseudo: 'Sofia_B', votes: 517, badge: 'verifie' as const },
  { pseudo: 'Citoyen #91244', votes: 402, badge: 'jeune' as const },
];

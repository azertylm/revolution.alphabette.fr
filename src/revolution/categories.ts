/**
 * categories.ts — les 8 catégories de sujets et les modèles de questions.
 *
 * C'est le cœur de la « dérivation automatique » : à partir d'un problème
 * décrit en une phrase, l'application produit 5 questions du schéma
 * « Voulez-vous [solution concrète] ? », plus une réserve de questions de
 * secours utilisées quand le peuple écarte massivement une question.
 */

export type CategorieId =
  | 'quotidien'
  | 'sante'
  | 'economie'
  | 'education'
  | 'justice'
  | 'transports'
  | 'environnement'
  | 'securite';

export interface ModeleQuestion {
  /** Formulation, toujours du type « Voulez-vous … ? ». */
  texte: string;
  /** Sous-poste budgétaire correspondant (utilisé par les curseurs). */
  poste: string;
}

export interface Categorie {
  id: CategorieId;
  nom: string;
  emoji: string;
  /** Les 5 questions dérivées automatiquement. */
  questions: ModeleQuestion[];
  /** Questions de secours, sorties quand une question est écartée. */
  secours: ModeleQuestion[];
  /** Niveau géographique le plus probable (utilisé par le filtre territorial). */
  niveau: 'commune' | 'departement' | 'region' | 'national';
}

export const CATEGORIES: Categorie[] = [
  {
    id: 'quotidien',
    nom: 'Quotidien',
    emoji: '🚽',
    niveau: 'commune',
    questions: [
      { texte: 'Voulez-vous un contrôle extérieur aléatoire, sans prévenir, sur ce sujet ?', poste: 'Contrôles extérieurs' },
      { texte: "Voulez-vous qu'un budget soit alloué selon la taille réelle des besoins locaux ?", poste: 'Budget local' },
      { texte: "Voulez-vous que les résultats des contrôles soient rendus publics chaque trimestre ?", poste: 'Publicité des résultats' },
      { texte: 'Voulez-vous un référendum local sur ce sujet ?', poste: 'Référendum local' },
      { texte: 'Voulez-vous que les responsables défaillants soient sanctionnés ?', poste: 'Sanctions' },
    ],
    secours: [
      { texte: "Voulez-vous un numéro unique pour signaler les manquements et obtenir une réponse en 15 jours ?", poste: 'Guichet unique' },
      { texte: "Voulez-vous qu'un citoyen tiré au sort siège dans l'instance qui décide ?", poste: 'Citoyen tiré au sort' },
      { texte: "Voulez-vous que le budget de ce poste soit sanctuarisé, non réaffectable ?", poste: 'Budget sanctuarisé' },
    ],
  },
  {
    id: 'sante',
    nom: 'Santé',
    emoji: '🏥',
    niveau: 'departement',
    questions: [
      { texte: 'Voulez-vous que les soins urgents soient garantis à moins de 30 minutes de chaque domicile ?', poste: 'Accès aux urgences' },
      { texte: "Voulez-vous que l'hôpital public soit prioritaire dans le budget national ?", poste: 'Budget hospitalier' },
      { texte: 'Voulez-vous un contrôle citoyen trimestriel des services de santé de votre territoire ?', poste: 'Contrôle citoyen' },
      { texte: "Voulez-vous un référendum local avant toute fermeture d'un service de santé public ?", poste: 'Référendum local' },
      { texte: "Voulez-vous que les postes vacants soient pourvus avant tout recours à l'intérim ?", poste: 'Postes et intérim' },
    ],
    secours: [
      { texte: 'Voulez-vous que les déserts médicaux soient déclarés en état d’urgence et traités comme tels ?', poste: 'Urgence déserts médicaux' },
      { texte: "Voulez-vous que les médecins installés en zone sous-dotée paient moins d'impôts ?", poste: 'Incitations à l’installation' },
      { texte: 'Voulez-vous un droit de suite citoyen sur les dossiers de fermeture de service ?', poste: 'Droit de suite' },
    ],
  },
  {
    id: 'economie',
    nom: 'Économie',
    emoji: '💶',
    niveau: 'national',
    questions: [
      { texte: 'Voulez-vous un plafonnement des prix des biens de première nécessité ?', poste: 'Plafonnement des prix' },
      { texte: 'Voulez-vous que les marges des grands distributeurs soient rendues publiques ?', poste: 'Transparence des marges' },
      { texte: 'Voulez-vous un contrôle citoyen annuel des aides publiques versées aux entreprises ?', poste: 'Contrôle des aides' },
      { texte: 'Voulez-vous un référendum avant toute hausse d’impôt ou de taxe ?', poste: 'Référendum fiscal' },
      { texte: 'Voulez-vous que les fraudeurs soient sanctionnés à la hauteur du préjudice causé ?', poste: 'Sanctions' },
    ],
    secours: [
      { texte: 'Voulez-vous que les salaires soient indexés sur l’inflation réelle des biens de première nécessité ?', poste: 'Indexation des salaires' },
      { texte: 'Voulez-vous un plafonnement des loyers encadré par les votes locaux ?', poste: 'Encadrement des loyers' },
      { texte: 'Voulez-vous que les aides publiques soient conditionnées à des emplois maintenus sur le territoire ?', poste: 'Conditionnalité des aides' },
    ],
  },
  {
    id: 'education',
    nom: 'Éducation',
    emoji: '🎓',
    niveau: 'region',
    questions: [
      { texte: 'Voulez-vous un contrôle extérieur aléatoire des établissements de votre région ?', poste: 'Contrôles extérieurs' },
      { texte: "Voulez-vous qu'un budget soit alloué selon le gabarit et le nombre d'élèves de chaque établissement ?", poste: 'Budget au gabarit' },
      { texte: 'Voulez-vous que les résultats des contrôles soient rendus publics chaque trimestre ?', poste: 'Publicité des résultats' },
      { texte: 'Voulez-vous un référendum local sur ce sujet ?', poste: 'Référendum local' },
      { texte: 'Voulez-vous que les défaillances des responsables soient sanctionnées ?', poste: 'Sanctions' },
    ],
    secours: [
      { texte: 'Voulez-vous que chaque établissement dispose d’un budget d’entretien voté par les élèves ?', poste: 'Budget voté par les élèves' },
      { texte: 'Voulez-vous que les effectifs par classe soient plafonnés à 24 ?', poste: 'Plafond d’effectifs' },
      { texte: 'Voulez-vous un droit de visite trimestriel des parents dans les lieux de vie scolaire ?', poste: 'Visites des parents' },
    ],
  },
  {
    id: 'justice',
    nom: 'Justice',
    emoji: '⚖️',
    niveau: 'national',
    questions: [
      { texte: 'Voulez-vous que les délais de jugement soient plafonnés et publiés ?', poste: 'Délais de jugement' },
      { texte: 'Voulez-vous un tirage au sort de citoyens pour contrôler les affaires sensibles ?', poste: 'Jury citoyen' },
      { texte: 'Voulez-vous que toutes les décisions de justice soient publiques et lisibles par tous ?', poste: 'Publicité des décisions' },
      { texte: "Voulez-vous un référendum sur l'indépendance de la justice ?", poste: 'Référendum' },
      { texte: 'Voulez-vous que les manquements des magistrats soient sanctionnés ?', poste: 'Sanctions' },
    ],
    secours: [
      { texte: 'Voulez-vous une aide juridique gratuite garantie pour tout citoyen ?', poste: 'Aide juridique' },
      { texte: 'Voulez-vous que les victimes soient informées de chaque étape de leur procédure ?', poste: 'Information des victimes' },
      { texte: 'Voulez-vous que la justice rende compte publiquement une fois par an ?', poste: 'Rapport public annuel' },
    ],
  },
  {
    id: 'transports',
    nom: 'Transports',
    emoji: '🚌',
    niveau: 'region',
    questions: [
      { texte: 'Voulez-vous une fréquence minimale garantie sur les lignes de votre région ?', poste: 'Fréquence garantie' },
      { texte: 'Voulez-vous que les tarifs soient uniques et identiques sur tout le territoire ?', poste: 'Tarif unique' },
      { texte: 'Voulez-vous un contrôle citoyen trimestriel de la ponctualité ?', poste: 'Contrôle citoyen' },
      { texte: 'Voulez-vous un référendum local avant toute suppression de ligne ?', poste: 'Référendum local' },
      { texte: 'Voulez-vous que les opérateurs défaillants perdent leur contrat ?', poste: 'Sanctions des opérateurs' },
    ],
    secours: [
      { texte: 'Voulez-vous la gratuité des transports pour les moins de 18 ans ?', poste: 'Gratuité jeunes' },
      { texte: 'Voulez-vous que les horaires soient garantis jusqu’à 23 h dans les zones rurales ?', poste: 'Service du soir' },
      { texte: 'Voulez-vous un droit de pétition citoyenne sur la carte des lignes ?', poste: 'Pétition sur les lignes' },
    ],
  },
  {
    id: 'environnement',
    nom: 'Environnement',
    emoji: '🌍',
    niveau: 'region',
    questions: [
      { texte: 'Voulez-vous un contrôle indépendant et aléatoire des rejets industriels ?', poste: 'Contrôles des rejets' },
      { texte: 'Voulez-vous que le budget écologique soit sanctuarisé et non réaffectable ?', poste: 'Budget sanctuarisé' },
      { texte: 'Voulez-vous que les résultats des contrôles soient publics chaque trimestre ?', poste: 'Publicité des résultats' },
      { texte: 'Voulez-vous un référendum local avant tout projet industriel polluant ?', poste: 'Référendum local' },
      { texte: 'Voulez-vous que les pollueurs paient la totalité de la dépollution ?', poste: 'Réparation du préjudice' },
    ],
    secours: [
      { texte: 'Voulez-vous que l’eau du robinet fasse l’objet de tests publics mensuels ?', poste: 'Tests de l’eau' },
      { texte: 'Voulez-vous un droit d’alerte citoyenne sur les pollutions constatées ?', poste: 'Droit d’alerte' },
      { texte: 'Voulez-vous que les pesticides soient interdits à proximité des écoles ?', poste: 'Zones tampon' },
    ],
  },
  {
    id: 'securite',
    nom: 'Sécurité',
    emoji: '🔒',
    niveau: 'commune',
    questions: [
      { texte: "Voulez-vous un contrôle citoyen indépendant de l'action des forces de l'ordre ?", poste: 'Contrôle citoyen' },
      { texte: "Voulez-vous que toute surveillance soit autorisée localement et pour une durée limitée ?", poste: 'Encadrement de la surveillance' },
      { texte: 'Voulez-vous que les données collectées soient rendues publiques chaque trimestre ?', poste: 'Publicité des données' },
      { texte: 'Voulez-vous un référendum local sur ce sujet ?', poste: 'Référendum local' },
      { texte: 'Voulez-vous que tout abus constaté soit sanctionné publiquement ?', poste: 'Sanctions' },
    ],
    secours: [
      { texte: 'Voulez-vous que les caméras financées par la commune soient débattues en séance publique ?', poste: 'Débat public sur les caméras' },
      { texte: 'Voulez-vous un droit d’accès citoyen aux rapports d’incidents ?', poste: 'Accès aux rapports' },
      { texte: 'Voulez-vous une médiation indépendante avant toute sanction collective ?', poste: 'Médiation' },
    ],
  },
];

export const CATEGORIE_PAR_DEFAUT: CategorieId = 'quotidien';

const PAR_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

/** Récupère une catégorie par son identifiant (jamais nul). */
export function categorie(id: CategorieId): Categorie {
  return PAR_ID.get(id) ?? CATEGORIES[0];
}

/** Devine la catégorie la plus probable d'après le texte du problème. */
export function devinerCategorie(probleme: string): CategorieId {
  const texte = probleme.toLowerCase();
  const indices: Record<string, CategorieId> = {
    toilette: 'quotidien', propreté: 'quotidien', poubelle: 'quotidien', trottoir: 'quotidien',
    hôpital: 'sante', hopital: 'sante', santé: 'sante', sante: 'sante', médecin: 'sante', urgences: 'sante',
    prix: 'economie', salaire: 'economie', pouvoir: 'economie', loyer: 'economie', impôt: 'economie', impot: 'economie',
    lycée: 'education', lycee: 'education', école: 'education', ecole: 'education', élève: 'education', eleve: 'education', université: 'education',
    justice: 'justice', tribunal: 'justice', jugement: 'justice', procès: 'justice',
    train: 'transports', bus: 'transports', transports: 'transports', ligne: 'transports', gare: 'transports',
    pesticide: 'environnement', pollution: 'environnement', climat: 'environnement', eau: 'environnement', déchets: 'environnement',
    police: 'securite', caméra: 'securite', securite: 'securite', sécurité: 'securite', insécurité: 'securite',
  };
  for (const [mot, id] of Object.entries(indices)) {
    if (texte.includes(mot)) return id;
  }
  return CATEGORIE_PAR_DEFAUT;
}

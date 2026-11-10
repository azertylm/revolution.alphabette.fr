import { categorie, type CategorieId } from './categories';
import type { CartePourquoi, MinuteCitoyenne, Question, Sujet, TermeDictionnaire } from './types';

/* ==========================================================================
   education.ts — l'éducation civique intégrée (prompt 9).

   Objectif : que l'application soit utilisable par un adolescent de 15 ans et
   une personne de 75 ans sans aucune aide extérieure. Jamais un mot compliqué
   sans explication à portée de geste, jamais une question dont on ne comprend
   pas l'enjeu.

   1. « Pourquoi c'est important ? » — trois phrases, jamais plus.
   2. Le dictionnaire citoyen — « mode jargon off ».
   3. Le simulateur d'impact — « Et moi, ça me coûte quoi ? ».
   4. La minute citoyenne — une seule fois par jour.
   ========================================================================== */

/* -------------------------------------------------------------------------- */
/* Outils internes (volontairement sans dépendance, pour rester réutilisable)  */
/* -------------------------------------------------------------------------- */

/** Hash stable → nombre entre 0 et 1 (aucun recours au hasard). */
function empreinte(texte: string): number {
  let h = 2166136261;
  for (let i = 0; i < texte.length; i += 1) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function nombreFr(valeur: number): string {
  return Math.round(valeur).toLocaleString('fr-FR');
}

/** Réforme une phrase en version « école primaire » : courte, sujette simple. */
export function enPhraseFacile(texte: string): string {
  let t = texte.trim();
  t = t.replace(/\bAujourd'hui,\s*/i, "Aujourd'hui : ");
  t = t.replace(/\bn'est pas\b/gi, 'reste sans');
  t = t.replace(/\bpermet(tent)?\b/gi, 'laisse');
  t = t.replace(/\bnéanmoins\b/gi, 'mais');
  t = t.replace(/\bc'est-à-dire\b/gi, 'soit');
  return t;
}

/* -------------------------------------------------------------------------- */
/* 1. « POURQUOI C'EST IMPORTANT ? »                                           */
/* -------------------------------------------------------------------------- */

/**
 * Les modèles de cartes par « poste » budgétaire. Les questions générées
 * réutilisent les mêmes postes dans toutes les catégories : les cartes sont
 * donc cohérentes partout, sans jamais changer de ton.
 */
const PAR_POSTE: { cle: RegExp; situation: string; siOui: string; siNon: string }[] = [
  {
    cle: /contr[ôo]le/i,
    situation:
      "Aujourd'hui, selon les cas, le contrôle est fait par l'organisme lui-même ou par un organisme extérieur ; la question demande un contrôle extérieur systématique.",
    siOui: 'un organisme extérieur inspecte par surprise, et les résultats sont rendus publics.',
    siNon: "les contrôles restent organisés comme aujourd'hui.",
  },
  {
    cle: /budget|sanctuaris|gabarit/i,
    situation: "Aujourd'hui, la répartition de l'argent est votée par les élus (État, région, département ou commune) ; la question demande un critère lié aux besoins mesurés.",
    siOui: "l'argent suit la taille réelle des besoins, et chaque euro versé est publié.",
    siNon: 'la répartition reste décidée comme aujourd’hui.',
  },
  {
    cle: /publicit|publics|publiques|rendus publics/i,
    situation: "Aujourd'hui, certains résultats sont déjà publics et d'autres doivent être demandés ; la question demande une publication régulière.",
    siOui: 'tout est publié chaque trimestre, en clair, pour tout le monde.',
    siNon: 'la publication reste comme aujourd’hui.',
  },
  {
    cle: /r[ée]f[ée]rendum/i,
    situation: "Aujourd'hui, cette décision est prise par les élus ou l'administration, sans vote direct des habitants.",
    siOui: 'le peuple vote avant que la décision passe.',
    siNon: "la décision reste prise par les élus ou l'administration.",
  },
  {
    cle: /sanction|pai(ent|e)|d[ée]pollution|perdent leur contrat/i,
    situation: "Aujourd'hui, des sanctions existent dans certains cas ; la question demande qu'elles soient appliquées et connues.",
    siOui: 'celui qui laisse filer est sanctionné, et la sanction est publique.',
    siNon: "les règles de sanction restent celles d'aujourd'hui.",
  },
  {
    cle: /fraction|fr[ée]quence|30 minutes|soins|acc[èe]s/i,
    situation: "Aujourd'hui, l'accès à ce service varie selon l'endroit où tu vis.",
    siOui: 'le service devient un droit, avec un délai maximum garanti partout.',
    siNon: "l'organisation reste celle d'aujourd'hui.",
  },
  {
    cle: /transparence|marges/i,
    situation: "Aujourd'hui, ces chiffres ne sont pas tous accessibles au public.",
    siOui: 'les chiffres deviennent publics : chacun peut vérifier.',
    siNon: 'les chiffres restent confidentiels.',
  },
  {
    cle: /num[ée]ro unique|guichet/i,
    situation: "Aujourd'hui, signaler un problème demande souvent de trouver soi-même le bon service.",
    siOui: 'un seul numéro suffit, avec une réponse obligatoire en 15 jours.',
    siNon: 'le parcours reste celui d’aujourd’hui.',
  },
  {
    cle: /tirage|citoyen tir[ée]/i,
    situation: "Aujourd'hui, ces décisions sont prises par des élus ou des professionnels ; le tirage au sort de citoyens reste rare.",
    siOui: 'des citoyens tirés au sort participent et contrôlent, au nom de tous.',
    siNon: 'l’organisation reste celle d’aujourd’hui.',
  },
];

const GENERIQUE = {
  situation: "Aujourd'hui, aucune règle n'impose cette mesure partout.",
  siOui: 'la mesure devient une obligation, et son application est contrôlée et publique.',
  siNon: "rien ne change : la situation reste telle quelle.",
};

function simple(texte: string): string {
  return enPhraseFacile(texte);
}

/**
 * Génère la carte « Pourquoi c'est important ? » d'une question.
 * Trois phrases maximum : la situation actuelle, ce qui change si OUI, ce qui
 * change si NON. Aucune opinion, seulement les conséquences.
 */
export function cartePourquoi(question: Question, cat: CategorieId): CartePourquoi {
  const trouvé = PAR_POSTE.find((p) => p.cle.test(question.poste) || p.cle.test(question.texte)) ?? GENERIQUE;
  void cat;
  // Aucune statistique ici : l'application n'en possède pas, elle n'en invente donc pas.
  const situation = trouvé.situation;
  const siOui = `Si OUI : ${trouvé.siOui}`;
  const siNon = `Si NON : ${trouvé.siNon}`;

  return {
    situation,
    siOui,
    siNon,
    simpleSituation: simple(situation),
    simpleOui: simple(siOui),
    simpleNon: simple(siNon),
    version: 1,
    auteur: 'Texte générique écrit pour l’application (sans source chiffrée)',
  };
}

/* -------------------------------------------------------------------------- */
/* 2. LE DICTIONNAIRE CITOYEN — « MODE JARGON OFF »                            */
/* -------------------------------------------------------------------------- */

export const DICTIONNAIRE_BASE: TermeDictionnaire[] = [
  { terme: 'décret', definition: "Une décision signée par le Président de la République ou le Premier ministre, sans vote du Parlement. Elle sert le plus souvent à préciser comment une loi s'applique.", simple: 'Une règle signée par le Président ou le Premier ministre, sans vote du Parlement.' },
  { terme: 'délégation', definition: "Le fait de confier à quelqu'un d'autre le pouvoir de décider à ta place.", simple: 'On donne le pouvoir de décider à quelqu\'un d\'autre.' },
  { terme: 'RIP', definition: "Le référendum d'initiative partagée : une proposition de loi déposée par au moins un cinquième des parlementaires (185), qui doit ensuite être soutenue par un dixième des électeurs (près de 5 millions de personnes). Aucun n'est encore allé jusqu'au vote.", simple: "Un référendum demandé par 185 parlementaires puis soutenu par près de 5 millions d'électeurs." },
  { terme: 'motion', definition: "Un texte court par lequel des élus disent officiellement ce qu'ils pensent ou demandent.", simple: 'Un texte où des élus disent ce qu\'ils pensent.' },
  { terme: 'ordonnance', definition: "Un texte écrit par le gouvernement sur un sujet qui relève normalement de la loi. Le Parlement doit d'abord l'y autoriser, puis ratifier l'ordonnance pour qu'elle ait la valeur d'une loi.", simple: "Un texte écrit par le gouvernement à la place d'une loi, avec l'autorisation du Parlement." },
  { terme: 'DGF', definition: "La dotation globale de fonctionnement : la principale somme que l'État verse chaque année aux communes, aux intercommunalités et aux départements.", simple: "L'argent que l'État verse chaque année aux communes et aux départements." },
  { terme: 'compétence', definition: "Le droit officiel de s'occuper d'un sujet : qui décide de quoi, entre la commune, le département, la région et l'État.", simple: 'Qui a le droit de décider de quoi.' },
  { terme: 'référendum', definition: 'Un vote où l\'on répond directement OUI ou NON à une question, sans passer par des élus.', simple: 'Un vote direct : tu réponds OUI ou NON.' },
  { terme: 'prérogative', definition: "Un droit réservé à une fonction : quelque chose qu'une seule personne ou institution peut faire.", simple: "Un droit réservé à une seule personne ou institution." },
  { terme: 'arrêté', definition: "Une décision écrite par un maire, un préfet ou un ministre pour appliquer une loi au quotidien.", simple: "Une décision écrite par un maire ou un préfet pour appliquer une loi." },
  { terme: 'circulaire', definition: "Un texte par lequel un ministre explique à ses services comment appliquer une loi.", simple: "Un texte où un ministre explique comment appliquer une loi." },
  { terme: 'amendement', definition: "Une modification proposée à un texte de loi avant son vote.", simple: 'Un changement proposé dans un texte de loi avant le vote.' },
  { terme: 'quorum', definition: "Le nombre minimum de personnes présentes pour qu'un vote soit valable.", simple: 'Le nombre minimum de personnes pour qu\'un vote compte.' },
  { terme: 'gabarit', definition: "La taille et la forme d'un bâtiment : ici, sa capacité, calculée sur le nombre d'élèves ou d'usagers.", simple: 'La taille du bâtiment, calculée sur le nombre de personnes.' },
  { terme: 'sanctuariser', definition: "Mettre un budget à l'abri : on décide qu'il ne pourra pas être dépensé pour autre chose.", simple: 'Mettre un budget à l\'abri, impossible à détourner.' },
  { terme: 'plafonnement', definition: 'Fixer un prix maximum, au-dessus duquel il est interdit de vendre.', simple: 'Un prix maximum : il est interdit de vendre plus cher.' },
  { terme: 'audience', definition: "Une réunion officielle où l'on est reçu par une institution pour présenter une demande.", simple: 'Une réunion officielle pour présenter une demande.' },
  { terme: 'interministériel', definition: 'Qui concerne plusieurs ministères à la fois.', simple: 'Qui concerne plusieurs ministères en même temps.' },
  { terme: 'répartition', definition: "La manière dont on partage une somme d'argent entre plusieurs postes.", simple: 'Comment on partage l\'argent entre plusieurs postes.' },
  { terme: 'sanction', definition: "Une conséquence officielle prévue quand une règle n'est pas respectée.", simple: 'Ce qui arrive quand une règle n\'est pas respectée.' },
];

/** Le vocabulaire à surveiller : dès qu'il apparaît, sa définition arrive avec lui. */
const TERMES_A_SURVEILLER = [
  ...DICTIONNAIRE_BASE.map((t) => t.terme),
  'préfet', 'tutelle', 'subvention', 'dotation', 'autonomie', 'concertation',
];

function normaliser(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/** Termes à caractère juridique ou administratif présents dans un texte. */
export function termesDans(texte: string): string[] {
  const propre = normaliser(texte);
  const trouves = new Set<string>();
  for (const terme of TERMES_A_SURVEILLER) {
    const forme = normaliser(terme);
    const motif = new RegExp(`(^|[^a-z0-9])${forme.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`);
    if (motif.test(propre)) trouves.add(terme);
  }
  return [...trouves];
}

/** Définition de secours : aucune donnée ne doit rester sans explication. */
export function definitionDeSecours(terme: string): TermeDictionnaire {
  return {
    terme,
    definition: `« ${terme} » : un mot de l'administration. En clair, il désigne une règle ou une décision officielle qui te concerne.`,
    simple: `« ${terme} » : un mot compliqué qui veut dire « une décision officielle ».`,
  };
}

/** Le dictionnaire complet : base + termes déjà collectés dans l'application. */
export function dictionnaireComplet(collectés: TermeDictionnaire[]): TermeDictionnaire[] {
  const parTerme = new Map<string, TermeDictionnaire>();
  for (const t of DICTIONNAIRE_BASE) parTerme.set(t.terme.toLowerCase(), t);
  for (const t of collectés) parTerme.set(t.terme.toLowerCase(), t);
  return [...parTerme.values()];
}

export function definitionDe(terme: string, collectés: TermeDictionnaire[]): TermeDictionnaire {
  const propre = terme.toLowerCase();
  return dictionnaireComplet(collectés).find((t) => t.terme.toLowerCase() === propre) ?? definitionDeSecours(terme);
}

/* -------------------------------------------------------------------------- */
/* 3. LE SIMULATEUR D'IMPACT — « ET MOI, ÇA ME COÛTE QUOI ? »                  */
/* -------------------------------------------------------------------------- */

export interface ProfilImpact {
  codePostal: string;
  statut: string;
  situation: string;
}

export interface Impact {
  concerne: boolean;
  cout: string;
  gain: string;
  detail: string;
  sources: { label: string; url: string }[];
}

const STATUTS = ['lycéen', 'étudiant', 'salarié', 'retraité', 'sans emploi', 'indépendant'] as const;
export const PROFILS_STATUT = STATUTS;
export const PROFILS_SITUATION = ['locataire', 'propriétaire', 'hébergé', 'sans logement fixe'] as const;

export function simulerImpact(question: Question, sujet: Sujet, profil: ProfilImpact): Impact {
  const poste = question.poste.toLowerCase();
  const concerne = question.etat === 'exigence';

  // L'application ne possède aucun chiffrage : elle n'invente donc ni coût ni nombre de personnes.
  const cout = 'Non chiffré';
  const gain =
    poste.includes('contrôle') || poste.includes('publicit')
      ? `des contrôles et des résultats rendus publics${sujet.niveau === 'region' ? ' pour ta région' : ''}`
      : poste.includes('budget')
        ? 'un budget réparti selon les besoins mesurés'
        : poste.includes('référendum')
          ? 'un vote avant la décision, au lieu de la découvrir après'
          : 'une mesure appliquée et vérifiée';

  const detail =
    `Profil indiqué : ${profil.statut}, ${profil.situation}${profil.codePostal ? `, ${profil.codePostal}` : ''}. ` +
    `Le sujet « ${sujet.nom} » est ${sujet.niveau === 'national' ? 'national' : `au niveau ${sujet.niveau} (${sujet.territoire})`}. ` +
    `Le coût réel d'une telle mesure dépendrait du texte voté et de son financement (impôts, économies ailleurs, emprunt) : ` +
    `personne ne peut le calculer à partir de trois champs. Pour te faire une idée, consulte les sources publiques ci-dessous.`;

  return {
    concerne,
    cout,
    gain,
    detail,
    sources: [
      { label: 'budget.gouv.fr — le budget de l’État expliqué', url: 'https://www.budget.gouv.fr' },
      { label: 'vie-publique.fr — fiches sur les finances publiques', url: 'https://www.vie-publique.fr' },
      { label: 'insee.fr — statistiques publiques', url: 'https://www.insee.fr/fr/statistiques' },
    ],
  };
}

/* -------------------------------------------------------------------------- */
/* 4. LA MINUTE CITOYENNE — UNE SEULE FOIS PAR JOUR                            */
/* -------------------------------------------------------------------------- */

export interface MinuteQuestion {
  id: string;
  question: string;
  explication: string;
}

export const MINUTES: MinuteQuestion[] = [
  { id: 'm1', question: 'Savais-tu qu’une pétition de 500 000 signatures peut mener à un débat à l’Assemblée nationale ?', explication: 'Sur le site des pétitions de l’Assemblée, à partir de 500 000 signatures venant d’au moins 30 départements, les députés peuvent décider d’en débattre dans l’hémicycle. Ce n’est pas automatique, et il n’y a pas de vote à la fin.' },
  { id: 'm2', question: 'Savais-tu qu’un maire peut prendre une décision tout seul, sans vote du conseil ?', explication: 'C’est un arrêté municipal : il doit rester dans le cadre de la loi.' },
  { id: 'm3', question: 'Savais-tu que ta région et ton département ne s’occupent pas des mêmes choses ?', explication: 'C’est la répartition des compétences : collèges au département, lycées à la région.' },
  { id: 'm4', question: 'Savais-tu qu’un décret s’applique même s’il n’a pas été voté par le Parlement ?', explication: 'Le gouvernement peut décider seul, le plus souvent pour préciser comment une loi s’applique.' },
  { id: 'm5', question: 'Savais-tu que l’abstention ne compte pas dans les pourcentages des résultats ?', explication: 'Aux élections, les résultats sont calculés sur les suffrages exprimés : ni l’abstention ni le vote blanc n’y comptent.' },
  { id: 'm6', question: 'Savais-tu que le budget d’une commune est public, ligne par ligne ?', explication: 'Chaque habitant peut consulter les comptes de sa mairie.' },
  { id: 'm7', question: 'Savais-tu qu’une loi peut être modifiée jusqu’à la dernière minute, par amendement ?', explication: 'Un amendement propose de changer un texte pendant son examen, avant le vote final.' },
  { id: 'm8', question: 'Savais-tu que « sans avis » n’est pas un vote blanc : il compte dans le résultat ?', explication: 'Ici, dire « sans avis » informe autant que dire OUI ou NON.' },
];

/** La minute du jour : rotation par jour de l'année, donc jamais deux fois la même séance. */
export function minuteDuJour(dateIso: string): MinuteQuestion {
  const jour = Math.floor(new Date(`${dateIso}T00:00:00`).getTime() / 86400000);
  const index = ((jour % MINUTES.length) + MINUTES.length) % MINUTES.length;
  return MINUTES[index];
}

/** Base nationale simulée (pour que la jauge « Le peuple s'instruit » soit vivante). */
// Plus de base nationale inventée : seules les réponses de cet appareil comptent.
const NATION_APPRIS = 0;
const NATION_SU = 0;

/** « Le peuple s'instruit : 71 % ». */
export function peupleInstruit(minute: MinuteCitoyenne): number {
  const appris = NATION_APPRIS + minute.appris;
  const su = NATION_SU + minute.suConnu;
  if (appris + su === 0) return 0;
  return Math.round((appris / (appris + su)) * 100);
}

/** Nombre total de réponses à la minute citoyenne (national + local, simulé). */
export function reponsesMinute(minute: MinuteCitoyenne): number {
  return NATION_APPRIS + NATION_SU + minute.appris + minute.suConnu;
}

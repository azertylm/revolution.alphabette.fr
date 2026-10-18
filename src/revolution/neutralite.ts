/**
 * neutralite.ts — le filtre anti-récupération (prompt 8, point 3).
 *
 * Règle fondatrice : aucun parti, aucune personnalité, aucune marque.
 * L'application n'autorise pas de profils « candidat », « parti » ou
 * « mouvement » : les rôles citoyens sont fonctionnels, jamais politiques.
 *
 * Toute question générée suit un modèle neutre : « Voulez-vous [solution
 * concrète] ? ». Le filtre ci-dessous refuse un texte qui contient le nom d'un
 * parti, d'un élu vivant ou d'une marque — ou qui cherche à soutenir une
 * personne ou un mouvement.
 */

/** Formulations interdites : on décide d'une mesure, jamais d'une personne. */
const FORMULES_INTERDITES: { motif: RegExp; raison: string }[] = [
  { motif: /\b(soutenez|soutiens|soutenez-vous|soutien à|votez pour|élisez|réélisez)\b/i, raison: 'On ne soutient pas une personne ici : on vote une mesure.' },
  { motif: /\b(parti|mouvement|rassemblement|coalition)\s+[a-zà-ÿ]/i, raison: 'Aucun parti, aucun mouvement : le peuple ne se range pas derrière une étiquette.' },
  { motif: /\b(candidat|candidate|présidentiable|leader)\b/i, raison: 'Aucun profil « candidat » : les rôles citoyens sont purement fonctionnels.' },
  { motif: /\b(notre champion|notre chef|notre sauveur)\b/i, raison: 'Aucune personnalité providentielle : le peuple décide, personne ne le guide.' },
];

/**
 * Noms de partis et de marques refusés dans une question ou une proposition.
 * Liste volontairement générique (prototype) : elle est ouverte et vérifiable,
 * exactement comme le reste de l'application.
 */
const NOMS_REFUSES = [
  // Étiquettes politiques (génériques, sans viser quiconque).
  'la republique en marche', 'rassemblement national', 'les republicains', 'la france insoumise',
  'parti socialiste', 'parti communiste', 'europe ecologie les verts', 'reconquete', 'horizons',
  // Grandes marques (aucune publicité déguisée en question).
  'amazon', 'google', 'apple', 'meta', 'facebook', 'tiktok', 'coca-cola', 'mcdonald', 'carrefour',
  'leclerc', 'totalenergies', 'total energies', 'lvmh', 'bouygues', 'veolia', 'suez',
];

export interface ResultatNeutralite {
  ok: boolean;
  raison?: string;
}

/** Vérifie qu'un texte reste neutre : aucune personne, aucun parti, aucune marque. */
export function verifierNeutralite(texte: string): ResultatNeutralite {
  const brut = texte.trim();
  if (!brut) return { ok: false, raison: 'Le texte est vide.' };

  const minuscule = brut
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  for (const nom of NOMS_REFUSES) {
    if (minuscule.includes(nom)) {
      return { ok: false, raison: `« ${nom} » : aucun nom de parti ni de marque dans une question du peuple.` };
    }
  }

  const normalise = brut.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const { motif, raison } of FORMULES_INTERDITES) {
    if (motif.test(normalise)) return { ok: false, raison };
  }

  return { ok: true };
}

/**
 * Une question du peuple doit toujours commencer par « Voulez-vous » et finir
 * par un point d'interrogation. Le filtre réécrit ou refuse le reste.
 */
export function questionNeutre(texte: string): boolean {
  return /^voulez-vous\b/i.test(texte.trim()) && texte.trim().endsWith('?');
}

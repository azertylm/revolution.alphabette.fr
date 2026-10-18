/**
 * regions.ts — les 18 régions françaises et leur position sur la carte
 * stylisée « Le fil du peuple » (coordonnées en pourcentage, DROM en encart).
 */

export interface RegionInfos {
  id: string;
  nom: string;
  /** Position sur la carte stylisée (0-100). */
  x: number;
  y: number;
  /** Rattachement d'usage pour les questions locales. */
  departementExemple: string;
  communeExemple: string;
}

export const REGIONS: RegionInfos[] = [
  { id: 'hauts-de-france', nom: 'Hauts-de-France', x: 53, y: 7, departementExemple: 'Nord', communeExemple: 'Lille' },
  { id: 'normandie', nom: 'Normandie', x: 31, y: 20, departementExemple: 'Calvados', communeExemple: 'Caen' },
  { id: 'ile-de-france', nom: 'Île-de-France', x: 50, y: 26, departementExemple: 'Paris', communeExemple: 'Paris' },
  { id: 'grand-est', nom: 'Grand Est', x: 71, y: 22, departementExemple: 'Bas-Rhin', communeExemple: 'Strasbourg' },
  { id: 'bretagne', nom: 'Bretagne', x: 13, y: 33, departementExemple: 'Finistère', communeExemple: 'Brest' },
  { id: 'pays-de-la-loire', nom: 'Pays de la Loire', x: 25, y: 40, departementExemple: 'Loire-Atlantique', communeExemple: 'Nantes' },
  { id: 'centre-val-de-loire', nom: 'Centre-Val de Loire', x: 45, y: 39, departementExemple: 'Loiret', communeExemple: 'Orléans' },
  { id: 'bourgogne-franche-comte', nom: 'Bourgogne-Franche-Comté', x: 65, y: 38, departementExemple: 'Côte-d’Or', communeExemple: 'Dijon' },
  { id: 'nouvelle-aquitaine', nom: 'Nouvelle-Aquitaine', x: 28, y: 60, departementExemple: 'Gironde', communeExemple: 'Bordeaux' },
  { id: 'auvergne-rhone-alpes', nom: 'Auvergne-Rhône-Alpes', x: 63, y: 56, departementExemple: 'Rhône', communeExemple: 'Lyon' },
  { id: 'occitanie', nom: 'Occitanie', x: 44, y: 74, departementExemple: 'Haute-Garonne', communeExemple: 'Toulouse' },
  { id: 'paca', nom: "Provence-Alpes-Côte d'Azur", x: 72, y: 72, departementExemple: 'Bouches-du-Rhône', communeExemple: 'Marseille' },
  { id: 'corse', nom: 'Corse', x: 87, y: 78, departementExemple: 'Corse-du-Sud', communeExemple: 'Ajaccio' },
  { id: 'guadeloupe', nom: 'Guadeloupe', x: 7, y: 90, departementExemple: 'Guadeloupe', communeExemple: 'Basse-Terre' },
  { id: 'martinique', nom: 'Martinique', x: 17, y: 94, departementExemple: 'Martinique', communeExemple: 'Fort-de-France' },
  { id: 'guyane', nom: 'Guyane', x: 29, y: 97, departementExemple: 'Guyane', communeExemple: 'Cayenne' },
  { id: 'la-reunion', nom: 'La Réunion', x: 72, y: 97, departementExemple: 'La Réunion', communeExemple: 'Saint-Denis' },
  { id: 'mayotte', nom: 'Mayotte', x: 85, y: 92, departementExemple: 'Mayotte', communeExemple: 'Mamoudzou' },
];

const PAR_ID = new Map(REGIONS.map((r) => [r.id, r]));

export function region(id: string): RegionInfos {
  return PAR_ID.get(id) ?? REGIONS[2];
}

export function nomRegion(id: string): string {
  return region(id).nom;
}

/** Les 13 régions de métropole, utilisées sur la carte. */
export const REGIONS_METROPOLE = REGIONS.slice(0, 13);

/** Périmètres proposés dans les sélecteurs (par ordre du plus proche au plus large). */
export const NIVEAUX: { id: 'commune' | 'departement' | 'region' | 'national'; nom: string; emoji: string }[] = [
  { id: 'commune', nom: 'Commune', emoji: '🏘️' },
  { id: 'departement', nom: 'Département', emoji: '🏛️' },
  { id: 'region', nom: 'Région', emoji: '🗺️' },
  { id: 'national', nom: 'National', emoji: '🇫🇷' },
];

export function nomNiveau(niveau: string): string {
  return NIVEAUX.find((n) => n.id === niveau)?.nom ?? niveau;
}

export function emojiNiveau(niveau: string): string {
  return NIVEAUX.find((n) => n.id === niveau)?.emoji ?? '📍';
}

/**
 * Rattachement d'un libellé de territoire à une région (données simulées du
 * prototype, étendues au besoin quand on ajoute des territoires).
 */
const RATTACHEMENT: Record<string, string> = {
  Toulouse: 'occitanie',
  'Haute-Garonne': 'occitanie',
  Occitanie: 'occitanie',
  Brest: 'bretagne',
  Bretagne: 'bretagne',
  Caen: 'normandie',
  Normandie: 'normandie',
  Lille: 'hauts-de-france',
  'Hauts-de-France': 'hauts-de-france',
  Lyon: 'auvergne-rhone-alpes',
  'Auvergne-Rhône-Alpes': 'auvergne-rhone-alpes',
};

/** Région à laquelle appartient un territoire donné (null si national). */
export function regionDeTerritoire(territoire: string): string | null {
  return RATTACHEMENT[territoire] ?? null;
}

/** Le sujet est-il dans le périmètre affiché ? */
export function dansPerimetre(
  niveau: string,
  territoire: string,
  perimetre: string,
): boolean {
  if (perimetre === 'tout') return true;
  if (niveau === 'national') return true;
  return regionDeTerritoire(territoire) === perimetre;
}

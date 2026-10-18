import type { AlphaAppConfig } from '@alphabette/shell';

/**
 * Configuration de l'application.
 * C'est ici que l'on décrit l'identité du site : son nom, son sous-titre, sa
 * couleur, son sous-domaine et ses liens (dons, compte, clés d'API).
 */
export const APP: AlphaAppConfig = {
  key: 'revolution',
  name: 'Révolution',
  tagline: 'À force de tirer sur le fil du peuple, il casse.',

  // Couleur d'identité du site : toute la base s'y adapte.
  accent: '#C8102E',

  // Adresses publiques (sous-domaine + chemin sur alphabette.fr).
  subdomain: 'revolution',
  homePath: '/revolution',

  // Liens de l'écosystème.
  donUrl: 'https://alphabette.fr/don',
  accountUrl: 'https://alphabette.fr/compte',
  apiKeysUrl: 'https://alphabette.fr/cles',

  // Compteur affiché dans la barre écosystème.
  counter: { unlocked: 1, total: 16, trialDaysLeft: 7 },
  apiKeyState: 'ok',
  accountState: 'ok',
};

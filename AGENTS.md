# AGENTS.md — Application de l’écosystème ALPHABETTE

**AVANT d’écrire la moindre ligne de code : lis `BRIEFING-ALPHABETTE.md`** à la
racine de ce dépôt — il contient les règles des barres du haut (écosystème +
application), les tarifs, les pièges connus et le rituel de livraison.

- L’identité du site se règle UNIQUEMENT dans `src/alphabette.app.ts` ;
- `src/shell/` est la base commune générée : ne pas recoder, ne pas dupliquer ;
- avant de rendre le travail : `bun run lint` + `bun run build`, et joindre un
  aperçu réel (rendu ou capture) — un rendu qu’on ne voit pas n’est pas terminé.

## Règle nº 8 — Synchro GitHub systématique

À chaque fin de tâche (et a fortiori de session), committer puis pousser
automatiquement chaque projet modifié dans son dépôt GitHub dédié
(règle nº 2) — au fur et à mesure du travail, sans attendre un ordre.
Le hub et les applications vivent dans des dépôts distincts : toujours
pousser chaque dossier dans LE bon dépôt. Ne jamais considérer une
livraison terminée tant qu'elle n'est pas sur GitHub.

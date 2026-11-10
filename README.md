# Révolution — l'actualité, ton avis, celui des autres

Application de l'écosystème [alphabette.fr](https://alphabette.fr) :
**https://revolution.alphabette.fr**

Repartie de zéro le 10 novembre 2026 : plus aucune donnée simulée. L'ancien
prototype (assemblée, sections, livre public, votes simulés) reste dans
l'historique Git, commit `b9a2981`.

## Ce que fait l'application

- **À la une** — toutes les 3 heures, la publication du hub lance
  `scripts/actualite.mjs`, qui lit l'actualité publique (franceinfo, Google
  Actualités par thème et par région), écarte faits divers, sport et jeux, et
  écrit `dist/actu.json`. Chaque sujet reçoit une question neutre
  (importance du sujet, avis sur une mesure, soutien à un mouvement), toujours
  avec « Je ne sais pas » / « Sans avis », et le lien vers l'article.
  L'ordre est personnalisé sur l'appareil (région, sujets choisis, fraîcheur).
- **Questions** — syndicats, associations, collectifs, élus et citoyens posent
  leurs questions, les partagent (lien, QR code) et voient les résultats.
- **Pour toi** — région et sujets, gardés uniquement dans le navigateur.

## Recueil partagé (Firebase)

`src/revolution/partage.ts` utilise la base Firestore du projet Firebase
d'Info Perso (même projet, collections `revolution_*`). Les règles à publier
sont dans `firebase/regles-revolution.rules` (bloc seul) et
`firebase/regles-completes.rules` (règles d'Info Perso + bloc Révolution).
Tant qu'elles ne sont pas publiées, l'application reste en « mode appareil »
et le dit (écran « Comment ça marche »).

Données envoyées : un identifiant anonyme, le numéro de la réponse, les
questions publiées. Les réponses individuelles ne sont lisibles que par leur
auteur ; seuls les compteurs sont publics.

## Construire

```bash
bun install
bun run lint
bun run build:static   # page + récolte de l'actualité dans dist/actu.json
```

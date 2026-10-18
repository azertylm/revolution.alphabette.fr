# Révolution

**À force de tirer sur le fil du peuple, il casse.**

Application de l'écosystème [alphabette.fr](https://alphabette.fr).

- Adresses : **https://revolution.alphabette.fr** (sous-domaine) et
  **https://alphabette.fr/revolution** (chemin).
- Base commune : [`@alphabette/shell`](https://alphabette.fr) — les deux barres du
  haut (écosystème + application), le thème jour/nuit, la densité et le plein écran.

## Gratuite, pour toujours

Révolution est une application **gratuite** de l'écosystème : aucun prix, aucun
essai qui se transforme en abonnement, aucune carte bancaire, aucune publicité.
Elle vit sur les dons et sur ce que financent les autres applications.

Techniquement, c'est une ligne dans `src/alphabette.app.ts` :

```ts
gratuit: true,
```

La base commune s'y adapte toute seule : la barre écosystème affiche
« gratuit (15 applications) », le bouton « Pass 40 €/an » devient
« 🧭 L'écosystème », et le panneau explique la gratuité. **Les liens vers le hub
restent en place** — alphabette.fr, les autres applications, les dons : c'est
l'écosystème qui fait vivre cette application, pas l'inverse.

## Démarrer

```powershell
bun install
bun run dev
```

## Structure

```
src/
  main.tsx            point d'entrée
  App.tsx             application enveloppée par <AppShell>
  alphabette.app.ts   identité du site (nom, sous-titre, couleur, liens)
```

## L'Assemblée du peuple — 20 administrateurs par région

L'onglet **🏛️ Assemblée** (et le bouton 🏛️ de l'en-tête) réunit deux choses :

- **les sections locales** — rejoindre la section de son territoire en un clic,
  voir ses rôles (coordination, modération, trésorerie) et ses adhérents ;
- **l'élection continue des administrateurs** — 20 sièges par région (plus
  l'Assemblée nationale), installés *au fur et à mesure*, jamais d'un coup.

**Tout est automatique.** Le citoyen ne fait que deux gestes : *rejoindre* sa
section et *soutenir* des volontaires. À chaque Refonte (toutes les heures), la
machine :

1. libère les sièges dont le mandat arrive à échéance (6 mois, sans reconduction) ;
2. inscrit de nouveaux volontaires ;
3. fait évoluer les soutiens ;
4. installe les sièges libres — **2 par Refonte au maximum**, toujours au
   volontaire le mieux soutenu, dans l'assemblée la plus incomplète ;
5. ouvre d'elle-même une section dès que 5 volontaires s'y manifestent ;
6. donne la coordination de la section au premier administrateur élu.

Tous les seuils sont dans **`src/revolution/reglages.ts`** (bloc
« L'Assemblée ») : nombre de sièges, durée du mandat, sièges installés par
refonte, seuil d'éligibilité, adhésions par refonte. Le moteur est dans
`src/revolution/assemblee.ts` (fonctions pures), l'interface dans
`src/revolution/vues/Assemblee.tsx`.

**Garde-fou, inscrit dans le code et affiché dans l'interface :** un
administrateur ne peut modifier ni un vote, ni une question, ni un résultat. Il
organise les réunions, modère les échanges et porte le cahier du peuple.

## La base commune

Le contenu de l'application se place à l'intérieur de `<AppShell>` :

```tsx
<AppShell app={APP}>…contenu…</AppShell>
```

L'identité (nom, sous-titre, couleur, compteur, liens) se règle **uniquement**
dans `src/alphabette.app.ts`. Ne pas recoder les barres : elles viennent de la base.

## Installer la base commune (paquet privé)

Le paquet `@alphabette/shell` est privé. Deux possibilités :

1. **Paquet publié** (une fois en place) : `bun install` suffit, avec le registre
   privé configuré dans `.npmrc`.
2. **En local, pendant la transition** — lier le paquet depuis le dépôt du hub :

   ```powershell
   cd "<chemin-du-hub>\packages\shell"
   bun link
   cd "<ce-dossier>"
   bun link @alphabette/shell
   ```

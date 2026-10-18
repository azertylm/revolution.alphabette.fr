# Révolution

**À force de tirer sur le fil du peuple, il casse.**

> **Le critère du peuple.** Une fonctionnalité ne compte que si **un adolescent de
> 15 ans** *et* **une personne de 75 ans**, sans aucune aide extérieure, savent
> voter seuls en moins de deux minutes. Si l'un des deux échoue, ou si un mot de
> la question reste incompris, la fonctionnalité n'est pas prête : elle repart à
> l'atelier. C'est la seule mesure de réussite qui vaille ici.

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
  main.tsx            point d'entrée (+ enregistrement du service worker en prod)
  App.tsx             application enveloppée par <AppShell>
  alphabette.app.ts   identité du site (nom, sous-titre, couleur, liens)
  revolution/
    Revolution.tsx    le cadre : en-tête, livre, contrat, dictionnaire, barre du bas
    etat.ts           l'état + le reducer (une action = une mutation d'état)
    types.ts          le modèle de données
    donnees.ts        les données simulées du prototype
    livre.ts          le livre public, les reçus, la détection « à vérifier »
    education.ts      les cartes « Pourquoi », le dictionnaire, le simulateur, la minute
    moteur-decompte.ts  LE moteur de décompte, isolé et rejouable
    neutralite.ts     le filtre anti-récupération (ni parti, ni personne, ni marque)
public/
  manifest.webmanifest  installation de la PWA
  service-worker.js     cache hors-ligne (jamais les /api)
  icone.svg             l'icône
```

## Architecture technique

Le prototype tourne entièrement dans le navigateur (aucun serveur de vote) :

- **React 19 + TypeScript**, **Tailwind CSS v4**, **Vite**. Aucune autre
  dépendance : pas de bibliothèque d'état, pas de routeur, pas d'ORM.
- **PWA installable** : `public/manifest.webmanifest`, une icône SVG, et un
  `service-worker.js` minimal qui met en cache la coquille pour un usage
  hors-ligne — **jamais** les appels `/api`, pour ne jamais servir un résultat
  figé à la place d'un résultat frais.
- **Un seul état, des actions nommées.** Tout passe par `reducer(etat, action)`
  dans `src/revolution/etat.ts` : un vote est une action, une refonte est une
  action, une réponse de l'État est une action. Le prototype persiste dans le
  navigateur ; un vrai backend remplacerait simplement le reducer par des appels
  réseau, sans changer les écrans.

Ce que serait le backend de production (décrit, pas encore branché) :

- **Node + PostgreSQL.** Une table `votes_agreges`, en **insertion seule**
  (`INSERT` uniquement, jamais `UPDATE` ni `DELETE`), **partitionnée par cycle
  horaire** (`PARTITION BY RANGE (cycle)`). Les résultats ne sont pas stockés :
  ils se recalculent.
- Les écritures sont des *bulletins agrégés* (un par cycle et par question), pas
  des votes individuels : la table ne permet donc pas de remonter à une personne.
- Le service de vote encaisse, vérifie l'unicité « un humain = un vote par
  question et par cycle », puis écrit une ligne. Le décompte est fait à part.

## Le moteur de décompte, isolé et rejouable

Le cœur anti-triche vit dans **`src/revolution/moteur-decompte.ts`** : un module
**pur**, sans React, sans navigateur, sans stockage. Il prend des lignes brutes
et rend des totaux. Trois garanties :

- **déterministe** — mêmes entrées, mêmes sorties, toujours ;
- **rejouable** — n'importe qui peut relire le journal brut et retrouver les
  chiffres exacts ;
- **vérifiable** — un tiers peut publier ce module et comparer ses résultats aux
  nôtres. L'écran « 📖 Livre public » affiche d'ailleurs en direct la
  comparaison *affichage vs recalcul*.

Concrètement : les votes sont écrits en **insertion pure** dans
`Etat.urne` (`BulletinAgrege[]`), partitionnés par cycle, et `recompter(urne)`
régénère tous les résultats. Rien n'est « décidé » par un humain, ni par un
serveur : tout se recalcule.

## Tenir à l'échelle : un million de votes par cycle

- **Partition par cycle.** Chaque heure est une partition ; on n'écrit que dans
  la partition courante, on ne lit que celles dont on a besoin.
- **Agrégation.** On stocke des bulletins agrégés par question et par cycle, pas
  un enregistrement par personne : le volume reste petit même à grande échelle.
- **Archive au-delà d'un seuil.** Les vieilles partitions sont archivées
  (`Etat.urneArchives`), gardées pour la vérification mais sorties du chemin
  chaud.
- **File d'attente au-delà de la charge.** `REGLAGES.chargeSaturee` (0,92) sert
  de seuil : au-delà, les écritures partent en file plutôt que d'être perdues.
- **Statique par ailleurs.** Tout le reste (identité, livre, contrat, cartes)
  est du contenu statique ou peu écrit : ce n'est pas là que passe l'échelle.

## Sécurité et sobriété

- **Identité minimale** : un pseudonyme, un **code PIN à 4 chiffres**, une
  région. Rien d'autre n'est demandé, rien d'autre n'est conservé.
- **Mots de passe hachés avec Argon2** (côté production) ; le prototype ne stocke
  qu'un PIN de démonstration.
- **Aucune géolocalisation**, **aucune adresse IP** conservée, **aucun traçage**,
  **aucun revendeur de données**. Le livre public ne contient jamais *qui* a voté
  *quoi* — seulement des totaux, des dates et des codes de contrôle.
- **Un appareil = 2 comptes maximum** (`REGLAGES.comptesParAppareil`), premier
  rempart silencieux contre les faux comptes.
- **Détection disciplinée** : un vote au comportement suspect devient « à
  vérifier ». Il est **compté mais marqué**, **jamais supprimé**. Au-delà de
  30 % sur une question, le résultat affiche « ⚠️ Résultat à confirmer ».

## Le peuple garde la trace

Trois écrans, ajoutés au prototype, forment la colonne vertébrale de la
confiance :

- **📖 Le livre public** (`src/revolution/vues/LivrePublic.tsx`) : journal
  *append-only* de tout ce qui se passe (chaque refonte, chaque exigence, chaque
  question écartée, chaque règle modifiée, chaque vote à vérifier). Filtrable et
  **exportable** (CSV/JSON), y compris l'urne brute pour recalculer soi-même.
- **📜 Notre contrat** (`src/revolution/vues/NotreContrat.tsx`) : les **5 règles
  du jeu**, publiques, modifiables **uniquement à 75 % de OUI** avec au moins
  500 votes exprimés. Chaque tentative laisse une ligne au livre. Le compteur
  « **Règles modifiées par le peuple : 0** » doit rester à zéro tant que le
  peuple n'en a pas décidé autrement — c'est une fierté.
- **🧾 Les reçus de vote** : chaque vote rend un code court (type `RVL-7F3K`),
  privé, conservable, qui prouve ton vote auprès du support sans jamais révéler
  publiquement pour quoi tu as voté.

## L'éducation civique intégrée

Pour que le critère du peuple soit tenable, l'application explique au lieu de
supposer :

- **« ❓ Pourquoi c'est important ? »** — sous chaque question, trois phrases
  maximum : la situation aujourd'hui, ce qui change si OUI, ce qui change si NON.
  Aucune opinion, seulement les conséquences. Les cartes sont **collaboratives** :
  n'importe qui peut en proposer une meilleure, adoptée à 50 % de OUI.
- **📚 Le dictionnaire citoyen** — « mode jargon off ». Chaque mot
  d'administration rencontré est souligné d'un **pointillé jaune** : on tape
  dessus, sa définition arrive en langage du quotidien (et en version école).
- **🧮 « Et moi ? »** — un simulateur d'impact sur chaque exigence : trois champs
  (code postal, statut, situation), une estimation en clair, des sources citées.
- **🎓 La minute citoyenne** — une seule fois par jour, une règle du jeu
  démocratique, plus la jauge « **Le peuple s'instruit** ».
- **♿ Accessibilité** — « Mode lecture facile » et « Texte agrandi », pour
  servir un adolescent de 15 ans comme une personne de 75 ans.

## Feuille de route

Sept phases, dans l'ordre. On ne passe à la suivante que si le critère du peuple
est respecté à la fin de celle-ci.

1. **Le vote qui compte.** Les 5 carrés, la refonte horaire, les seuils de 66 %,
   le cahier des doléances. *(fait dans le prototype)*
2. **Le jugement.** File de modération, rejets, archivage, signalements à trois
   votes de pairs. *(fait)*
3. **L'Assemblée et les sections.** 20 administrateurs par région, mandats de
   6 mois, sections locales ouvertes en un clic. *(fait)*
4. **La confiance.** Livre public exportable, reçus de vote, contrat verrouillé à
   75 %, détection « à vérifier », filtre de neutralité. *(fait — prompt 8)*
5. **L'éducation.** Cartes « Pourquoi », dictionnaire citoyen « jargon off »,
   simulateur d'impact, minute citoyenne, accessibilité. *(fait — prompt 9)*
6. **L'échelle et la preuve.** Backend Node + PostgreSQL, urne append-only
   partitionnée, moteur de décompte isolé et rejouable, PWA installable, sécurité
   et sobriété. *(architecture posée — prompt 10 ; backend à brancher)*
7. **Le vrai monde.** Ouverture publique, audit externe du moteur de décompte,
   publication des exports en continu, premières audiences présentées au nom du
   peuple. *(à venir)*

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

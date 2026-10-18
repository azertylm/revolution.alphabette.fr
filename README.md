# Révolution

**À force de tirer sur le fil du peuple, il casse.**

Application de l'écosystème [alphabette.fr](https://alphabette.fr).

- Adresses : **https://revolution.alphabette.fr** (sous-domaine) et
  **https://alphabette.fr/revolution** (chemin).
- Base commune : [`@alphabette/shell`](https://alphabette.fr) — les deux barres du
  haut (écosystème + application), le thème jour/nuit, la densité et le plein écran.

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

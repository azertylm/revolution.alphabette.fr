import { AppShell } from '@alphabette/shell';
import '@alphabette/shell/style.css';
import { APP } from './alphabette.app';
import { Revolution } from './revolution/Revolution';

/**
 * Révolution — « À force de tirer sur le fil du peuple, il casse. »
 *
 * Les deux barres du haut (écosystème + application), le thème jour/nuit, la
 * densité et le plein écran viennent de la base commune <AppShell>. Tout le
 * reste (accueil, sujets, votes, budget, refonte, cahier des doléances,
 * notifications) est le contenu de l'application.
 */
export function App() {
  return (
    <AppShell app={APP} initialTheme="nuit">
      <Revolution />
    </AppShell>
  );
}

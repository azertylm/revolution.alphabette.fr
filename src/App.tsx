import { AppShell } from '@alphabette/shell';
import '@alphabette/shell/style.css';
import { APP } from './alphabette.app';
import { Revolution } from './revolution/Revolution';

/**
 * Révolution — l'actualité, ton avis, celui des autres.
 *
 * Les deux barres du haut (écosystème + application), le thème jour/nuit, la
 * densité et le plein écran viennent de la base commune <AppShell>. Le reste
 * (questions du moment, questions posées par tous, réglages) est l'application.
 */
export function App() {
  return (
    <AppShell app={APP} initialTheme="nuit">
      <Revolution />
    </AppShell>
  );
}

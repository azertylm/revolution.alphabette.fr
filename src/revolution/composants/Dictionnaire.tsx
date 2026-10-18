import { useState } from 'react';
import { useRevolution } from '../contexte';
import { definitionDe, dictionnaireComplet, termesDans } from '../education';
import { Badge, Panneau, TitreSection } from '../ui';

/* ==========================================================================
   LE DICTIONNAIRE CITOYEN — « mode jargon off » (prompt 9).

   Règle unique : jamais un mot d'administration sans sa définition à portée de
   geste. Dans toute l'application, les termes repérés sont soulignés d'un
   pointillé jaune : on tape dessus, la phrase arrive en langage du quotidien.
   ========================================================================== */

/** Un mot souligné en pointillé : touche-le, sa définition apparaît dessous. */
export function MotDictionnaire({ terme }: { terme: string }) {
  const { etat } = useRevolution();
  const [ouvert, setOuvert] = useState(false);
  const d = definitionDe(terme, etat.dictionnaire);
  const texte = etat.accessibilite.lectureFacile ? d.simple : d.definition;

  return (
    <span className="inline-block">
      <button
        type="button"
        aria-expanded={ouvert}
        onClick={() => setOuvert((v) => !v)}
        className="mot-dico bg-transparent p-0 text-inherit"
        title="Voir la définition en clair"
      >
        {terme}
      </button>
      {ouvert && (
        <span className="mt-1 block rounded-xl border-2 border-jaune bg-carte2 p-2 text-left text-[12px] font-normal normal-case tracking-normal text-texte">
          📖 {texte}
        </span>
      )}
    </span>
  );
}

function echapper(texte: string): string {
  return texte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Affiche un texte en soulignant pointillé (jaune) tous les termes du
 * dictionnaire qu'il contient. Aucun mot compliqué ne passe sans explication.
 */
export function TexteCitoyen({ texte, className = '' }: { texte: string; className?: string }) {
  const termes = termesDans(texte);
  if (!termes.length) return <span className={className}>{texte}</span>;

  const motif = new RegExp(`(${termes.map(echapper).join('|')})`, 'gi');
  const connus = new Set(termes.map((t) => t.toLowerCase()));
  const morceaux = texte.split(motif);

  return (
    <span className={className}>
      {morceaux.map((m, i) =>
        connus.has(m.toLowerCase()) ? (
          <MotDictionnaire key={`${m}-${i}`} terme={m} />
        ) : (
          <span key={`t-${i}`}>{m}</span>
        ),
      )}
    </span>
  );
}

/** Le dictionnaire complet, consultable : tous les mots, toutes les définitions. */
export function PageDictionnaire() {
  const { etat } = useRevolution();
  const [filtre, setFiltre] = useState('');
  const facile = etat.accessibilite.lectureFacile;
  const tous = dictionnaireComplet(etat.dictionnaire).sort((a, b) => a.terme.localeCompare(b.terme, 'fr'));
  const liste = tous.filter((t) => t.terme.toLowerCase().includes(filtre.trim().toLowerCase()));

  return (
    <Panneau>
      <TitreSection droite={<Badge ton="jaune">{tous.length} mots</Badge>}>📖 Le dictionnaire citoyen</TitreSection>
      <p className="text-xs text-gris">
        « Mode jargon off » : aucun mot d’administration sans sa traduction. Touche un mot souligné n’importe où dans
        l’application, sa définition arrive ici.
      </p>
      <input
        value={filtre}
        onChange={(e) => setFiltre(e.target.value)}
        placeholder="Chercher un mot…"
        className="mt-3 w-full rounded-xl border border-bord bg-carte2 p-3 text-sm text-texte outline-none focus:border-jaune"
      />
      <ul className="mt-3 space-y-2">
        {liste.map((t) => (
          <li key={t.terme} className="rounded-xl border border-bord bg-carte2 p-3">
            <p className="affiche text-sm text-jaune">{t.terme}</p>
            <p className="mt-1 text-sm text-texte">{facile ? t.simple : t.definition}</p>
          </li>
        ))}
        {liste.length === 0 && <li className="text-sm text-gris">Aucun mot ne correspond.</li>}
      </ul>
    </Panneau>
  );
}

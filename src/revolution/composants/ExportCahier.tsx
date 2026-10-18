import { useState } from 'react';
import { useRevolution } from '../contexte';
import { empreinteCahier, justification, texteCahier, type Exigence } from '../moteur';
import type { RendezVous as Rdv } from '../types';
import { dateLisible, nombre, pct, statsQuestion } from '../outils';
import { Badge, GrosBouton, Panneau, TitreSection } from '../ui';

/* ==========================================================================
   📄 L'export du cahier des doléances, en trois formats :
   PDF imprimable, texte copiable, lien partageable.
   ========================================================================== */

function Document({ rdv, liste }: { rdv: Rdv | null; liste: Exigence[] }) {
  return (
    <div className="cahier-impression rounded-2xl border border-neutral-300 bg-white p-6 text-neutral-900">
      <div className="border-b-4 border-[#F2B705] pb-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-neutral-500">
          Document officiel du peuple — alphabette.fr
        </p>
        <h2 className="affiche mt-1 text-3xl font-black text-neutral-900">Cahier des doléances du peuple</h2>
        <p className="mt-1 text-sm font-bold text-[#C8102E]">« À force de tirer sur le fil du peuple, il casse. »</p>
      </div>

      <div className="mt-3 text-xs text-neutral-700">
        <p>
          Généré le {dateLisible(new Date().toISOString())} · {liste.length} exigence(s) votée(s) et priorisée(s).
        </p>
        {rdv && (
          <p className="mt-1">
            Rendez-vous : <strong>{rdv.nature}</strong> — {dateLisible(rdv.date)} à {rdv.heure} — {rdv.lieu}
            {rdv.niveau === 'national' ? ' · France entière' : ` · ${rdv.territoire}`}
          </p>
        )}
      </div>

      <ol className="mt-5 space-y-4">
        {liste.map((e, index) => {
          const st = statsQuestion(e.question);
          return (
            <li key={e.question.id} className="border-l-4 border-[#C8102E] pl-3">
              <p className="text-sm font-black text-neutral-900">
                {index + 1}. {e.sujet.emoji} {e.sujet.nom} — {e.question.texte}
              </p>
              <p className="mt-1 text-xs font-bold text-neutral-700">
                {pct(st.ouiPct)} OUI · {nombre(st.total)} votants · {Math.round(e.question.budgetMoyen)} pts de budget
                moyen · score {nombre(e.score)}
              </p>
              <p className="mt-1 text-xs italic text-neutral-600">{justification(e.sujet, e.question)}</p>
            </li>
          );
        })}
      </ol>

      <p className="mt-6 border-t border-neutral-300 pt-3 text-[11px] font-bold uppercase tracking-wide text-neutral-500">
        Document généré par le peuple, pour le peuple. Aucune ligne ne peut être modifiée à la main.
      </p>
    </div>
  );
}

export function ExportCahier({ rdv, liste }: { rdv: Rdv | null; liste: Exigence[] }) {
  const { etat } = useRevolution();
  const [ouvert, setOuvert] = useState(false);
  const [copie, setCopie] = useState<'aucune' | 'texte' | 'lien'>('aucune');
  const texte = texteCahier(etat, rdv, liste);
  const empreinte = empreinteCahier(liste);
  const lien = `https://revolution.alphabette.fr/cahier/${empreinte}`;

  const imprimer = () => {
    document.body.classList.add('impression-cahier');
    const nettoyer = () => {
      document.body.classList.remove('impression-cahier');
      window.removeEventListener('afterprint', nettoyer);
    };
    window.addEventListener('afterprint', nettoyer);
    window.print();
    window.setTimeout(nettoyer, 3000);
  };

  const copier = async (valeur: string, quoi: 'texte' | 'lien') => {
    try {
      await navigator.clipboard.writeText(valeur);
      setCopie(quoi);
    } catch {
      setCopie(quoi);
    }
  };

  return (
    <Panneau accent="jaune">
      <TitreSection
        droite={
          <div className="flex flex-wrap gap-2">
            <GrosBouton variante="neutre" onClick={() => setOuvert((o) => !o)}>
              {ouvert ? 'Masquer l’aperçu' : '👁️ Aperçu du document'}
            </GrosBouton>
            <GrosBouton onClick={imprimer}>📄 Exporter le cahier (PDF imprimable)</GrosBouton>
          </div>
        }
      >
        📄 Export du cahier
      </TitreSection>
      <p className="text-xs text-gris">
        Trois formats, un seul contenu : PDF imprimable, texte copiable, lien partageable. Le lien contient l’empreinte
        du cahier ({empreinte}) pour vérifier qu’il n’a pas été modifié.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <GrosBouton variante="neutre" onClick={() => copier(texte, 'texte')}>
          📋 Copier le texte officiel
        </GrosBouton>
        <GrosBouton variante="neutre" onClick={() => copier(lien, 'lien')}>
          🔗 Copier le lien partageable
        </GrosBouton>
        <Badge ton="gris">{liste.length} exigences</Badge>
      </div>
      {copie !== 'aucune' && (
        <p className="mt-2 text-xs font-bold text-jaune">
          {copie === 'texte' ? '✔ Texte du cahier copié.' : '✔ Lien copié.'}
        </p>
      )}

      {ouvert && (
        <div className="mt-4 space-y-4">
          <Document rdv={rdv} liste={liste} />
          <textarea
            readOnly
            value={texte}
            rows={10}
            className="w-full rounded-xl border border-bord bg-carte2 p-3 font-mono text-[11px] text-gris"
          />
        </div>
      )}
    </Panneau>
  );
}

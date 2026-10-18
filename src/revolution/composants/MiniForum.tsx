import { useState } from 'react';
import { useRevolution } from '../contexte';
import type { Sujet } from '../types';
import { heureLisible, nombre } from '../outils';
import { Badge, GrosBouton, Panneau } from '../ui';

/* ==========================================================================
   La section locale du sujet : une seule liste de messages, pas de
   sous-forums. Les rôles citoyens (coordinateur, modérateurs) sont élus par
   la section ; ils ne peuvent ni modifier une question, ni un vote, ni un
   résultat — seulement nettoyer et organiser.
   ========================================================================== */

export function MiniForum({ sujet }: { sujet: Sujet }) {
  const { etat, agir } = useRevolution();
  const [texte, setTexte] = useState('');
  const section = etat.sections.find((s) => s.territoire === sujet.territoire);
  const coordinateur = section?.roles.find((r) => r.poste === 'coordinateur');

  const publier = () => {
    if (!etat.citoyen) return;
    if (texte.trim().length < 3) return;
    agir({ type: 'message', sujetId: sujet.id, texte: texte.trim() });
    setTexte('');
  };

  return (
    <div className="space-y-4">
      <Panneau>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="affiche text-lg text-jaune">💬 Section locale — {sujet.territoire}</p>
            <p className="text-[11px] text-gris">
              {nombre(section?.citoyensActifs ?? 12_000)} citoyens actifs · une seule liste de messages
            </p>
          </div>
          {coordinateur && (
            <Badge ton="jaune">
              Coordinateur : {coordinateur.titulaire ?? 'poste vacant'}
            </Badge>
          )}
        </div>
        <p className="mt-2 text-[11px] text-gris">
          Le coordinateur organise le rendez-vous local et transmet le cahier de doléances. Il ne peut modifier aucune
          question, aucun vote, aucun résultat : le cahier est généré automatiquement par les votes.
        </p>
      </Panneau>

      <Panneau>
        <ul className="space-y-3">
          {sujet.messages.length === 0 && <li className="text-sm text-gris">Aucun message. Ouvre la discussion.</li>}
          {sujet.messages.map((m) => (
            <li key={m.id} className="rounded-xl border border-bord bg-carte2 p-3">
              <div className="flex items-center gap-2 text-[11px] font-bold text-gris">
                <span className="text-texte">{m.pseudo}</span>
                {m.badge === 'verifie' && <Badge ton="rouge">✔ vérifié</Badge>}
                {m.badge === 'jeune' && <Badge ton="vert">🌱 jeune</Badge>}
                <span>· {heureLisible(m.date)}</span>
              </div>
              <p className="mt-1 text-sm text-texte">{m.texte}</p>
            </li>
          ))}
        </ul>
      </Panneau>

      <Panneau>
        {etat.citoyen ? (
          <div className="space-y-2">
            <textarea
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              rows={3}
              maxLength={400}
              placeholder="Un message utile, une information vérifiable, une proposition d’organisation…"
              className="w-full rounded-xl border border-bord bg-carte2 p-3 text-sm text-texte outline-none focus:border-jaune"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-gris">{texte.length}/400</span>
              <GrosBouton onClick={publier} disabled={texte.trim().length < 3}>
                Publier dans la section
              </GrosBouton>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gris">Identifie-toi (pseudo + code PIN) pour participer à la section.</p>
        )}
      </Panneau>
    </div>
  );
}

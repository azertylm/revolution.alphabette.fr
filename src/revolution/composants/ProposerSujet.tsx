import { useMemo, useState } from 'react';
import { CATEGORIES, categorie, devinerCategorie, type CategorieId } from '../categories';
import { useRevolution } from '../contexte';
import { verifierNeutralite } from '../neutralite';
import { REGLAGES } from '../reglages';
import { REGIONS } from '../regions';
import { dateLisible, duree, nomDepuisProbleme, ressemblance } from '../outils';
import { Badge, GrosBouton, Panneau } from '../ui';

/* ==========================================================================
   « Envoyer au peuple » : deux champs, pas un de plus.
   Le problème et la catégorie. Les 5 questions sont dérivées automatiquement,
   et le sujet part d'abord en file de modération communautaire.
   ========================================================================== */

export function ProposerSujet({ onFermer }: { onFermer: () => void }) {
  const { etat, agir } = useRevolution();
  const [probleme, setProbleme] = useState('');
  const [cat, setCat] = useState<CategorieId>('quotidien');
  const [envoye, setEnvoye] = useState(false);

  const quotaRestant = useMemo(() => {
    if (!etat.dernierEnvoi) return 0;
    const ecoule = Date.now() - new Date(etat.dernierEnvoi).getTime();
    return Math.max(0, REGLAGES.quotaHeures * 3600000 - ecoule);
  }, [etat.dernierEnvoi]);

  const doublon = useMemo(() => {
    if (probleme.trim().length < 12) return null;
    let meilleur: { id: string; nom: string; taux: number } | null = null;
    for (const s of etat.sujets) {
      if (s.statut === 'ecarte') continue;
      const taux = Math.max(ressemblance(probleme, s.probleme), ressemblance(probleme, s.nom));
      if (taux >= REGLAGES.ressemblanceMax && (!meilleur || taux > meilleur.taux)) {
        meilleur = { id: s.id, nom: s.nom, taux };
      }
    }
    return meilleur;
  }, [probleme, etat.sujets]);

  const envoyer = () => {
    agir({ type: 'proposer-sujet', probleme: probleme.trim(), categorie: cat });
    setEnvoye(true);
  };

  const questions = useMemo(() => categorie(cat).questions, [cat]);

  // Filtre de neutralité (prompt 8) : aucune personne, aucun parti, aucune marque.
  const neutralite = useMemo(() => verifierNeutralite(probleme), [probleme]);
  const neutraliteSignalee = probleme.trim().length >= 12 && !neutralite.ok;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-bord bg-carte p-5 sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3">
          <h2 className="affiche text-2xl text-jaune">Proposer un sujet</h2>
          <button type="button" onClick={onFermer} className="rounded-lg border border-bord px-3 py-1 text-sm text-gris">
            Fermer
          </button>
        </div>

        {envoye ? (
          <div className="mt-4 space-y-3">
            <Panneau accent="jaune">
              <p className="affiche text-lg text-jaune">📨 Envoyé au peuple</p>
              <p className="mt-1 text-sm text-texte">
                Ton sujet « {nomDepuisProbleme(probleme)} » part en file d’attente. À {REGLAGES.seuilValidations}{' '}
                validations « ça me concerne aussi », il devient officiel et ses 5 questions s’ouvrent au vote. À{' '}
                {REGLAGES.seuilRejets} rejets, il est archivé — jamais supprimé.
              </p>
            </Panneau>
            <Panneau>
              <p className="text-[11px] font-bold uppercase tracking-wide text-gris">
                Les 5 questions dérivées automatiquement
              </p>
              <ol className="mt-2 space-y-2 text-sm text-texte">
                {questions.map((q, i) => (
                  <li key={q.texte}>
                    <span className="affiche mr-2 text-jaune">{i + 1}.</span>
                    {q.texte}
                  </li>
                ))}
              </ol>
            </Panneau>
            <GrosBouton onClick={onFermer}>C’est tout. Retour à l’accueil</GrosBouton>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {quotaRestant > 0 && (
              <Panneau accent="rouge">
                <p className="text-sm font-bold text-rouge">
                  ⏳ Anti-spam : un sujet par {REGLAGES.quotaHeures} h. Il te reste {duree(quotaRestant)} avant de
                  pouvoir envoyer un nouveau sujet.
                </p>
                <p className="mt-1 text-[11px] text-gris">
                  En attendant, tu peux valider les sujets en attente ou voter.
                </p>
              </Panneau>
            )}

            <div>
              <label className="affiche text-sm text-texte" htmlFor="probleme">
                1. Décris le problème en une phrase
              </label>
              <textarea
                id="probleme"
                value={probleme}
                maxLength={200}
                rows={3}
                onChange={(e) => setProbleme(e.target.value)}
                placeholder="Dans quasiment tous les lycées de France, les toilettes sont sales et vétustes."
                className="mt-2 w-full rounded-xl border border-bord bg-carte2 p-3 text-sm text-texte outline-none focus:border-jaune"
              />
              <div className="mt-1 flex justify-between text-[11px] text-gris">
                <span>Pas de titre, pas d’options avancées, pas de pièce jointe. La simplicité est la loi.</span>
                <span>{probleme.length}/200</span>
              </div>
              {probleme.trim().length >= 12 && (
                <p className="mt-1 text-[11px] text-gris">
                  Nom proposé pour la tuile : <span className="text-jaune">{nomDepuisProbleme(probleme)}</span> ·
                  catégorie devinée : {categorie(devinerCategorie(probleme)).emoji}{' '}
                  {categorie(devinerCategorie(probleme)).nom}
                </p>
              )}
            </div>

            <div>
              <p className="affiche text-sm text-texte">2. Choisis la catégorie</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCat(c.id)}
                    className={`rounded-xl px-3 py-2 text-xs font-bold ${
                      cat === c.id ? 'bg-jaune text-black' : 'border border-bord bg-carte2 text-gris'
                    }`}
                  >
                    {c.emoji} {c.nom}
                  </button>
                ))}
              </div>
            </div>

            {neutraliteSignalee && (
              <Panneau accent="rouge">
                <p className="text-sm font-bold text-rouge">🚫 Filtre de neutralité</p>
                <p className="mt-1 text-sm text-texte">{neutralite.raison}</p>
                <p className="mt-1 text-[11px] text-gris">
                  Ici, on décide toujours d’une mesure concrète — jamais d’une personne, d’un parti ou d’une marque.
                </p>
              </Panneau>
            )}

            {doublon && (
              <Panneau accent="rouge">
                <p className="text-sm font-bold text-rouge">
                  🔍 Doublon probable ({Math.round(doublon.taux * 100)} % de ressemblance)
                </p>
                <p className="mt-1 text-sm text-texte">
                  « {doublon.nom} » existe déjà. Vote sur le sujet existant plutôt que d’en créer un nouveau : un sujet
                  fort vaut mieux que deux faibles.
                </p>
                <p className="mt-1 text-[11px] text-gris">
                  Valider ce doublon fusionnerait ton énergie avec celle des {REGLAGES.seuilValidations} premiers
                  citoyens.
                </p>
              </Panneau>
            )}

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-gris">
                Aperçu des questions qui seront dérivées
              </p>
              <ol className="mt-2 space-y-1 text-xs text-gris">
                {questions.map((q, i) => (
                  <li key={q.texte}>
                    <span className="text-jaune">{i + 1}.</span> {q.texte}
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <GrosBouton
                onClick={envoyer}
                disabled={probleme.trim().length < 12 || quotaRestant > 0 || Boolean(doublon) || neutraliteSignalee}
              >
                ✊ Envoyer au peuple
              </GrosBouton>
              {probleme.trim().length < 12 && <span className="text-[11px] text-gris">Décris le problème en une phrase.</span>}
              {doublon && <Badge ton="rouge">Vote plutôt sur « {doublon.nom} »</Badge>}
            </div>
            <p className="text-[11px] text-gris">
              Prochain envoi possible :{' '}
              {etat.dernierEnvoi
                ? dateLisible(new Date(new Date(etat.dernierEnvoi).getTime() + REGLAGES.quotaHeures * 3600000).toISOString())
                : 'maintenant'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

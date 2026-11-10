import { useEffect, useMemo, useState } from 'react';
import { useRev } from '../contexte';
import { auteur, AUTEURS, ilYa, nombre, nomRegion } from '../donnees';
import { listerQuestions, lireQuestion, publierQuestion, retirerQuestion, signalerQuestion } from '../partage';
import type { QuestionPubliee } from '../types';
import { Badge, Carres, GrosBouton, Panneau, Puce, Titre } from '../ui';
import { useCompteurs } from './ALaUne';
import { BlocPartage } from './Partager';

/** Au-delà de ce nombre de signalements, une question est masquée en attendant d'être revue. */
export const SEUIL_SIGNALEMENTS = 5;

export function CarteQuestion({ q, seule }: { q: QuestionPubliee; seule?: boolean }) {
  const { etat, repondre, aller } = useRev();
  const mienne = etat.reponses[q.id];
  const auteurOuMoi = q.mienne || etat.publiees.includes(q.id);
  const [tour, setTour] = useState(0);
  const compteurs = useCompteurs(q.id, Boolean(mienne) || auteurOuMoi, tour);
  const [signal, setSignal] = useState<'' | 'ok' | 'deja' | 'erreur'>('');
  const [retiree, setRetiree] = useState(false);
  const a = auteur(q.auteurType);
  const total = compteurs ? compteurs.reduce((x, y) => x + y, 0) : 0;

  if (retiree) return <Panneau><p className="text-sm text-gris">Question retirée.</p></Panneau>;

  return (
    <Panneau className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge ton={q.auteurType === 'syndicat' ? 'rouge' : 'gris'}>
          {a.emoji} {a.nom}
        </Badge>
        <Badge ton={q.territoire === 'national' ? 'gris' : 'jaune'}>
          {q.territoire === 'national' ? '🇫🇷 Toute la France' : `📍 ${nomRegion(q.territoire)}`}
        </Badge>
      </div>
      <p className="text-xs text-gris">
        Posée par <strong className="text-texte">{q.auteurNom}</strong> (nom déclaré, non vérifié) · {ilYa(q.creeLe)}
      </p>
      <h3 className="text-lg font-black leading-snug text-texte">{q.texte}</h3>
      {q.contexte && <p className="text-sm text-gris">{q.contexte}</p>}
      {q.lien && (
        <a href={q.lien} target="_blank" rel="noreferrer nofollow" className="text-sm font-bold text-jaune underline">
          Source indiquée par l’auteur ↗
        </a>
      )}

      <Carres
        choix={q.choix}
        monChoix={mienne?.choix ?? null}
        compteurs={compteurs}
        onChoisir={(i) => void repondre(q.id, i).then(() => setTour((t) => t + 1))}
      />

      {auteurOuMoi && !mienne && compteurs && (
        <div className="rounded-xl border-2 border-jaune p-3 text-sm text-texte">
          <p className="font-black">Résultats (tu es l’auteur) — {nombre(total)} réponse{total > 1 ? 's' : ''}</p>
          <ul className="mt-1 space-y-0.5">
            {q.choix.map((c, i) => (
              <li key={c}>
                {c} : {total ? Math.round(((compteurs[i] ?? 0) / total) * 100) : 0} % ({nombre(compteurs[i] ?? 0)})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        {!seule && (
          <button type="button" className="font-bold underline" onClick={() => aller(`/q/${q.id}`)}>
            Partager / voir les résultats
          </button>
        )}
        {!auteurOuMoi && (
          <button
            type="button"
            className="text-gris underline"
            disabled={signal !== ''}
            onClick={() =>
              void signalerQuestion(q.id)
                .then((r) => setSignal(r === 'hors-ligne' ? 'erreur' : r))
                .catch(() => setSignal('erreur'))
            }
          >
            {signal === 'ok'
              ? 'Signalement envoyé'
              : signal === 'deja'
                ? 'Déjà signalée'
                : signal === 'erreur'
                  ? 'Signalement impossible'
                  : '⚠️ Signaler'}
          </button>
        )}
        {auteurOuMoi && q.mienne && (
          <button
            type="button"
            className="text-gris underline"
            onClick={() => {
              if (window.confirm('Retirer cette question ? Ses résultats ne seront plus visibles.')) {
                void retirerQuestion(q.id).then((ok) => ok && setRetiree(true));
              }
            }}
          >
            Retirer ma question
          </button>
        )}
      </div>
    </Panneau>
  );
}

function Brouillons() {
  const { etat, modifier, partageEtat } = useRev();
  const [etatPub, setEtatPub] = useState<Record<string, string>>({});
  if (etat.brouillons.length === 0) return null;
  return (
    <Panneau accent="jaune" className="space-y-3">
      <p className="affiche text-jaune">Mes questions en attente ({etat.brouillons.length})</p>
      {etat.brouillons.map((b) => (
        <div key={b.id} className="rounded-xl border-2 border-bord p-3">
          <p className="font-bold text-texte">{b.texte}</p>
          <p className="text-xs text-gris">
            {b.auteurNom} · {b.choix.join(' / ')}
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-sm">
            {partageEtat === 'actif' && (
              <button
                type="button"
                className="font-bold underline"
                disabled={etatPub[b.id] === 'envoi'}
                onClick={async () => {
                  setEtatPub((x) => ({ ...x, [b.id]: 'envoi' }));
                  try {
                    const { id: _id, creeLe: _c, ...q } = b;
                    const nouvel = await publierQuestion(q);
                    if (!nouvel) throw new Error();
                    modifier((e) => ({
                      ...e,
                      brouillons: e.brouillons.filter((x) => x.id !== b.id),
                      publiees: [nouvel, ...e.publiees],
                    }));
                  } catch {
                    setEtatPub((x) => ({ ...x, [b.id]: 'erreur' }));
                  }
                }}
              >
                {etatPub[b.id] === 'envoi' ? 'Publication…' : etatPub[b.id] === 'erreur' ? 'Échec, réessayer' : 'Publier maintenant'}
              </button>
            )}
            <button
              type="button"
              className="text-gris underline"
              onClick={() => modifier((e) => ({ ...e, brouillons: e.brouillons.filter((x) => x.id !== b.id) }))}
            >
              Supprimer
            </button>
          </div>
        </div>
      ))}
    </Panneau>
  );
}

export function Questions() {
  const { partageEtat, aller, etat } = useRev();
  const [liste, setListe] = useState<QuestionPubliee[] | null | undefined>(undefined);
  const [filtre, setFiltre] = useState<string>('tous');

  useEffect(() => {
    if (partageEtat !== 'actif') return;
    void listerQuestions()
      .then(setListe)
      .catch(() => setListe(null));
  }, [partageEtat]);

  const visibles = useMemo(
    () =>
      (liste ?? [])
        .filter((q) => q.signalements < SEUIL_SIGNALEMENTS || q.mienne)
        .filter((q) => filtre === 'tous' || q.auteurType === filtre)
        .sort((a, b) => {
          const pa = etat.profil.region && a.territoire === etat.profil.region ? 1 : 0;
          const pb = etat.profil.region && b.territoire === etat.profil.region ? 1 : 0;
          return pb - pa || b.creeLe.localeCompare(a.creeLe);
        }),
    [liste, filtre, etat.profil.region],
  );

  return (
    <div className="space-y-4">
      <Titre droite={<GrosBouton onClick={() => aller('/poser')}>+ Poser</GrosBouton>}>Questions posées</Titre>
      <p className="text-sm text-gris">
        Les questions des syndicats, des associations, des collectifs et des citoyens. Réponds, partage, ou pose la
        tienne.
      </p>

      <Brouillons />

      {partageEtat === 'verification' && <p className="text-sm text-gris">Connexion au recueil partagé…</p>}

      {partageEtat === 'inactif' && (
        <Panneau>
          <p className="text-sm text-texte">
            Le recueil partagé n’est pas encore ouvert : les questions des organisations apparaîtront ici dès son
            activation. Tu peux déjà préparer la tienne.
          </p>
        </Panneau>
      )}

      {partageEtat === 'actif' && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Puce actif={filtre === 'tous'} onClick={() => setFiltre('tous')}>
              Toutes
            </Puce>
            {AUTEURS.map((a) => (
              <Puce key={a.id} actif={filtre === a.id} onClick={() => setFiltre(a.id)}>
                {a.emoji} {a.nom}
              </Puce>
            ))}
          </div>
          {liste === undefined && <p className="text-sm text-gris">Chargement…</p>}
          {liste === null && <p className="text-sm text-gris">Les questions n’ont pas pu être chargées.</p>}
          {liste && visibles.length === 0 && (
            <Panneau>
              <p className="text-sm text-texte">
                Aucune question pour l’instant{filtre !== 'tous' ? ' dans cette catégorie' : ''}. Sois le premier ou
                la première à en poser une.
              </p>
            </Panneau>
          )}
          {visibles.map((q) => (
            <CarteQuestion key={q.id} q={q} />
          ))}
        </>
      )}
    </div>
  );
}

export function QuestionSeule({ id }: { id: string }) {
  const { partageEtat, aller } = useRev();
  const [q, setQ] = useState<QuestionPubliee | null | undefined>(undefined);
  useEffect(() => {
    if (partageEtat !== 'actif') return;
    void lireQuestion(id)
      .then(setQ)
      .catch(() => setQ(null));
  }, [id, partageEtat]);

  return (
    <div className="space-y-4">
      <button type="button" className="text-sm font-bold underline" onClick={() => aller('/questions')}>
        ← Toutes les questions
      </button>
      {partageEtat === 'verification' && <p className="text-sm text-gris">Chargement…</p>}
      {partageEtat === 'inactif' && (
        <Panneau>
          <p className="text-sm text-texte">Le recueil partagé ne répond pas pour le moment. Réessaie dans un instant.</p>
        </Panneau>
      )}
      {q === null && (
        <Panneau>
          <p className="text-sm text-texte">Cette question n’existe pas ou a été retirée par son auteur.</p>
        </Panneau>
      )}
      {q && q.signalements >= SEUIL_SIGNALEMENTS && !q.mienne && (
        <Panneau>
          <p className="text-sm text-texte">Cette question a été signalée plusieurs fois : elle est masquée en attendant d’être revue.</p>
        </Panneau>
      )}
      {q && (q.signalements < SEUIL_SIGNALEMENTS || q.mienne) && (
        <>
          <CarteQuestion q={q} seule />
          <BlocPartage id={q.id} texte={q.texte} />
        </>
      )}
    </div>
  );
}

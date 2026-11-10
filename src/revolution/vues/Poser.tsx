import { useEffect, useMemo, useState } from 'react';
import { useRev } from '../contexte';
import { AUTEURS, chargerActu, REGIONS } from '../donnees';
import { publierQuestion } from '../partage';
import type { NouvelleQuestion } from '../types';
import { GrosBouton, Panneau, Puce, Titre } from '../ui';
import { BlocPartage } from './Partager';

const CHOIX_TYPES: { nom: string; choix: string[] }[] = [
  { nom: 'Oui / Non', choix: ['Oui', 'Non', 'Sans avis'] },
  { nom: 'Pour / Contre', choix: ['Pour', 'Contre', 'Sans avis'] },
  { nom: 'Importance', choix: ['Beaucoup', 'Un peu', 'Pas du tout'] },
  { nom: 'Je choisis', choix: ['', '', ''] },
];

const MOTS_INTERDITS = ['connard', 'connasse', 'salope', 'encule', 'pute', 'nique', 'batard', 'pd'];

function parametre(nom: string): string | null {
  const q = window.location.hash.split('?')[1];
  return q ? new URLSearchParams(q).get(nom) : null;
}

export function Poser() {
  const { etat, modifier, partageEtat, aller } = useRev();
  const [auteurType, setAuteurType] = useState('syndicat');
  const [auteurNom, setAuteurNom] = useState('');
  const [texte, setTexte] = useState('');
  const [modele, setModele] = useState(0);
  const [choix, setChoix] = useState<string[]>(CHOIX_TYPES[0].choix);
  const [contexte, setContexte] = useState('');
  const [lien, setLien] = useState('');
  const [territoire, setTerritoire] = useState(etat.profil.region ?? 'national');
  const [charte, setCharte] = useState(false);
  const [envoi, setEnvoi] = useState<'repos' | 'envoi' | 'erreur'>('repos');
  const [publiee, setPubliee] = useState<string | null>(null);
  const [brouillonFait, setBrouillonFait] = useState(false);

  // Question posée « sur ce sujet » depuis une actualité : on reprend le lien et le titre.
  useEffect(() => {
    const id = parametre('sujet');
    if (!id) return;
    void chargerActu().then((a) => {
      const s = a?.sujets.find((x) => x.id === id);
      if (!s) return;
      setContexte(`À propos de : « ${s.titre} » (${s.source}).`.slice(0, 600));
      if (s.lien.startsWith('https://')) setLien(s.lien.slice(0, 300));
      if (s.region) setTerritoire(s.region);
    });
  }, []);

  const choixPropres = choix.map((c) => c.trim()).filter(Boolean);
  const nomPropre = auteurNom.trim();
  const textePropre = texte.trim().replace(/\s+/g, ' ');
  const lienPropre = lien.trim();

  const problemes = useMemo(() => {
    const p: string[] = [];
    if (nomPropre.length < 2) p.push('Indique qui pose la question (nom de l’organisation ou prénom).');
    if (textePropre.length < 10) p.push('La question doit faire au moins 10 caractères.');
    if (textePropre && !textePropre.endsWith('?')) p.push('Termine la question par un point d’interrogation.');
    if (choixPropres.length < 2) p.push('Il faut au moins deux réponses possibles.');
    if (new Set(choixPropres.map((c) => c.toLowerCase())).size !== choixPropres.length) p.push('Deux réponses sont identiques.');
    if (lienPropre && !/^https:\/\/\S+$/.test(lienPropre)) p.push('Le lien doit commencer par https://');
    const tout = `${nomPropre} ${textePropre} ${contexte} ${choixPropres.join(' ')}`
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
    if (MOTS_INTERDITS.some((m) => new RegExp(`(^|[^a-z])${m}([^a-z]|$)`).test(tout))) p.push('Pas d’insulte, s’il te plaît.');
    if (!charte) p.push('Coche la charte avant de publier.');
    return p;
  }, [nomPropre, textePropre, choixPropres, lienPropre, contexte, charte]);

  const question: NouvelleQuestion = {
    texte: textePropre,
    contexte: contexte.trim().slice(0, 600),
    choix: choixPropres.map((c) => c.slice(0, 40)),
    auteurType,
    auteurNom: nomPropre.slice(0, 80),
    territoire,
    lien: lienPropre.slice(0, 300),
  };

  const publier = async () => {
    setEnvoi('envoi');
    try {
      const id = await publierQuestion(question);
      if (!id) throw new Error('hors ligne');
      modifier((e) => ({ ...e, publiees: [id, ...e.publiees] }));
      setPubliee(id);
      setEnvoi('repos');
    } catch {
      setEnvoi('erreur');
    }
  };

  const garder = () => {
    modifier((e) => ({
      ...e,
      brouillons: [{ ...question, id: `b-${Date.now()}`, creeLe: new Date().toISOString() }, ...e.brouillons].slice(0, 20),
    }));
    setBrouillonFait(true);
  };

  if (publiee) {
    return (
      <div className="space-y-4">
        <Titre>Question publiée ✊</Titre>
        <Panneau accent="jaune" className="space-y-2">
          <p className="font-black text-texte">{question.texte}</p>
          <p className="text-sm text-gris">
            Partage-la : chaque personne qui ouvre le lien peut répondre en un geste. Les résultats se mettent à jour
            en direct sur la page de la question.
          </p>
        </Panneau>
        <BlocPartage id={publiee} texte={question.texte} />
        <div className="flex flex-wrap gap-2">
          <GrosBouton onClick={() => aller(`/q/${publiee}`)}>Voir la question et ses résultats</GrosBouton>
          <GrosBouton variante="neutre" onClick={() => window.location.reload()}>
            Poser une autre question
          </GrosBouton>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Titre>Poser une question</Titre>
      <p className="text-sm text-gris">
        Syndicat, association, collectif, élu ou simple citoyen : pose ta question, partage le lien, et recueille les
        réponses des gens.
      </p>

      {partageEtat === 'inactif' && (
        <Panneau accent="rouge">
          <p className="text-sm text-texte">
            La publication ouvrira dès l’activation du recueil partagé. En attendant, tu peux préparer ta question :
            elle restera sur cet appareil, prête à être publiée.
          </p>
        </Panneau>
      )}

      <Panneau className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-wide text-gris">Qui pose la question ?</p>
          <div className="grid grid-cols-2 gap-2">
            {AUTEURS.map((a) => (
              <Puce key={a.id} actif={auteurType === a.id} onClick={() => setAuteurType(a.id)}>
                {a.emoji} {a.nom}
              </Puce>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-gris">
            {auteurType === 'citoyen' ? 'Ton prénom ou pseudo' : 'Nom de l’organisation'}
          </span>
          <input
            value={auteurNom}
            maxLength={80}
            onChange={(e) => setAuteurNom(e.target.value)}
            placeholder={auteurType === 'syndicat' ? 'ex. : Union locale de Lunel' : auteurType === 'citoyen' ? 'ex. : Camille' : ''}
            className="mt-1 w-full rounded-xl border-[3px] border-bord bg-carte2 p-3 text-base text-texte outline-none focus:border-jaune"
          />
          <span className="mt-1 block text-[11px] text-gris">Il sera affiché avec la mention « nom déclaré, non vérifié ».</span>
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-gris">Ta question ({textePropre.length}/200)</span>
          <textarea
            value={texte}
            maxLength={200}
            rows={3}
            onChange={(e) => setTexte(e.target.value)}
            placeholder="ex. : Êtes-vous favorable à l’ouverture des commerces le dimanche dans votre ville ?"
            className="mt-1 w-full rounded-xl border-[3px] border-bord bg-carte2 p-3 text-base text-texte outline-none focus:border-jaune"
          />
          <span className="mt-1 block text-[11px] text-gris">
            Une question claire et neutre obtient plus de réponses : pas de mot qui pousse vers une réponse.
          </span>
        </label>

        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-wide text-gris">Réponses possibles</p>
          <div className="mb-2 flex flex-wrap gap-2">
            {CHOIX_TYPES.map((m, i) => (
              <Puce
                key={m.nom}
                actif={modele === i}
                onClick={() => {
                  setModele(i);
                  setChoix(m.choix);
                }}
              >
                {m.nom}
              </Puce>
            ))}
          </div>
          <div className="grid gap-2">
            {choix.map((c, i) => (
              <input
                key={i}
                value={c}
                maxLength={40}
                onChange={(e) => {
                  setModele(3);
                  setChoix((l) => l.map((x, k) => (k === i ? e.target.value : x)));
                }}
                placeholder={`Réponse ${i + 1}${i >= 2 ? ' (facultative)' : ''}`}
                className="w-full rounded-xl border-[3px] border-bord bg-carte2 p-3 text-base text-texte outline-none focus:border-jaune"
              />
            ))}
            {choix.length < 4 && (
              <button type="button" className="text-left text-sm font-bold underline" onClick={() => setChoix((l) => [...l, ''])}>
                + Ajouter une quatrième réponse
              </button>
            )}
          </div>
        </div>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-gris">Contexte (facultatif, {contexte.length}/600)</span>
          <textarea
            value={contexte}
            maxLength={600}
            rows={3}
            onChange={(e) => setContexte(e.target.value)}
            placeholder="Les faits utiles pour répondre, sans prendre parti."
            className="mt-1 w-full rounded-xl border-[3px] border-bord bg-carte2 p-3 text-base text-texte outline-none focus:border-jaune"
          />
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-gris">Lien vers une source (facultatif)</span>
          <input
            value={lien}
            maxLength={300}
            inputMode="url"
            onChange={(e) => setLien(e.target.value)}
            placeholder="https://"
            className="mt-1 w-full rounded-xl border-[3px] border-bord bg-carte2 p-3 text-base text-texte outline-none focus:border-jaune"
          />
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-gris">Qui est concerné ?</span>
          <select
            value={territoire}
            onChange={(e) => setTerritoire(e.target.value)}
            className="mt-1 w-full rounded-xl border-[3px] border-bord bg-carte2 p-3 text-base text-texte outline-none focus:border-jaune"
          >
            <option value="national">Toute la France</option>
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nom}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-start gap-3 rounded-xl border-2 border-bord p-3">
          <input type="checkbox" checked={charte} onChange={(e) => setCharte(e.target.checked)} className="mt-1 h-5 w-5" />
          <span className="text-sm text-texte">
            Je respecte la charte : pas d’insulte, pas d’attaque contre une personne nommée, pas de fausse information,
            pas d’appel à la haine. Je sais que ma question peut être retirée si elle est signalée.
          </span>
        </label>

        {problemes.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 text-sm text-gris">
            {problemes.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}

        {envoi === 'erreur' && (
          <p className="text-sm font-bold text-rouge">La publication a échoué. Vérifie ta connexion et réessaie.</p>
        )}

        <div className="flex flex-wrap gap-2">
          {partageEtat === 'actif' ? (
            <GrosBouton onClick={() => void publier()} disabled={problemes.length > 0 || envoi === 'envoi'}>
              {envoi === 'envoi' ? 'Publication…' : 'Publier ma question'}
            </GrosBouton>
          ) : (
            <GrosBouton onClick={garder} disabled={problemes.length > 0 || brouillonFait}>
              {brouillonFait ? 'Question gardée ✓' : 'Garder ma question pour plus tard'}
            </GrosBouton>
          )}
        </div>
        {brouillonFait && (
          <p className="text-sm text-gris">
            Elle est rangée dans « Questions », rubrique « Mes questions en attente ».
          </p>
        )}
      </Panneau>
    </div>
  );
}

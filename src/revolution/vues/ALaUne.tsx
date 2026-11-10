import { useEffect, useMemo, useRef, useState } from 'react';
import { useRev } from '../contexte';
import { chargerActu, classer, ilYa, momentDuJour, nomRegion, theme } from '../donnees';
import { lireCompteurs } from '../partage';
import type { Actu, SujetActu } from '../types';
import { Badge, Carres, GrosBouton, Panneau, Titre } from '../ui';

type Filtre = 'pour-toi' | 'region' | 'national' | 'repondu';

export function useCompteurs(id: string, actif: boolean, rafraichir = 0) {
  const { partageEtat } = useRev();
  const [c, setC] = useState<number[] | null>(null);
  useEffect(() => {
    if (!actif || partageEtat !== 'actif') return;
    let vivant = true;
    void lireCompteurs(id)
      .then((r) => vivant && setC(r))
      .catch(() => undefined);
    return () => {
      vivant = false;
    };
  }, [id, actif, partageEtat, rafraichir]);
  return c;
}

function CarteActu({ s }: { s: SujetActu }) {
  const { etat, repondre, aller, partageEtat } = useRev();
  const mienne = etat.reponses[s.id];
  const [tour, setTour] = useState(0);
  const compteurs = useCompteurs(s.id, Boolean(mienne), tour);

  const choisir = async (i: number) => {
    await repondre(s.id, i);
    setTour((t) => t + 1);
  };

  return (
    <Panneau className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {s.themes.slice(0, 2).map((t) => (
          <Badge key={t}>
            {theme(t)?.emoji} {theme(t)?.nom}
          </Badge>
        ))}
        <Badge ton={s.region ? 'jaune' : 'gris'}>{s.region ? `📍 ${nomRegion(s.region)}` : '🇫🇷 National'}</Badge>
      </div>
      <h3 className="text-lg font-black leading-snug text-texte">{s.titre}</h3>
      {s.resume && <p className="text-sm text-gris">{s.resume}</p>}
      <p className="text-xs text-gris">
        {s.source} · {ilYa(s.date)} ·{' '}
        <a href={s.lien} target="_blank" rel="noreferrer" className="font-bold text-jaune underline">
          Lire l’article ↗
        </a>
      </p>

      <div className="rounded-xl border-2 border-bord bg-carte p-3">
        <p className="mb-2 text-sm font-black text-texte">{s.question}</p>
        <Carres choix={s.choix} monChoix={mienne?.choix ?? null} compteurs={compteurs} onChoisir={(i) => void choisir(i)} />
        {mienne && (partageEtat !== 'actif' || !mienne.comptee) && (
          <p className="mt-2 text-xs text-gris">
            Ta réponse est notée sur cet appareil.
            {partageEtat === 'inactif' && ' Les résultats de tous s’afficheront dès l’ouverture du recueil partagé.'}
          </p>
        )}
        {!mienne && <p className="mt-2 text-[11px] text-gris">Le titre ne dit pas tout : lis l’article avant de répondre.</p>}
      </div>

      <button
        type="button"
        onClick={() => aller(`/poser?sujet=${encodeURIComponent(s.id)}`)}
        className="text-sm font-bold text-texte underline"
      >
        ✍️ Poser ma propre question sur ce sujet
      </button>
    </Panneau>
  );
}

export function ALaUne() {
  const { etat, aller, modifier } = useRev();
  const [actu, setActu] = useState<Actu | null | undefined>(undefined);
  const [filtre, setFiltre] = useState<Filtre>('pour-toi');
  const [combien, setCombien] = useState(12);

  useEffect(() => {
    void chargerActu().then(setActu);
  }, []);

  // Les réponses données AVANT l'ouverture de la page : une carte à laquelle on vient de
  // répondre reste à sa place (on voit le résultat), elle ne passera en dessous qu'à la
  // prochaine visite.
  const reponsesAvant = useRef(etat.reponses);
  const liste = useMemo(() => {
    if (!actu) return [];
    const tous = classer(actu.sujets, etat.profil, reponsesAvant.current);
    if (filtre === 'repondu') return tous.filter((s) => etat.reponses[s.id]);
    const ouverts = tous.filter((s) => !reponsesAvant.current[s.id]);
    if (filtre === 'region') return ouverts.filter((s) => etat.profil.region && s.region === etat.profil.region);
    if (filtre === 'national') return ouverts.filter((s) => !s.region);
    return ouverts;
  }, [actu, etat.profil, etat.reponses, filtre]);


  const sansProfil = !etat.profil.region && etat.profil.themes.length === 0;

  return (
    <div className="space-y-4">
      {!etat.bienvenueVue && (
        <Panneau accent="jaune" className="space-y-2">
          <p className="affiche text-lg text-jaune">Révolution repart de zéro.</p>
          <p className="text-sm text-texte">
            Ici, pas de faux votes : chaque question vient de l’actualité du jour ou d’une organisation qui veut
            connaître ton avis. Tu réponds en un geste, les résultats s’affichent ensuite.
          </p>
          <div className="flex flex-wrap gap-2">
            <GrosBouton onClick={() => aller('/pour-toi')}>Choisir ma région et mes sujets</GrosBouton>
            <GrosBouton variante="neutre" onClick={() => modifier((e) => ({ ...e, bienvenueVue: true }))}>
              Plus tard
            </GrosBouton>
          </div>
        </Panneau>
      )}

      <Titre
        droite={
          actu ? (
            <span className="text-[11px] text-gris">mis à jour {ilYa(actu.genereLe)} · toutes les 3 h</span>
          ) : undefined
        }
      >
        {momentDuJour()}, {sansProfil ? 'l’actualité' : 'pour toi'}
      </Titre>

      {!sansProfil && (
        <p className="text-xs text-gris">
          Classé pour toi : {etat.profil.region ? `📍 ${nomRegion(etat.profil.region)}` : 'toute la France'}
          {etat.profil.themes.length > 0 && ` · ${etat.profil.themes.map((t) => theme(t)?.emoji).join(' ')}`} ·{' '}
          <button type="button" className="underline" onClick={() => aller('/pour-toi')}>
            changer
          </button>
        </p>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
        {(
          [
            ['pour-toi', 'Pour toi'],
            ['region', 'Ma région'],
            ['national', 'National'],
            ['repondu', `Déjà répondu (${actu ? actu.sujets.filter((s) => etat.reponses[s.id]).length : 0})`],
          ] as [Filtre, string][]
        ).map(([id, nom]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={filtre === id}
            onClick={() => {
              setFiltre(id);
              setCombien(12);
            }}
            className={`shrink-0 rounded-xl border-[3px] px-3 py-2 text-sm font-black ${
              filtre === id ? 'border-jaune bg-jaune text-black' : 'border-bord bg-carte2 text-texte'
            }`}
          >
            {nom}
          </button>
        ))}
      </div>

      {actu === undefined && <p className="text-sm text-gris">Chargement de l’actualité…</p>}

      {actu === null && (
        <Panneau>
          <p className="text-sm text-texte">
            L’actualité n’a pas encore été récoltée pour cette version. Elle est mise à jour automatiquement toutes les
            trois heures : reviens un peu plus tard, ou pose dès maintenant ta propre question.
          </p>
        </Panneau>
      )}

      {actu && liste.length === 0 && (
        <Panneau>
          <p className="text-sm text-texte">
            {filtre === 'region' && !etat.profil.region
              ? 'Choisis ta région dans « Pour toi » pour voir l’actualité près de chez toi.'
              : filtre === 'repondu'
                ? 'Tu n’as encore répondu à aucune question.'
                : actu.sujets.length === 0
                  ? 'Aucune actualité n’a pu être récoltée lors de la dernière mise à jour. Nouvel essai dans moins de trois heures.'
                  : 'Tu as répondu à tout ce qui est paru ici. Les prochaines questions arrivent avec la prochaine mise à jour.'}
          </p>
        </Panneau>
      )}

      {liste.slice(0, combien).map((s) => (
        <CarteActu key={s.id} s={s} />
      ))}

      {liste.length > combien && (
        <GrosBouton variante="neutre" className="w-full" onClick={() => setCombien((n) => n + 12)}>
          Voir {Math.min(12, liste.length - combien)} sujets de plus
        </GrosBouton>
      )}
    </div>
  );
}

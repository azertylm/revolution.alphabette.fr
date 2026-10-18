import { useState } from 'react';
import { AffichePartage } from '../composants/AffichePartage';
import { BlocQuestion } from '../composants/CarresVote';
import { CurseursBudget } from '../composants/CurseursBudget';
import { MiniForum } from '../composants/MiniForum';
import { Resultats } from '../composants/Resultats';
import { categorie } from '../categories';
import { useRevolution } from '../contexte';
import { dejaVote, peutVoterSur } from '../etat';
import { scoreSujet } from '../moteur';
import { useNav } from '../navigation';
import { REGLAGES } from '../reglages';
import { emojiNiveau } from '../regions';
import { nombre, pct, raisonPoidsNul } from '../outils';
import { Badge, Etiquette, GrosBouton, Jauge, Panneau, TitreSection } from '../ui';

/* ==========================================================================
   LE SUJET — onglets en défilement horizontal, gros carrés de vote, chiffres
   énormes. Sur téléphone : une colonne, tout au pouce. Sur tablette/PC :
   la même chose en plus large, deux colonnes pour les résultats.
   ========================================================================== */

type Onglet = 'voter' | 'budget' | 'resultats' | 'section' | 'partager';

const ONGLETS: { id: Onglet; label: string }[] = [
  { id: 'voter', label: '🗳️ Voter' },
  { id: 'budget', label: '💰 Où investir' },
  { id: 'resultats', label: '📊 Résultats' },
  { id: 'section', label: '💬 Section' },
  { id: 'partager', label: '📣 Partager' },
];

export function VueSujet() {
  const { etat, agir } = useRevolution();
  const nav = useNav();
  const [onglet, setOnglet] = useState<Onglet>('voter');
  const [signale, setSignale] = useState(false);

  const sujet = etat.sujets.find((s) => s.id === nav.sujetId);
  if (!sujet) {
    return (
      <Panneau>
        <p className="text-sm text-gris">Sujet introuvable.</p>
        <div className="mt-3">
          <GrosBouton variante="neutre" onClick={() => nav.aller({ vue: 'accueil' })}>
            ← Retour à l’accueil
          </GrosBouton>
        </div>
      </Panneau>
    );
  }

  const votable = peutVoterSur(etat, sujet);
  const votesFaits = dejaVote(etat, sujet.id);
  const exigencesSujet = sujet.questions.filter((q) => q.etat === 'exigence').length;
  const regionsSoutenantes = sujet.regionsSoutenantes.length;
  const oui = sujet.questions.reduce((acc, q) => acc + q.oui, 0);
  const non = sujet.questions.reduce((acc, q) => acc + q.non, 0);
  const sans = sujet.questions.reduce((acc, q) => acc + q.sansAvis, 0);
  const ouiPct = oui + non + sans > 0 ? (oui / (oui + non + sans)) * 100 : 0;

  return (
    <div className="space-y-4">
      <button type="button" onClick={() => nav.aller({ vue: 'accueil' })} className="affiche text-xs text-gris">
        ← Tous les sujets
      </button>

      {/* ------------------------------- L'AFFICHE DU SUJET ----------------------- */}
      <header className="bloc ombre-dure overflow-hidden p-0">
        <div className="flex items-end gap-3 border-b-[3px] border-jaune bg-carte2 p-4">
          <span className="text-6xl leading-none" aria-hidden>
            {sujet.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="affiche text-3xl text-texte sm:text-4xl">{sujet.nom}</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Etiquette>
                {categorie(sujet.categorie).emoji} {categorie(sujet.categorie).nom}
              </Etiquette>
              <Etiquette>
                {emojiNiveau(sujet.niveau)} {sujet.niveau === 'national' ? 'Toute la France' : sujet.territoire}
              </Etiquette>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x-[3px] divide-bord border-b-[3px] border-bord bg-carte">
          <div className="px-2 py-3 text-center">
            <p className="affiche-large text-3xl text-jaune sm:text-4xl">{Math.round(ouiPct)}%</p>
            <p className="text-[10px] font-black uppercase tracking-wide text-gris">de OUI</p>
          </div>
          <div className="px-2 py-3 text-center">
            <p className="affiche-large text-3xl text-texte sm:text-4xl">{nombre(sujet.votants)}</p>
            <p className="text-[10px] font-black uppercase tracking-wide text-gris">votants</p>
          </div>
          <div className="px-2 py-3 text-center">
            <p className="affiche-large text-3xl text-rouge sm:text-4xl">{exigencesSujet}</p>
            <p className="text-[10px] font-black uppercase tracking-wide text-gris">exigences</p>
          </div>
        </div>

        <div className="space-y-3 p-4">
          <p className="text-sm text-texte">« {sujet.probleme} »</p>
          <Jauge oui={oui} non={non} sansAvis={sans} hauteur={30} />
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-black uppercase tracking-wide text-gris">
            <span>score de soutien {nombre(scoreSujet(sujet))}</span>
            <span>
              {votesFaits}/5 votés {votesFaits >= 5 ? '✅' : ''}
            </span>
          </div>

          {!votable.ok && (
            <p className="hachures rounded-xl border-[3px] border-rouge p-3 text-xs font-black text-texte">
              {raisonPoidsNul(sujet.categorie, sujet.niveau)}
            </p>
          )}

          {regionsSoutenantes >= 1 && (
            <div className="rounded-xl border-2 border-bord bg-carte2 p-3">
              <p className="affiche text-xs text-texte">
                🗺️ Soutien régional : {regionsSoutenantes}/5 régions
                {regionsSoutenantes >= 5 ? ' — sujet proposé au vote national' : ' pour devenir national'}
              </p>
              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-bord">
                <div className="h-full bg-jaune" style={{ width: `${Math.min(100, (regionsSoutenantes / 5) * 100)}%` }} />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* --------------------------------- LES ONGLETS ---------------------------- */}
      <nav className="defile-x sticky top-0 z-20 -mx-3 bg-fond/95 px-3 py-2 backdrop-blur">
        {ONGLETS.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setOnglet(o.id)}
            className={`affiche min-h-[3rem] rounded-xl border-[3px] px-4 py-2 text-xs ${
              onglet === o.id ? 'border-jaune bg-jaune text-black' : 'border-bord bg-carte text-gris'
            }`}
          >
            {o.label}
          </button>
        ))}
      </nav>

      {/* ---------------------------------- VOTER --------------------------------- */}
      {onglet === 'voter' && (
        <div className="space-y-4">
          <Panneau accent="jaune">
            <p className="affiche text-sm text-texte">
              5 questions, 3 carrés chacune. Le pourcentage affiché dans chaque carré est celui des autres votants.
            </p>
            <p className="mt-1 text-[11px] text-gris">
              Réponds aux 5 : les curseurs de budget s’ouvrent juste après. Un vote par question et par cycle, modifiable
              jusqu’à la Refonte.
            </p>
          </Panneau>

          {sujet.questions.map((q, i) => (
            <BlocQuestion key={q.id} sujet={sujet} question={q} numero={i + 1} total={sujet.questions.length} />
          ))}

          <GrosBouton
            variante={votesFaits >= 5 ? 'jaune' : 'neutre'}
            disabled={votesFaits < 5}
            onClick={() => setOnglet('budget')}
            titre={votesFaits < 5 ? 'Réponds d’abord aux 5 questions' : undefined}
            className="w-full"
          >
            {votesFaits >= 5 ? '💰 Passer à « Où investir »' : `${5 - votesFaits} question(s) restante(s)`}
          </GrosBouton>

          <Panneau>
            <p className="text-[11px] text-gris">
              Anti-fraude sans surveillance : aucune IP, aucun traçage. Trois signalements de pairs suffisent à archiver
              un contenu suspect — et les votes déjà exprimés restent publics.
            </p>
            <div className="mt-3">
              {signale ? (
                <Badge ton="jaune">Signalement transmis aux pairs</Badge>
              ) : (
                <GrosBouton
                  variante="neutre"
                  onClick={() => {
                    if (!etat.citoyen) {
                      nav.demanderIdentite('Seule une identité citoyenne peut signaler un contenu.');
                      return;
                    }
                    agir({ type: 'signaler', sujetId: sujet.id, motif: 'contenu suspect' });
                    setSignale(true);
                  }}
                >
                  ⚠️ Signaler ce sujet ou un vote suspect
                </GrosBouton>
              )}
            </div>
          </Panneau>
        </div>
      )}

      {/* --------------------------------- BUDGET --------------------------------- */}
      {onglet === 'budget' && (
        <div className="space-y-3">
          {votesFaits < 5 ? (
            <Panneau>
              <p className="text-sm text-texte">
                Les curseurs ne s’ouvrent qu’une fois les 5 questions répondues : seules les mesures que tu approuves
                peuvent recevoir des points.
              </p>
              <div className="mt-3">
                <GrosBouton onClick={() => setOnglet('voter')}>🗳️ Revenir aux questions</GrosBouton>
              </div>
            </Panneau>
          ) : (
            <CurseursBudget sujet={sujet} />
          )}
        </div>
      )}

      {onglet === 'resultats' && <Resultats sujet={sujet} />}
      {onglet === 'section' && <MiniForum sujet={sujet} />}
      {onglet === 'partager' && <AffichePartage sujet={sujet} />}

      {onglet !== 'partager' && (
        <Panneau>
          <TitreSection>📣 Faire voter les autres</TitreSection>
          <p className="text-xs text-gris">
            Une affiche prête à partager et un lien court qui compte les votants que tu as amenés.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <GrosBouton variante="neutre" onClick={() => setOnglet('partager')}>
              Ouvrir l’affiche
            </GrosBouton>
            {etat.partages[sujet.id] && (
              <span className="affiche text-xs text-jaune">
                {nombre(etat.partages[sujet.id].votes)} votants amenés · {pct(100)} public
              </span>
            )}
          </div>
          <p className="mt-2 text-[11px] text-gris">
            Seuil d’exigence : {REGLAGES.consensusExigence} % de OUI. Alerte de bascule : {REGLAGES.seuilBascule} %.
          </p>
        </Panneau>
      )}
    </div>
  );
}

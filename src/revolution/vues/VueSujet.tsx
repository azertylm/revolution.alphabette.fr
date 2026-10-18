import { useState } from 'react';
import { AffichePartage } from '../composants/AffichePartage';
import { CurseursBudget } from '../composants/CurseursBudget';
import { MiniForum } from '../composants/MiniForum';
import { Resultats } from '../composants/Resultats';
import { useRevolution } from '../contexte';
import { dejaVote, peutVoterSur } from '../etat';
import { scoreSujet } from '../moteur';
import { useNav } from '../navigation';
import { categorie } from '../categories';
import { emojiNiveau, nomRegion } from '../regions';
import type { Question } from '../types';
import { nombre, pct, raisonPoidsNul, statsQuestion } from '../outils';
import { Badge, Etiquette, GrosBouton, JaugeQuestion, Panneau, TitreSection } from '../ui';

type Onglet = 'voter' | 'budget' | 'resultats' | 'section' | 'partager';

const ONGLETS: { id: Onglet; label: string }[] = [
  { id: 'voter', label: '🗳️ Voter' },
  { id: 'budget', label: '💰 Où investir ?' },
  { id: 'resultats', label: '📊 Résultats' },
  { id: 'section', label: '💬 Section' },
  { id: 'partager', label: '📣 Partager' },
];

/** Un vote : trois gros boutons, rien d'autre. */
function BlocVote({ sujetId, question }: { sujetId: string; question: Question }) {
  const { etat, agir } = useRevolution();
  const nav = useNav();
  const cle = `${sujetId}:${question.id}`;
  const monVote = etat.mesVotes[cle] ?? null;
  const st = statsQuestion(question);
  const desactive = question.etat === 'ecartee';

  const voter = (choix: 'oui' | 'non' | 'sans-avis') => {
    if (!etat.citoyen) {
      nav.demanderIdentite('Pour voter, il faut une identité citoyenne — 15 secondes, pseudo et code PIN.');
      return;
    }
    agir({ type: 'voter', sujetId, questionId: question.id, choix });
  };

  const choix: { id: 'oui' | 'non' | 'sans-avis'; texte: string; classe: string }[] = [
    { id: 'oui', texte: '✅ OUI', classe: monVote === 'oui' ? 'bg-jaune text-black' : 'bg-carte2 text-jaune border border-jaune' },
    { id: 'non', texte: '❌ NON', classe: monVote === 'non' ? 'bg-rouge text-white' : 'bg-carte2 text-rouge border border-rouge' },
    {
      id: 'sans-avis',
      texte: '🤷 Sans avis',
      classe: monVote === 'sans-avis' ? 'bg-bord text-texte' : 'bg-carte2 text-gris border border-bord',
    },
  ];

  return (
    <div className={`rounded-2xl border border-bord bg-carte p-4 ${desactive ? 'opacity-60' : ''}`}>
      <p className="affiche text-base text-texte sm:text-lg">{question.texte}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Etiquette>{question.poste}</Etiquette>
        {question.etat === 'exigence' && <Badge ton="rouge">✊ Exigence du peuple</Badge>}
        {question.etat === 'ecartee' && <Badge ton="gris">🚫 Écartée par le peuple</Badge>}
        {monVote && <Badge ton="jaune">Ton vote : {monVote === 'sans-avis' ? 'sans avis' : monVote.toUpperCase()}</Badge>}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {choix.map((c) => (
          <button
            key={c.id}
            type="button"
            disabled={desactive}
            onClick={() => voter(c.id)}
            className={`affiche rounded-2xl px-4 py-5 text-lg transition disabled:cursor-not-allowed ${c.classe}`}
          >
            {c.texte}
          </button>
        ))}
      </div>

      {st.total > 0 && (
        <div className="mt-3">
          <JaugeQuestion question={question} compact />
        </div>
      )}
      {!desactive && (
        <p className="mt-2 text-[11px] text-gris">
          Modifiable jusqu’à la prochaine Refonte ; compté une seule fois au top horaire.
        </p>
      )}
    </div>
  );
}

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

  return (
    <div className="space-y-4">
      <button type="button" onClick={() => nav.aller({ vue: 'accueil' })} className="text-xs font-bold text-gris">
        ← Tous les sujets
      </button>

      <header className="rounded-2xl border border-bord bg-carte p-4">
        <div className="flex items-start gap-3">
          <span className="text-4xl">{sujet.emoji}</span>
          <div className="flex-1">
            <h2 className="affiche text-2xl text-texte sm:text-4xl">{sujet.nom}</h2>
            <p className="mt-1 text-sm text-gris">« {sujet.probleme} »</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Etiquette>
                {categorie(sujet.categorie).emoji} {categorie(sujet.categorie).nom}
              </Etiquette>
              <Etiquette>
                {emojiNiveau(sujet.niveau)} {sujet.niveau === 'national' ? 'France entière' : sujet.territoire}
              </Etiquette>
              <Etiquette>{nombre(sujet.votants)} votants</Etiquette>
              <Etiquette>score {nombre(scoreSujet(sujet))}</Etiquette>
              {exigencesSujet > 0 && <Badge ton="rouge">✊ {exigencesSujet} exigence(s)</Badge>}
              {votesFaits > 0 && <Badge ton="jaune">Tu as voté {votesFaits}/5</Badge>}
            </div>
          </div>
        </div>

        {!votable.ok && (
          <p className="mt-3 rounded-xl border border-rouge/40 bg-rouge/10 p-3 text-xs font-bold text-rouge">
            {raisonPoidsNul(sujet.categorie, sujet.niveau)}
          </p>
        )}

        {regionsSoutenantes >= 1 && (
          <div className="mt-3 rounded-xl border border-bord bg-carte2 p-3">
            <p className="text-xs font-bold text-texte">
              🗺️ Soutien régional : {regionsSoutenantes}/5 régions nécessaires à une proposition nationale
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-bord">
              <div className="h-full bg-jaune" style={{ width: `${Math.min(100, (regionsSoutenantes / 5) * 100)}%` }} />
            </div>
            {regionsSoutenantes >= 5 && (
              <p className="mt-2 text-xs font-bold text-jaune">
                Ce problème existe partout : le sujet est proposé au vote national.
              </p>
            )}
          </div>
        )}
      </header>

      <nav className="flex flex-wrap gap-2">
        {ONGLETS.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setOnglet(o.id)}
            className={`affiche rounded-xl px-3 py-2 text-xs ${
              onglet === o.id ? 'bg-jaune text-black' : 'border border-bord bg-carte text-gris'
            }`}
          >
            {o.label}
          </button>
        ))}
      </nav>

      {onglet === 'voter' && (
        <div className="space-y-3">
          <Panneau accent="jaune">
            <p className="text-sm text-texte">
              5 questions, 3 réponses possibles. Réponds aux 5 : l’étape <strong>« Où investir ? »</strong> débloque
              alors les curseurs de budget.
            </p>
            <p className="mt-1 text-[11px] text-gris">
              Question régionalisée : c’est ta région ({etat.citoyen ? nomRegion(etat.citoyen.region) : 'Occitanie'}) qui
              vote, et ses résultats s’affichent à côté de la moyenne France.
            </p>
          </Panneau>
          {sujet.questions.map((q) => (
            <BlocVote key={q.id} sujetId={sujet.id} question={q} />
          ))}

          <div className="flex flex-wrap items-center gap-2">
            <GrosBouton
              variante={votesFaits >= 5 ? 'jaune' : 'neutre'}
              onClick={() => setOnglet('budget')}
              disabled={votesFaits < 5}
              titre={votesFaits < 5 ? 'Vote d’abord les 5 questions' : undefined}
            >
              💰 Passer à « Où investir ? »
            </GrosBouton>
            <span className="text-[11px] text-gris">{5 - votesFaits > 0 ? `${5 - votesFaits} question(s) restante(s)` : 'Les 5 questions sont votées.'}</span>
          </div>

          <Panneau>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] text-gris">
                Anti-fraude sans surveillance : aucune IP, aucun traçage. Signalement par les pairs — 3 votes de
                validation citoyenne suffisent à archiver un contenu suspect.
              </p>
              <div className="flex flex-wrap gap-2">
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
                    ⚠️ Signaler un sujet ou un vote suspect
                  </GrosBouton>
                )}
              </div>
            </div>
          </Panneau>
        </div>
      )}

      {onglet === 'budget' && (
        <div className="space-y-3">
          {votesFaits < 5 ? (
            <Panneau>
              <p className="text-sm text-texte">
                Termine d’abord les 5 questions : les curseurs ne s’ouvrent que sur les mesures que tu as approuvées.
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
            Une affiche prête à partager, un lien court, et le compteur public des votes que ton partage a apportés.
          </p>
          <div className="mt-3">
            <GrosBouton variante="neutre" onClick={() => setOnglet('partager')}>
              Ouvrir l’affiche de partage
            </GrosBouton>
          </div>
          {etat.partages[sujet.id] && (
            <p className="mt-2 text-xs font-bold text-jaune">
              Ton lien a fait voter {nombre(etat.partages[sujet.id].votes)} personnes (
              {pct(100)} de visibilité publique sur ce sujet).
            </p>
          )}
        </Panneau>
      )}
    </div>
  );
}

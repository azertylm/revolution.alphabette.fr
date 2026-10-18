import { useRevolution } from '../contexte';
import { dejaVote } from '../etat';
import { MOBILISES_DU_MOIS } from '../donnees';
import { exigences, statsGlobales } from '../moteur';
import { useNav } from '../navigation';
import { REGIONS, nomRegion } from '../regions';
import { dateLisible, nombre, pct } from '../outils';
import { Badge, Etiquette, GrosBouton, Panneau, TitreSection } from '../ui';

/* ==========================================================================
   👤 Le profil minimal : pseudo, badge, région, une phrase.
   Et les réglages : notifications, mode discret, cycle accéléré, remise à zéro.
   Aucun historique comportemental, aucune donnée revendue.
   ========================================================================== */

export function Profil() {
  const { etat, agir } = useRevolution();
  const nav = useNav();
  const citoyen = etat.citoyen;
  const stats = statsGlobales(etat);
  const mesVotes = Object.keys(etat.mesVotes).length;
  const mesBudgets = Object.keys(etat.mesBudgets).length;
  const mesSignalements = etat.mesSignalements.length;

  if (!citoyen) {
    return (
      <div className="space-y-4">
        <Panneau accent="jaune">
          <TitreSection>👤 Tu n’es pas encore identifié</TitreSection>
          <p className="text-sm text-texte">
            Un pseudo, un code PIN à 4 chiffres, ta région. C’est tout — et ça suffit pour voter.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <GrosBouton onClick={() => nav.demanderIdentite('Un humain = un vote.')}>✊ Je suis le peuple</GrosBouton>
          </div>
        </Panneau>

        <Panneau>
          <TitreSection>📊 Transparence publique</TitreSection>
          <ul className="space-y-1 text-xs text-gris">
            <li>Citoyens actifs : {nombre(stats.citoyensActifs)}</li>
            <li>Votes exprimés : {nombre(stats.votesTotaux)}</li>
            <li>Exigences déposées : {nombre(stats.exigencesPresentees)}</li>
            <li>Réponses de l’État : {pct(stats.reponseEtat)}</li>
            <li>Satisfaction du peuple : {pct(stats.satisfactionPeuple)}</li>
          </ul>
        </Panneau>
      </div>
    );
  }

  const badgeTexte =
    citoyen.badge === 'verifie' ? '✔ Citoyen vérifié' : citoyen.badge === 'jeune' ? '🌱 Jeune citoyen' : 'Citoyen';

  return (
    <div className="space-y-5">
      <Panneau accent="jaune">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gris">Mon profil</p>
            <p className="affiche text-3xl text-texte">{citoyen.pseudo}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge ton={citoyen.badge === 'verifie' ? 'rouge' : citoyen.badge === 'jeune' ? 'vert' : 'jaune'}>
                {badgeTexte}
              </Badge>
              <Etiquette>🗺️ {nomRegion(citoyen.region)}</Etiquette>
              {citoyen.modeDiscret && <Etiquette>🕶️ mode discret</Etiquette>}
              <Etiquette>Depuis {dateLisible(new Date(Date.now() - 32 * 86400000).toISOString())}</Etiquette>
            </div>
            {citoyen.phrase && <p className="mt-2 text-sm italic text-gris">« {citoyen.phrase} »</p>}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-4">
            <div className="rounded-xl border border-bord bg-carte2 px-3 py-2">
              <p className="affiche text-lg text-jaune">{mesVotes}</p>
              <p className="text-[10px] font-bold uppercase text-gris">votes</p>
            </div>
            <div className="rounded-xl border border-bord bg-carte2 px-3 py-2">
              <p className="affiche text-lg text-jaune">{mesBudgets}</p>
              <p className="text-[10px] font-bold uppercase text-gris">budgets</p>
            </div>
            <div className="rounded-xl border border-bord bg-carte2 px-3 py-2">
              <p className="affiche text-lg text-texte">{mesSignalements}</p>
              <p className="text-[10px] font-bold uppercase text-gris">signalements</p>
            </div>
            <div className="rounded-xl border border-bord bg-carte2 px-3 py-2">
              <p className="affiche text-lg text-rouge">
                {etat.sujets.filter((s) => s.statut === 'officiel' && dejaVote(etat, s.id) > 0).length}
              </p>
              <p className="text-[10px] font-bold uppercase text-gris">sujets suivis</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {citoyen.badge === 'citoyen' && (
            <GrosBouton
              variante="rouge"
              onClick={() => agir({ type: 'profil', changement: { badge: 'verifie' } })}
              titre="Vérification humaine ultra-légère : déclaration sur l’honneur, code envoyé par email ou SMS."
            >
              ✔ Devenir citoyen vérifié
            </GrosBouton>
          )}
          {citoyen.badge === 'jeune' && (
            <Badge ton="vert">
              🌱 Poids 1 sur les sujets scolaires et environnementaux, 0 sur les sujets fédéraux
            </Badge>
          )}
          <GrosBouton
            variante="neutre"
            onClick={() => agir({ type: 'profil', changement: { modeDiscret: !citoyen.modeDiscret } })}
          >
            {citoyen.modeDiscret ? '👁️ Sortir du mode discret' : '🕶️ Activer le mode discret'}
          </GrosBouton>
        </div>
      </Panneau>

      <Panneau>
        <TitreSection>✏️ Modifier mes informations</TitreSection>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wide text-gris">Pseudo</span>
            <input
              value={citoyen.pseudo}
              maxLength={24}
              onChange={(e) => agir({ type: 'profil', changement: { pseudo: e.target.value } })}
              className="mt-1 w-full rounded-xl border border-bord bg-carte2 p-3 text-sm text-texte outline-none focus:border-jaune"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wide text-gris">Région (questions régionalisées)</span>
            <select
              value={citoyen.region}
              onChange={(e) => agir({ type: 'profil', changement: { region: e.target.value } })}
              className="mt-1 w-full rounded-xl border border-bord bg-carte2 p-3 text-sm text-texte outline-none focus:border-jaune"
            >
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nom}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-[11px] font-bold uppercase tracking-wide text-gris">
              Présentation (facultatif, 140 caractères)
            </span>
            <input
              value={citoyen.phrase}
              maxLength={140}
              onChange={(e) => agir({ type: 'profil', changement: { phrase: e.target.value } })}
              className="mt-1 w-full rounded-xl border border-bord bg-carte2 p-3 text-sm text-texte outline-none focus:border-jaune"
            />
          </label>
        </div>
        <p className="mt-3 text-[11px] text-gris">
          Le pseudo n’est jamais modifiable dans les historiques publics — une trace ne se réécrit pas. Le mode discret
          l’affiche comme « Citoyen #… » dans les classements.
        </p>
      </Panneau>

      <Panneau>
        <TitreSection>⚙️ Réglages de l’application</TitreSection>
        <ul className="space-y-2">
          <li className="flex items-center justify-between gap-3 rounded-xl border border-bord bg-carte2 px-3 py-2">
            <span className="text-sm text-texte">🔔 Notifications (3 interrupteurs)</span>
            <GrosBouton variante="neutre" onClick={() => nav.aller({ vue: 'notifications' })}>
              Ouvrir le centre
            </GrosBouton>
          </li>
          <li className="flex items-center justify-between gap-3 rounded-xl border border-bord bg-carte2 px-3 py-2">
            <span className="text-sm text-texte">⏩ Cycle accéléré (60 s au lieu d’une heure)</span>
            <button
              type="button"
              onClick={() => agir({ type: 'cycle-accelere', actif: !etat.cycleAccelere })}
              className={`affiche rounded-lg px-3 py-1 text-xs ${
                etat.cycleAccelere ? 'bg-jaune text-black' : 'border border-bord bg-carte text-gris'
              }`}
            >
              {etat.cycleAccelere ? 'Activé' : 'Coupé'}
            </button>
          </li>
        </ul>
        <p className="mt-3 text-[11px] text-gris">
          Les seuils du moteur sont réglables dans le code (src/revolution/reglages.ts) :{' '}
          {nombre(10)} validations, {nombre(10)} rejets, consensus à 66 %, ratio de ressemblance à 80 %, budget de 100
          points, verrouillage du cahier à 18 h.
        </p>
      </Panneau>

      <Panneau>
        <TitreSection>📊 Transparence publique</TitreSection>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-bord bg-carte2 px-3 py-2">
            <p className="text-[10px] font-bold uppercase text-gris">Citoyens actifs</p>
            <p className="affiche text-lg text-jaune">{nombre(stats.citoyensActifs)}</p>
          </div>
          <div className="rounded-xl border border-bord bg-carte2 px-3 py-2">
            <p className="text-[10px] font-bold uppercase text-gris">Réponses de l’État</p>
            <p className="affiche text-lg text-rouge">{pct(stats.reponseEtat)}</p>
          </div>
          <div className="rounded-xl border border-bord bg-carte2 px-3 py-2">
            <p className="text-[10px] font-bold uppercase text-gris">Satisfaction du peuple</p>
            <p className="affiche text-lg text-jaune">{pct(stats.satisfactionPeuple)}</p>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-gris">
          {nombre(exigences(etat).length)} exigences au cahier, {nombre(stats.votesTotaux)} votes publics, aucun
          historique comportemental. Le peuple garde la trace, personne ne garde la trace du peuple.
        </p>
      </Panneau>

      <Panneau>
        <TitreSection>🏆 Mobilisés du mois</TitreSection>
        <ul className="space-y-2">
          {MOBILISES_DU_MOIS.map((m, i) => (
            <li key={m.pseudo} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2">
                <span className="affiche w-6 text-jaune">{i + 1}</span>
                <span className="font-bold">{citoyen.modeDiscret && i === 3 ? 'Citoyen #•••••' : m.pseudo}</span>
                {m.badge === 'verifie' && <Badge ton="rouge">✔ vérifié</Badge>}
                {m.badge === 'jeune' && <Badge ton="vert">🌱 jeune</Badge>}
              </span>
              <span className="text-[11px] font-bold text-gris">{nombre(m.votes)} votants amenés</span>
            </li>
          ))}
        </ul>
      </Panneau>

      <Panneau>
        <TitreSection>🗑️ Zone de sortie</TitreSection>
        <div className="flex flex-wrap gap-2">
          <GrosBouton variante="neutre" onClick={() => agir({ type: 'citoyen', citoyen: null })}>
            Se déconnecter
          </GrosBouton>
          <GrosBouton
            variante="rouge"
            onClick={() => {
              if (window.confirm('Remettre le prototype à zéro ? Les votes simulés repartiront de l’état de départ.')) {
                agir({ type: 'reinitialiser' });
              }
            }}
          >
            Remettre le prototype à zéro
          </GrosBouton>
        </div>
        <p className="mt-3 text-[11px] text-gris">
          « À force de tirer sur le fil du peuple, il casse. » — Révolution, application de l’écosystème Alphabette.
        </p>
      </Panneau>
    </div>
  );
}

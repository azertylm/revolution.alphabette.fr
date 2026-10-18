import { categorie } from './categories';
import { faireVivreAssemblee } from './assemblee';
import { DICTIONNAIRE_BASE, definitionDeSecours, termesDans } from './education';
import { nouvelleEntree, resultatAConfirmer, tauxSuspect } from './livre';
import { REGLAGES } from './reglages';
import { nomRegion } from './regions';
import type {
  BulletinAgrege,
  EntreeJournal,
  EntreeLivre,
  Etat,
  Notification,
  Question,
  RendezVous,
  Sujet,
  TermeDictionnaire,
} from './types';
import {
  dateLisible,
  heureLisible,
  jourISO,
  joursRestants,
  nombre,
  pct,
  questionDepuisModele,
  statsQuestion,
  totalVotes,
} from './outils';

/* ==========================================================================
   Le moteur : scores, cahier des doléances, La Refonte, statistiques.
   Toutes les décisions du peuple sont recalculées à partir des votes ; aucune
   n'est écrite à la main, y compris le cahier des doléances.
   ========================================================================== */

/** Questions encore en jeu (les questions écartées ne comptent plus). */
export function questionsOuvertes(s: Sujet): Question[] {
  return s.questions.filter((q) => q.etat !== 'ecartee');
}

/** Part de OUI sur l'ensemble des questions ouvertes d'un sujet (0 → 1). */
export function soutienSujet(s: Sujet): number {
  const qs = questionsOuvertes(s);
  let oui = 0;
  let total = 0;
  for (const q of qs) {
    oui += q.oui;
    total += totalVotes(q);
  }
  return total > 0 ? oui / total : 0;
}

/** Intensité budgétaire moyenne d'un sujet (0 → 1, 40 points moyens = 1). */
export function intensiteBudget(s: Sujet): number {
  const qs = questionsOuvertes(s);
  if (!qs.length) return 0;
  const moyenne = qs.reduce((acc, q) => acc + q.budgetMoyen, 0) / qs.length;
  return Math.min(1, moyenne / 40);
}

/**
 * Score de soutien d'un sujet : nombre de votes × soutien × intensité
 * budgétaire. C'est lui qui décide de l'ordre de l'accueil après la Refonte.
 */
export function scoreSujet(s: Sujet): number {
  return Math.round(s.votants * soutienSujet(s) * (0.5 + intensiteBudget(s)));
}

/** Score d'une question, utilisé pour classer le cahier des doléances. */
export function scoreQuestion(q: Question, s: Sujet): number {
  const { ouiPct } = statsQuestion(q);
  return Math.round(s.votants * (ouiPct / 100) * (0.5 + Math.min(1, q.budgetMoyen / 40)));
}

/** Sujets officiels classés par score décroissant. */
export function classement(sujets: Sujet[]): Sujet[] {
  return sujets
    .filter((s) => s.statut === 'officiel')
    .sort((a, b) => scoreSujet(b) - scoreSujet(a));
}

/** Rang (1 = premier) de chaque sujet officiel. */
export function rangs(sujets: Sujet[]): Record<string, number> {
  const out: Record<string, number> = {};
  classement(sujets).forEach((s, index) => {
    out[s.id] = index + 1;
  });
  return out;
}

export interface Exigence {
  sujet: Sujet;
  question: Question;
  score: number;
}

/** Les exigences (consensus ≥ 66 %) d'un périmètre donné. */
export function exigences(etat: Etat, filtre?: { niveau?: string; territoire?: string }): Exigence[] {
  const out: Exigence[] = [];
  for (const s of etat.sujets) {
    if (s.statut !== 'officiel') continue;
    if (filtre?.niveau && s.niveau !== filtre.niveau) continue;
    if (filtre?.territoire && s.territoire !== filtre.territoire) continue;
    for (const q of s.questions) {
      if (q.etat !== 'exigence') continue;
      out.push({ sujet: s, question: q, score: scoreQuestion(q, s) });
    }
  }
  return out.sort((a, b) => b.score - a.score);
}

/** Phrase de justification générée automatiquement pour le cahier. */
export function justification(sujet: Sujet, question: Question): string {
  const { ouiPct } = statsQuestion(question);
  return `${nombre(totalVotes(question))} citoyens ont voté OUI à ${pct(ouiPct)} et alloué en moyenne ${Math.round(
    question.budgetMoyen,
  )} points de budget à cette mesure.`;
}

/** Libellé du périmètre d'un sujet : « Région Occitanie », « National »… */
export function perimetreLisible(s: Sujet): string {
  if (s.niveau === 'national') return 'France entière';
  if (s.niveau === 'region') return `Région ${s.territoire === 'ma-region' ? nomRegion('occitanie') : s.territoire}`;
  if (s.niveau === 'departement') return `Département ${s.territoire}`;
  return s.territoire;
}

/* -------------------------------------------------------------------------- */
/* La Refonte                                                                  */
/* -------------------------------------------------------------------------- */

const GRAINE_VOTES = 0.012;

/** Ajoute des votes simulés à une question (l'heure qui vient de s'écouler). */
function ajouterVotesSimules(q: Question, s: Sujet): BulletinAgrege {
  const delta = Math.max(20, Math.round(s.votants * (GRAINE_VOTES + Math.random() * 0.05)));
  const total = totalVotes(q) || 1;
  const partOui = Math.min(0.95, Math.max(0.08, q.oui / total + (Math.random() - 0.5) * 0.12));
  const reste = 1 - partOui;
  const oui = Math.round(delta * partOui);
  const non = Math.round(delta * reste * (0.75 + Math.random() * 0.1));
  const sansAvis = Math.max(0, delta - oui - non);
  q.oui += oui;
  q.non += non;
  q.sansAvis += sansAvis;
  q.verifies += Math.round(delta * 0.62);
  if (Math.random() < 0.4) q.archives += Math.max(1, Math.round(delta * 0.004));
  // Détection silencieuse : une part des votes est marquée « à vérifier »,
  // jamais retirée. Le taux est déterministe pour rester rejouable.
  const aVerifier = Math.round(delta * tauxSuspect(q.id));
  q.aVerifier += aVerifier;
  return { cycle: 0, date: '', sujetId: s.id, questionId: q.id, oui, non, sansAvis, verifies: Math.round(delta * 0.62), aVerifier };
}

/** Une question écartée laisse sa place, en haut de liste, à une question de secours. */
function remplacerParSecours(s: Sujet, ecartee: Question, journal: EntreeJournal[]) {
  const modele = s.secours.shift();
  const restantes = s.questions.filter((q) => q.id !== ecartee.id);
  if (!modele) {
    s.questions = [...restantes, ecartee];
    return;
  }
  const nouvelle = questionDepuisModele(s.id, s.questions.length, modele, s.categorie);
  const echantillon = Math.max(40, Math.round(s.votants * 0.18));
  const pour = 0.45 + Math.random() * 0.25;
  nouvelle.oui = Math.round(echantillon * pour);
  nouvelle.non = Math.round(echantillon * (1 - pour) * 0.75);
  nouvelle.sansAvis = Math.max(0, echantillon - nouvelle.oui - nouvelle.non);
  nouvelle.verifies = Math.round(echantillon * 0.6);
  nouvelle.aVerifier = Math.round(echantillon * tauxSuspect(nouvelle.id));
  nouvelle.budgetMoyen = 12;
  s.questions = [nouvelle, ...restantes, ecartee];
  journal.push({
    id: `j-${Math.random().toString(36).slice(2, 9)}`,
    date: new Date().toISOString(),
    type: 'question',
    texte: `« ${nouvelle.texte} » entre en tête de liste et remplace la question écartée.`,
  });
}

const idNotif = (cle: string) => `notif-${cle}`;

function notifier(liste: Notification[], n: Omit<Notification, 'date' | 'lu'>) {
  if (liste.some((x) => x.id === n.id)) return;
  liste.push({ ...n, date: new Date().toISOString(), lu: false });
}

/**
 * LA REFONTE — exécutée à chaque top horaire.
 * 1. agrégation des votes de l'heure ; 2. priorisation ; 3. évolution des
 * questions ; 4. journal en langage clair ; 5. écriture dans le LIVRE PUBLIC
 * et dans L'URNE (source brute rejouable).
 */
export function refonte(etat: Etat): Etat {
  const iso = new Date().toISOString();
  const cycleCible = etat.cycles + 1;
  const journal: EntreeJournal[] = [];
  const nouvelles: Notification[] = [];
  const livreNouvelles: EntreeLivre[] = [];
  const bulletins: BulletinAgrege[] = [];
  const avant = rangs(etat.sujets);
  let agreges = 0;
  let ecartees = 0;

  const sujets = etat.sujets.map((s) => {
    const copie: Sujet = {
      ...s,
      questions: s.questions.map((q) => ({
        ...q,
        satisfaction: q.satisfaction ? { ...q.satisfaction } : undefined,
        pourquoi: q.pourquoi ? { ...q.pourquoi } : undefined,
      })),
      secours: [...s.secours],
      messages: s.messages,
      signalements: s.signalements,
      regionsSoutenantes: [...s.regionsSoutenantes],
    };

    if (copie.statut === 'officiel') {
      let nouveaux = 0;
      for (const q of copie.questions) {
        if (q.etat === 'ecartee') continue;
        const b = ajouterVotesSimules(q, copie);
        b.cycle = cycleCible;
        b.date = iso;
        bulletins.push(b);
        nouveaux += b.oui + b.non + b.sansAvis;
      }
      copie.votants += nouveaux;
      copie.verifies += Math.round(nouveaux * 0.62);
      copie.budgetVotants += Math.round(nouveaux * 0.35);
      agreges += nouveaux;
      // La répartition budgétaire moyenne bouge un peu à chaque heure.
      for (const q of copie.questions) {
        if (q.etat === 'ecartee') continue;
        q.budgetMoyen = Math.min(46, Math.max(0, q.budgetMoyen + (Math.random() - 0.45) * 2.4));
      }
    } else if (copie.statut === 'en-attente') {
      // La file de modération vit aussi à chaque refonte.
      const voix = 1 + Math.round(Math.random() * 3);
      if (Math.random() < 0.55) copie.validations += voix;
      else copie.rejets += voix;
    }
    copie.aVerifier = copie.questions.reduce((acc, q) => acc + q.aVerifier, 0);
    return copie;
  });

  // 3. Évolution des questions : exigences et questions écartées.
  for (const s of sujets) {
    if (s.statut !== 'officiel') continue;
    const aRemplacer: Question[] = [];
    for (const q of s.questions) {
      if (q.etat === 'ecartee') continue;
      const st = statsQuestion(q);
      if (st.total < 60) continue;
      if (st.ouiPct >= REGLAGES.consensusExigence) {
        if (q.etat !== 'exigence') {
          q.etat = 'exigence';
          q.statut = q.statut ?? 'a-presenter';
          q.depuis = iso;
          const texte = `La question « ${q.texte} » passe à ${pct(st.ouiPct)} de OUI : elle devient une ✊ exigence du peuple et rejoint le cahier des doléances.`;
          journal.push({ id: `j-${Math.random().toString(36).slice(2, 9)}`, date: iso, type: 'exigence', texte });
          livreNouvelles.push(
            nouvelleEntree({
              date: iso,
              cycle: cycleCible,
              type: 'exigence',
              texte,
              sujetId: s.id,
              questionId: q.id,
              donnees: { ouiPct: Math.round(st.ouiPct), seuil: REGLAGES.consensusExigence },
            }),
          );
          if (etat.mesVotes[`${s.id}:${q.id}`]) {
            notifier(nouvelles, {
              id: idNotif(`exigence-${q.id}`),
              type: 'mobilisation',
              titre: '✊ Ton exigence est adoptée',
              texte: `« ${q.texte} » dépasse ${REGLAGES.consensusExigence} % de OUI et entre au cahier des doléances.`,
              urgent: true,
              cible: { vue: 'sujet', sujetId: s.id, questionId: q.id },
            });
          }
        }
      } else if (st.nonPct >= REGLAGES.consensusEcartee) {
        q.etat = 'ecartee';
        aRemplacer.push(q);
        ecartees += 1;
        const texte = `Le peuple écarte « ${q.texte} » (${pct(st.nonPct)} de NON).`;
        journal.push({ id: `j-${Math.random().toString(36).slice(2, 9)}`, date: iso, type: 'ecartee', texte });
        livreNouvelles.push(
          nouvelleEntree({
            date: iso,
            cycle: cycleCible,
            type: 'ecartee',
            texte,
            sujetId: s.id,
            questionId: q.id,
            donnees: { nonPct: Math.round(st.nonPct) },
          }),
        );
      }
    }
    for (const q of aRemplacer) remplacerParSecours(s, q, journal);
  }

  // 4. Journal de priorisation, et alertes de seuil décisif.
  const apres = rangs(sujets);
  for (const s of sujets) {
    if (s.statut !== 'officiel') continue;
    const a = avant[s.id];
    const b = apres[s.id];
    if (!a || !b || a === b) continue;
    const suivi = s.questions.some((q) => etat.mesVotes[`${s.id}:${q.id}`]);
    if (Math.abs(a - b) >= 3 && b <= 3) {
      const texte = `Le sujet « ${s.nom} » ${b < a ? 'monte' : 'descend'} en ${b}ᵉ position.`;
      journal.push({ id: `j-${Math.random().toString(36).slice(2, 9)}`, date: iso, type: b < a ? 'montee' : 'descente', texte });
      livreNouvelles.push(
        nouvelleEntree({
          date: iso,
          cycle: cycleCible,
          type: 'position',
          texte,
          sujetId: s.id,
          donnees: { avant: a, apres: b },
        }),
      );
    }
    if (suivi && a - b > 5) {
      notifier(nouvelles, {
        id: idNotif(`refonte-${s.id}-${etat.cycles}`),
        type: 'refonte',
        titre: '🔄 La Refonte est passée',
        texte: `Ton sujet « ${s.nom} » monte en ${b}ᵉ position 📈`,
        urgent: false,
        cible: { vue: 'sujet', sujetId: s.id },
      });
    }
    // Vote qui peut faire basculer une exigence.
    for (const q of s.questions) {
      const st = statsQuestion(q);
      if (q.etat !== 'exigence' && st.ouiPct >= REGLAGES.seuilBascule && st.ouiPct < REGLAGES.consensusExigence && suivi) {
        notifier(nouvelles, {
          id: idNotif(`seuil-${q.id}`),
          type: 'seuil',
          titre: '🗳️ Ton vote compte double',
          texte: `« ${q.texte} » est à ${pct(st.ouiPct)} de OUI. Le seuil des ${REGLAGES.consensusExigence} % est à portée.`,
          urgent: true,
          cible: { vue: 'sujet', sujetId: s.id, questionId: q.id },
        });
      }
      // Nouveau résultat « à confirmer » : on l'inscrit au livre, sans rien censurer.
      if (resultatAConfirmer(q) && !etat.livre.some((e) => e.type === 'suspicion' && e.questionId === q.id)) {
        livreNouvelles.push(
          nouvelleEntree({
            date: iso,
            cycle: cycleCible,
            type: 'suspicion',
            suspect: true,
            texte: `Plus de ${REGLAGES.suspicionMax} % des votes de « ${q.texte} » sont à vérifier : résultat à confirmer. Les votes sont comptés, jamais supprimés.`,
            sujetId: s.id,
            questionId: q.id,
            donnees: { pctAVerifier: Math.round((q.aVerifier / Math.max(1, totalVotes(q))) * 100) },
          }),
        );
      }
    }
  }

  if (agreges > 0) {
    const texte = `Refonte de ${heureLisible(iso)} — ${nombre(agreges)} votes agrégés sur ${sujets.filter((s) => s.statut === 'officiel').length} sujets. ${ecartees} question(s) écartée(s).`;
    journal.unshift({ id: `j-${Math.random().toString(36).slice(2, 9)}`, date: iso, type: 'refonte', texte });
    livreNouvelles.unshift(
      nouvelleEntree({
        date: iso,
        cycle: cycleCible,
        type: 'refonte',
        texte,
        donnees: { agreges, ecartees, cycle: cycleCible },
      }),
    );
  }

  // 4 bis. Le dictionnaire citoyen s'alimente tout seul.
  const dictionnaire = enrichirDictionnaire(etat.dictionnaire, sujets, iso, cycleCible, livreNouvelles);

  // 4 ter. Le peuple peut améliorer une carte « Pourquoi » : la meilleure
  // version remplace l'ancienne dès qu'elle passe le seuil.
  const propositionsCarte = etat.propositionsCarte.map((p) => ({ ...p }));
  for (const p of propositionsCarte) {
    if (p.retenue) continue;
    const total = p.oui + p.non + p.sansAvis;
    if (total < REGLAGES.participationCarte || (p.oui / total) * 100 < REGLAGES.consensusCarte) continue;
    const sujet = sujets.find((s) => s.id === p.sujetId);
    const q = sujet?.questions.find((x) => x.id === p.questionId);
    if (!q) continue;
    q.pourquoi = {
      situation: p.situation,
      siOui: p.siOui,
      siNon: p.siNon,
      simpleSituation: p.simpleSituation,
      simpleOui: p.simpleOui,
      simpleNon: p.simpleNon,
      version: (q.pourquoi?.version ?? 1) + 1,
      auteur: p.auteur,
    };
    p.retenue = true;
    livreNouvelles.push(
      nouvelleEntree({
        date: iso,
        cycle: cycleCible,
        type: 'carte',
        texte: `Le peuple a adopté une meilleure explication pour « ${q.texte} » : la carte « Pourquoi c'est important ? » passe en version ${q.pourquoi.version}.`,
        sujetId: p.sujetId,
        questionId: p.questionId,
        donnees: { ouiPct: Math.round((p.oui / total) * 100), version: q.pourquoi.version },
      }),
    );
  }

  // 4 quater. Les règles du jeu : modifiables uniquement à 75 % de OUI.
  const contrat = {
    ...etat.contrat,
    propositions: etat.contrat.propositions.map((p) => ({ ...p })),
    regles: etat.contrat.regles.map((r) => ({ ...r })),
  };
  for (const p of contrat.propositions) {
    if (p.adoptee) continue;
    const total = p.oui + p.non + p.sansAvis;
    if (total < REGLAGES.participationRegle || (p.oui / total) * 100 < REGLAGES.consensusRegle) continue;
    p.adoptee = true;
    contrat.modifiees += 1;
    if (p.numero > 0) {
      const regle = contrat.regles.find((r) => r.numero === p.numero);
      if (regle) {
        regle.titre = p.titre;
        regle.texte = p.texte;
      }
    } else {
      contrat.regles.push({ numero: contrat.regles.length + 1, titre: p.titre, texte: p.texte });
    }
    livreNouvelles.push(
      nouvelleEntree({
        date: iso,
        cycle: cycleCible,
        type: 'regle',
        texte: `📜 Le peuple a modifié une règle du jeu à ${Math.round((p.oui / total) * 100)} % de OUI : « ${p.titre} ». Règles modifiées par le peuple : ${contrat.modifiees}.`,
        donnees: { regle: p.numero, modifiees: contrat.modifiees },
      }),
    );
  }

  // 4 quinquies. Verrouillage du cahier avant un rendez-vous.
  const jourCourant = jourISO(new Date(iso));
  const rdvAujourdhui = etat.rendezVous.find((rdv) => rdv.statut === 'officiel' && rdv.date === jourCourant);
  const heureActuelle = new Date(iso).getHours();
  const dejaVerrouille = etat.livre.some((e) => e.type === 'verrouillage' && jourISO(new Date(e.date)) === jourCourant);
  if (rdvAujourdhui && heureActuelle >= REGLAGES.verrouillageHeure && !dejaVerrouille) {
    livreNouvelles.push(
      nouvelleEntree({
        date: iso,
        cycle: cycleCible,
        type: 'verrouillage',
        texte: `🔒 Cahier des doléances verrouillé à ${REGLAGES.verrouillageHeure} h avant « ${rdvAujourdhui.nature} ». Plus aucune ligne ne peut changer : le peuple a parlé.`,
        donnees: { rdvId: rdvAujourdhui.id, exigences: exigences({ ...etat, sujets }).length },
      }),
    );
  }

  const historique = [
    ...etat.historique,
    { date: iso, votants: agreges, exigences: exigences({ ...etat, sujets }).length },
  ].slice(-24);

  // 5. L'Assemblée du peuple : échéances, volontaires, sièges installés au fur
  //    et à mesure, sections qui s'ouvrent d'elles-mêmes. Tout est automatique.
  const assemblee = faireVivreAssemblee(etat, iso);

  // 6. L'urne : insertion pure, partitionnée par cycle. On ne met jamais à jour
  //    une ligne : on en ajoute une. C'est la source rejouable du moteur.
  const urneComplete = [...etat.urne, ...bulletins];
  const surplus = Math.max(0, urneComplete.length - REGLAGES.urneMax);
  const urne = surplus > 0 ? urneComplete.slice(surplus) : urneComplete;

  return {
    ...etat,
    sujets,
    sections: assemblee.sections,
    mandats: assemblee.mandats,
    candidatsAdmin: assemblee.candidatsAdmin,
    dictionnaire,
    propositionsCarte,
    contrat,
    urne,
    urneArchives: etat.urneArchives + surplus,
    livre: [...livreNouvelles, ...etat.livre].slice(0, 2000),
    journal: [...journal, ...assemblee.journal, ...etat.journal].slice(0, 200),
    notifications: [...assemblee.notifications, ...nouvelles, ...etat.notifications].slice(0, 120),
    historique,
    cycles: cycleCible,
    derniereRefonte: iso,
  };
}

/** Ajoute au dictionnaire tout terme nouveau apparu dans un sujet. */
function enrichirDictionnaire(
  dictionnaire: TermeDictionnaire[],
  sujets: Sujet[],
  iso: string,
  cycle: number,
  livre: EntreeLivre[],
): TermeDictionnaire[] {
  const connus = new Map(dictionnaire.map((t) => [t.terme.toLowerCase(), t] as const));
  for (const s of sujets) {
    const textes = [
      s.nom,
      s.probleme,
      ...s.questions.map((q) => q.texte),
      ...s.questions.map((q) => q.pourquoi?.situation ?? ''),
    ];
    for (const texte of textes) {
      for (const terme of termesDans(texte)) {
        if (connus.has(terme.toLowerCase())) continue;
        const base =
          DICTIONNAIRE_BASE.find((t) => t.terme.toLowerCase() === terme.toLowerCase()) ?? definitionDeSecours(terme);
        connus.set(base.terme.toLowerCase(), base);
        livre.push(
          nouvelleEntree({
            date: iso,
            cycle,
            type: 'definition',
            texte: `Nouveau mot expliqué : « ${base.terme} » — ${base.definition}`,
            donnees: { terme: base.terme },
          }),
        );
      }
    }
  }
  return [...connus.values()];
}

/** Notifications de rendez-vous : J-7, J-3, J-1 et le jour J. */
export function notificationsRendezVous(etat: Etat): Notification[] {
  const out: Notification[] = [];
  for (const rdv of etat.rendezVous) {
    if (rdv.statut === 'termine' || rdv.statut === 'propose') continue;
    const j = joursRestants(rdv.date);
    if (![7, 3, 1, 0].includes(j)) continue;
    const nb = exigences(etat).length;
    notifier(out, {
      id: idNotif(`rdv-${rdv.id}-j${j}`),
      type: 'rendez-vous',
      titre: j === 0 ? '📅 RENDEZ-VOUS AUJOURD’HUI' : `📅 Rendez-vous dans ${j} jour${j > 1 ? 's' : ''}`,
      texte:
        j === 0
          ? `Le cahier est verrouillé à ${REGLAGES.verrouillageHeure} h. ${nb} exigences vont être présentées au nom du peuple.`
          : `${rdv.nature} — ${dateLisible(rdv.date)} à ${rdv.heure}, ${rdv.lieu}. ${nb} exigences dans le cahier.`,
      urgent: j <= 1,
      cible: { vue: 'rendez-vous' },
    });
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Transparence : les chiffres publics                                         */
/* -------------------------------------------------------------------------- */

export interface StatsGlobales {
  reponseEtat: number;
  satisfactionPeuple: number;
  exigencesPresentees: number;
  citoyensActifs: number;
  votesTotaux: number;
}

export function statsGlobales(etat: Etat): StatsGlobales {
  const toutes = exigences(etat);
  const presentees = toutes.filter((e) => e.question.statut && e.question.statut !== 'a-presenter');
  const repondues = presentees.filter((e) => e.question.reponse);
  let satisfait = 0;
  let totalSatisfaction = 0;
  for (const e of toutes) {
    if (!e.question.satisfaction) continue;
    satisfait += e.question.satisfaction.satisfait;
    totalSatisfaction += e.question.satisfaction.satisfait + e.question.satisfaction.pasSatisfait;
  }
  const votesTotaux = etat.sujets.reduce((acc, s) => acc + s.votants, 0);
  const actifs = Math.round(etat.sujets.reduce((acc, s) => acc + s.votants, 0) * 0.42) + 23104;
  return {
    reponseEtat: presentees.length ? (repondues.length / presentees.length) * 100 : 0,
    satisfactionPeuple: totalSatisfaction ? (satisfait / totalSatisfaction) * 100 : 0,
    exigencesPresentees: presentees.length,
    citoyensActifs: actifs,
    votesTotaux,
  };
}

/* -------------------------------------------------------------------------- */
/* Export du cahier des doléances                                              */
/* -------------------------------------------------------------------------- */

/** Le document officiel, en texte copiable et imprimable. */
export function texteCahier(etat: Etat, rdv: RendezVous | null, liste?: Exigence[]): string {
  const lignes = liste ?? exigences(etat);
  const entete = [
    '════════════════════════════════════════════',
    '        CAHIER DES DOLÉANCES DU PEUPLE',
    '════════════════════════════════════════════',
    '',
    '« À force de tirer sur le fil du peuple, il casse. »',
    '',
    `Généré le ${dateLisible(new Date().toISOString())} par le peuple, pour le peuple.`,
  ];
  if (rdv) {
    entete.push(
      '',
      `Rendez-vous : ${rdv.nature} — ${dateLisible(rdv.date)} à ${rdv.heure}`,
      `Lieu : ${rdv.lieu}`,
      `Périmètre : ${rdv.niveau === 'national' ? 'France entière' : `${rdv.territoire}`}`,
    );
  }
  entete.push('', `Nombre d'exigences : ${lignes.length}`, '');

  const corps = lignes.map((e, index) => {
    const st = statsQuestion(e.question);
    return [
      `${index + 1}. ${e.sujet.emoji} ${e.sujet.nom} — ${e.question.texte}`,
      `   ${pct(st.ouiPct)} OUI · ${nombre(st.total)} votants · ${Math.round(e.question.budgetMoyen)} pts de budget moyen · score ${nombre(e.score)}`,
      `   ${justification(e.sujet, e.question)}`,
      '',
    ].join('\n');
  });

  const pied = [
    '════════════════════════════════════════════',
    'Document généré par le peuple, pour le peuple.',
    'Chaque ligne provient d’un vote public : aucun responsable ne peut la modifier.',
    '════════════════════════════════════════════',
  ];

  return [...entete, ...corps, ...pied].join('\n');
}

/** Empreinte courte du cahier, pour le lien partageable. */
export function empreinteCahier(liste: Exigence[]): string {
  const base = liste.map((e) => `${e.sujet.id}:${e.question.id}`).join('|');
  let h = 0;
  for (let i = 0; i < base.length; i += 1) h = (h * 31 + base.charCodeAt(i)) % 1679616;
  return h.toString(36).padStart(4, '0');
}

/** Catégorie d'un sujet (pour l'affichage). */
export function emojiCategorie(s: Sujet): string {
  return categorie(s.categorie).emoji;
}

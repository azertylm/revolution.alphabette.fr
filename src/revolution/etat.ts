import { categorie, type CategorieId } from './categories';
import { nomAssemblee } from './assemblee';
import { adherentsParDefaut, etatInitial } from './donnees';
import { notificationsRendezVous, refonte } from './moteur';
import { REGLAGES } from './reglages';
import type { ChoixVote, Citoyen, Etat, Niveau, Question, ReponseEtat, Sujet } from './types';
import { appliquerVote, deriverQuestions, jourISO, nomDepuisProbleme, poidsVote, raisonPoidsNul } from './outils';

/* ==========================================================================
   L'état : une seule source de vérité, mutée par des actions nommées.
   Le prototype persiste dans le navigateur ; un vrai backend remplacerait
   simplement le reducer par des appels réseau.
   ========================================================================== */

export type Action =
  | { type: 'proposer-sujet'; probleme: string; categorie: CategorieId }
  | { type: 'voter'; sujetId: string; questionId: string; choix: ChoixVote }
  | { type: 'budget'; sujetId: string; points: number[] }
  | { type: 'moderer'; sujetId: string; choix: 'valider' | 'rejeter' }
  | { type: 'signaler'; sujetId: string; motif: string }
  | { type: 'soutenir-candidat'; sectionId: string; candidatId: string; choix: ChoixVote }
  | { type: 'rejoindre-section'; sectionId: string }
  | { type: 'quitter-section'; sectionId: string }
  | { type: 'candidater'; phrase: string }
  | { type: 'soutenir-administrateur'; candidatId: string; choix: ChoixVote }
  | { type: 'message'; sujetId: string; texte: string }
  | {
      type: 'declarer-rdv';
      niveau: Niveau;
      territoire: string;
      date: string;
      heure: string;
      nature: string;
      lieu: string;
    }
  | { type: 'valider-rdv'; rdvId: string }
  | { type: 'satisfaction'; sujetId: string; questionId: string; satisfait: boolean }
  | { type: 'reponse-etat'; sujetId: string; questionId: string; reponse: ReponseEtat }
  | { type: 'presenter-exigence'; sujetId: string; questionId: string }
  | { type: 'refonte' }
  | { type: 'rdv-notifications' }
  | { type: 'lire-notifications' }
  | { type: 'lire-notification'; notificationId: string }
  | { type: 'reglages-notif'; reglages: Partial<Etat['reglagesNotif']> }
  | { type: 'cycle-accelere'; actif: boolean }
  | { type: 'citoyen'; citoyen: Citoyen | null }
  | { type: 'profil'; changement: Partial<Citoyen> }
  | { type: 'partage'; sujetId: string }
  | { type: 'reinitialiser' };

const CLE = 'revolution.v1';

/** Charge l'état sauvegardé, ou l'état de départ. */
export function chargerEtat(): Etat {
  try {
    const brut = localStorage.getItem(CLE);
    if (!brut) return etatInitial();
    const parse = JSON.parse(brut) as Partial<Etat>;
    if (!parse.sujets || !parse.sujets.length) return etatInitial();
    const base = etatInitial();
    const etat = { ...base, ...parse } as Etat;
    // Un état enregistré avant l'Assemblée n'a ni sièges ni sections complètes :
    // on complète les champs manquants sans jamais écraser le reste.
    return {
      ...etat,
      sections: etat.sections.map((s) => ({
        ...s,
        membres: typeof s.membres === 'number' ? s.membres : adherentsParDefaut(s.id),
      })),
      adhesions: etat.adhesions ?? [],
      mandats: etat.mandats ?? base.mandats,
      candidatsAdmin: etat.candidatsAdmin ?? base.candidatsAdmin,
      soutiensAdmin: etat.soutiensAdmin ?? [],
    };
  } catch {
    return etatInitial();
  }
}

export function sauverEtat(etat: Etat): void {
  try {
    localStorage.setItem(CLE, JSON.stringify(etat));
  } catch {
    /* mode privé : on continue sans persistance. */
  }
}

const pseudoDe = (etat: Etat): string => etat.citoyen?.pseudo ?? 'Citoyen anonyme';
const badgeDe = (etat: Etat): Citoyen['badge'] => etat.citoyen?.badge ?? 'citoyen';

/** Remplace un sujet dans la liste (copie immuable). */
function majSujet(etat: Etat, sujetId: string, transformation: (s: Sujet) => Sujet): Etat {
  return { ...etat, sujets: etat.sujets.map((s) => (s.id === sujetId ? transformation(s) : s)) };
}

function majQuestion(sujet: Sujet, questionId: string, transformation: (q: Question) => Question): Sujet {
  return { ...sujet, questions: sujet.questions.map((q) => (q.id === questionId ? transformation(q) : q)) };
}

/** Le sujet est-il votable par ce citoyen ? (mode jeune citoyen) */
export function peutVoterSur(etat: Etat, sujet: Sujet): { ok: boolean; raison?: string } {
  const poids = poidsVote(badgeDe(etat), sujet.categorie, sujet.niveau);
  if (poids === 0) return { ok: false, raison: raisonPoidsNul(sujet.categorie, sujet.niveau) };
  return { ok: true };
}

/** Nombre de questions déjà votées par l'utilisateur sur un sujet. */
export function dejaVote(etat: Etat, sujetId: string): number {
  return Object.keys(etat.mesVotes).filter((cle) => cle.startsWith(`${sujetId}:`)).length;
}

function nouveauSujet(etat: Etat, probleme: string, cat: CategorieId): Sujet {
  const id = `sujet-${Date.now().toString(36)}`;
  const nom = nomDepuisProbleme(probleme);
  return {
    id,
    emoji: categorie(cat).emoji,
    nom,
    probleme,
    categorie: cat,
    niveau: categorie(cat).niveau,
    territoire: cat === 'education' || cat === 'transports' || cat === 'environnement' ? 'Occitanie' : 'France',
    statut: 'en-attente',
    validations: 0,
    rejets: 0,
    votants: 0,
    verifies: 0,
    archives: 0,
    questions: deriverQuestions(id, probleme, cat),
    secours: [...categorie(cat).secours],
    budgetVotants: 0,
    creeLe: new Date().toISOString(),
    auteur: pseudoDe(etat),
    messages: [],
    signalements: [],
    regionsSoutenantes: [],
  };
}

export function reducer(etat: Etat, action: Action): Etat {
  switch (action.type) {
    case 'proposer-sujet': {
      const sujet = nouveauSujet(etat, action.probleme, action.categorie);
      return {
        ...etat,
        sujets: [sujet, ...etat.sujets],
        dernierEnvoi: new Date().toISOString(),
        journal: [
          {
            id: `j-${Math.random().toString(36).slice(2, 9)}`,
            date: new Date().toISOString(),
            type: 'refonte',
            texte: `Nouveau sujet proposé : « ${sujet.nom} ». En attente de ${REGLAGES.seuilValidations} validations citoyennes.`,
          },
          ...etat.journal,
        ],
      };
    }

    case 'voter': {
      const sujet = etat.sujets.find((s) => s.id === action.sujetId);
      if (!sujet || !peutVoterSur(etat, sujet).ok) return etat;
      const cle = `${action.sujetId}:${action.questionId}`;
      const ancien = etat.mesVotes[cle];
      if (ancien === action.choix) return etat;
      const premier = !Object.keys(etat.mesVotes).some((k) => k.startsWith(`${action.sujetId}:`));
      return majSujet(
        { ...etat, mesVotes: { ...etat.mesVotes, [cle]: action.choix } },
        action.sujetId,
        (s) => {
          const suivante = majQuestion(s, action.questionId, (q) => {
            const copie: Question = { ...q };
            if (ancien) appliquerVote(copie, ancien, -1);
            appliquerVote(copie, action.choix, 1);
            if (badgeDe(etat) === 'verifie') copie.verifies += 1;
            return copie;
          });
          return {
            ...suivante,
            votants: premier ? suivante.votants + 1 : suivante.votants,
            verifies: premier && badgeDe(etat) === 'verifie' ? suivante.verifies + 1 : suivante.verifies,
          };
        },
      );
    }

    case 'budget': {
      const sujet = etat.sujets.find((s) => s.id === action.sujetId);
      if (!sujet) return etat;
      const total = sujet.budgetVotants;
      return {
        ...majSujet(etat, action.sujetId, (s) => ({
          ...s,
          budgetVotants: s.budgetVotants + 1,
          questions: s.questions.map((q, i) => {
            const points = action.points[i] ?? 0;
            const moyenne = total > 0 ? (q.budgetMoyen * total + points) / (total + 1) : points;
            return { ...q, budgetMoyen: moyenne };
          }),
        })),
        mesBudgets: { ...etat.mesBudgets, [action.sujetId]: action.points },
      };
    }

    case 'moderer': {
      const sujet = etat.sujets.find((s) => s.id === action.sujetId);
      if (!sujet || etat.sujetsModeres.includes(action.sujetId)) return etat;
      const validations = sujet.validations + (action.choix === 'valider' ? 1 : 0);
      const rejets = sujet.rejets + (action.choix === 'rejeter' ? 1 : 0);
      let statut: Sujet['statut'] = sujet.statut;
      const journal = [...etat.journal];
      if (validations >= REGLAGES.seuilValidations) {
        statut = 'officiel';
        journal.unshift({
          id: `j-${Math.random().toString(36).slice(2, 9)}`,
          date: new Date().toISOString(),
          type: 'refonte',
          texte: `« ${sujet.nom} » devient officiel : ${validations} validations citoyennes. Ses 5 questions sont ouvertes au vote.`,
        });
      } else if (rejets >= REGLAGES.seuilRejets) {
        statut = 'ecarte';
        journal.unshift({
          id: `j-${Math.random().toString(36).slice(2, 9)}`,
          date: new Date().toISOString(),
          type: 'ecartee',
          texte: `« ${sujet.nom} » est écarté par ${rejets} rejets citoyens. Il reste archivé, avec son compteur.`,
        });
      }
      return {
        ...majSujet(etat, action.sujetId, (s) => ({
          ...s,
          validations,
          rejets,
          statut,
          votants: statut === 'officiel' && s.votants === 0 ? 120 + Math.round(Math.random() * 200) : s.votants,
        })),
        sujetsModeres: [...etat.sujetsModeres, action.sujetId],
        journal,
      };
    }

    case 'signaler': {
      const sujet = etat.sujets.find((s) => s.id === action.sujetId);
      if (!sujet || etat.mesSignalements.includes(action.sujetId)) return etat;
      const signalements = [...sujet.signalements, action.motif];
      const archive = signalements.length >= 3;
      return {
        ...majSujet(etat, action.sujetId, (s) => ({
          ...s,
          signalements,
          statut: archive ? 'ecarte' : s.statut,
        })),
        mesSignalements: [...etat.mesSignalements, action.sujetId],
        journal: archive
          ? [
              {
                id: `j-${Math.random().toString(36).slice(2, 9)}`,
                date: new Date().toISOString(),
                type: 'ecartee',
                texte: `« ${sujet.nom} » archivé après 3 votes de pairs. Les votes déjà exprimés ne sont pas effacés : ils restent visibles dans le journal public.`,
              },
              ...etat.journal,
            ]
          : etat.journal,
      };
    }

    case 'soutenir-candidat': {
      return {
        ...etat,
        sections: etat.sections.map((section) =>
          section.id !== action.sectionId
            ? section
            : {
                ...section,
                candidats: section.candidats.map((c) => {
                  if (c.id !== action.candidatId || etat.mesElections.includes(c.id)) return c;
                  const copie = { ...c };
                  appliquerVote(copie, action.choix, 1);
                  return copie;
                }),
              },
        ),
        mesElections: etat.mesElections.includes(action.candidatId)
          ? etat.mesElections
          : [...etat.mesElections, action.candidatId],
      };
    }

    case 'rejoindre-section': {
      const section = etat.sections.find((s) => s.id === action.sectionId);
      if (!section || etat.adhesions.includes(section.id)) return etat;
      const iso = new Date().toISOString();
      return {
        ...etat,
        adhesions: [...etat.adhesions, section.id],
        sections: etat.sections.map((s) =>
          s.id === section.id ? { ...s, membres: (s.membres ?? 0) + 1 } : s,
        ),
        journal: [
          {
            id: `j-${Math.random().toString(36).slice(2, 9)}`,
            date: iso,
            type: 'assemblee',
            texte: `🏛️ ${pseudoDe(etat)} rejoint la section de ${section.territoire}. Les sections locales sont ouvertes à tous, sans carte ni cotisation.`,
          },
          ...etat.journal,
        ],
        notifications: [
          {
            id: `notif-section-${section.id}`,
            date: iso,
            type: 'mobilisation',
            titre: `🏛️ Tu as rejoint la section ${section.territoire}`,
            texte:
              'Tu peux maintenant soutenir les volontaires, suivre les mandats et proposer des réunions locales. Rien de plus : ton vote reste secret et personnel.',
            urgent: false,
            lu: false,
            cible: { vue: 'assemblee' },
          },
          ...etat.notifications,
        ],
      };
    }

    case 'quitter-section': {
      if (!etat.adhesions.includes(action.sectionId)) return etat;
      return {
        ...etat,
        adhesions: etat.adhesions.filter((id) => id !== action.sectionId),
        sections: etat.sections.map((s) =>
          s.id === action.sectionId ? { ...s, membres: Math.max(0, (s.membres ?? 0) - 1) } : s,
        ),
      };
    }

    case 'candidater': {
      if (!etat.citoyen) return etat;
      const regionId = etat.citoyen.region || 'national';
      const pseudo = pseudoDe(etat);
      if (etat.candidatsAdmin.some((c) => c.regionId === regionId && c.pseudo === pseudo)) return etat;
      const iso = new Date().toISOString();
      const territoire = nomAssemblee(regionId);
      return {
        ...etat,
        candidatsAdmin: [
          ...etat.candidatsAdmin,
          {
            id: `admin-${Date.now().toString(36)}`,
            regionId,
            territoire,
            pseudo,
            phrase: action.phrase,
            // Tes voisins de section te soutiennent déjà : une candidature
            // seule ne sert à rien, un soutien oui.
            voix: 4,
            reserves: 0,
            inscritLe: iso,
            dejaElu: false,
          },
        ],
        journal: [
          {
            id: `j-${Math.random().toString(36).slice(2, 9)}`,
            date: iso,
            type: 'assemblee',
            texte: `✊ ${pseudo} se porte volontaire pour l'Assemblée de ${territoire} : « ${action.phrase} »`,
          },
          ...etat.journal,
        ],
        notifications: [
          {
            id: `notif-candidature-${Date.now().toString(36)}`,
            date: iso,
            type: 'mobilisation',
            titre: `✊ Ta candidature est enregistrée`,
            texte: `Tu es candidat(e) à l'Assemblée de ${territoire}. Dès que le soutien dépasse le seuil, tu es installé(e) automatiquement — sans tract, sans meeting, sans argent.`,
            urgent: false,
            lu: false,
            cible: { vue: 'assemblee' },
          },
          ...etat.notifications,
        ],
      };
    }

    case 'soutenir-administrateur': {
      if (etat.soutiensAdmin.includes(action.candidatId)) return etat;
      if (etat.soutiensAdmin.length >= REGLAGES.soutiensParCitoyen) return etat;
      return {
        ...etat,
        candidatsAdmin: etat.candidatsAdmin.map((c) => {
          if (c.id !== action.candidatId) return c;
          if (action.choix === 'oui') return { ...c, voix: c.voix + 1 };
          if (action.choix === 'non') return { ...c, reserves: c.reserves + 1 };
          return c;
        }),
        soutiensAdmin: [...etat.soutiensAdmin, action.candidatId],
      };
    }

    case 'message': {
      return majSujet(etat, action.sujetId, (s) => ({
        ...s,
        messages: [
          ...s.messages,
          {
            id: `m-${Date.now().toString(36)}`,
            pseudo: etat.citoyen?.modeDiscret ? 'Citoyen #48231' : pseudoDe(etat),
            badge: badgeDe(etat),
            texte: action.texte,
            date: new Date().toISOString(),
          },
        ],
      }));
    }

    case 'declarer-rdv':
      return {
        ...etat,
        rendezVous: [
          ...etat.rendezVous,
          {
            id: `rdv-${Date.now().toString(36)}`,
            niveau: action.niveau,
            territoire: action.territoire,
            date: action.date,
            heure: action.heure,
            nature: action.nature,
            lieu: action.lieu,
            statut: 'propose',
            validations: 0,
          },
        ],
      };

    case 'valider-rdv': {
      if (etat.rdvValides.includes(action.rdvId)) return etat;
      return {
        ...etat,
        rdvValides: [...etat.rdvValides, action.rdvId],
        rendezVous: etat.rendezVous.map((rdv) =>
          rdv.id === action.rdvId
            ? {
                ...rdv,
                validations: rdv.validations + 1,
                statut: rdv.validations + 1 >= REGLAGES.seuilValidations ? 'officiel' : rdv.statut,
              }
            : rdv,
        ),
      };
    }

    case 'satisfaction': {
      return majSujet(etat, action.sujetId, (s) =>
        majQuestion(s, action.questionId, (q) => {
          const satisfaction = q.satisfaction ?? { satisfait: 0, pasSatisfait: 0 };
          const suivante = {
            satisfait: satisfaction.satisfait + (action.satisfait ? 1 : 0),
            pasSatisfait: satisfaction.pasSatisfait + (action.satisfait ? 0 : 1),
          };
          const total = suivante.satisfait + suivante.pasSatisfait;
          const rejet = total >= 5 && suivante.pasSatisfait / total > REGLAGES.satisfactionRejet / 100;
          return {
            ...q,
            satisfaction: suivante,
            statut: rejet ? 'relancee' : total >= 5 ? 'satisfaite' : q.statut,
          };
        }),
      );
    }

    case 'reponse-etat':
      return majSujet(etat, action.sujetId, (s) =>
        majQuestion(s, action.questionId, (q) => ({
          ...q,
          reponse: action.reponse,
          statut: 'en-reponse',
          satisfaction: { satisfait: 2, pasSatisfait: 6 },
        })),
      );

    case 'presenter-exigence':
      return majSujet(etat, action.sujetId, (s) =>
        majQuestion(s, action.questionId, (q) => ({ ...q, statut: 'presentee' })),
      );

    case 'refonte': {
      const suivant = refonte(etat);
      // Les liens de partage continuent d'amener des votants (mobilisation).
      const partages = Object.fromEntries(
        Object.entries(suivant.partages).map(([cle, valeur]) => [
          cle,
          { ...valeur, votes: valeur.votes + (Math.random() < 0.5 ? 0 : Math.round(Math.random() * 4)) },
        ]),
      );
      return { ...suivant, partages };
    }

    case 'rdv-notifications': {
      const nouvelles = notificationsRendezVous(etat).filter(
        (n) => !etat.notifications.some((x) => x.id === n.id),
      );
      if (!nouvelles.length) return etat;
      return { ...etat, notifications: [...nouvelles, ...etat.notifications] };
    }

    case 'lire-notifications':
      return { ...etat, notifications: etat.notifications.map((n) => ({ ...n, lu: true })) };

    case 'lire-notification':
      return {
        ...etat,
        notifications: etat.notifications.map((n) => (n.id === action.notificationId ? { ...n, lu: true } : n)),
      };

    case 'reglages-notif':
      return { ...etat, reglagesNotif: { ...etat.reglagesNotif, ...action.reglages } };

    case 'cycle-accelere':
      return { ...etat, cycleAccelere: action.actif };

    case 'citoyen':
      return { ...etat, citoyen: action.citoyen };

    case 'profil':
      return etat.citoyen ? { ...etat, citoyen: { ...etat.citoyen, ...action.changement } } : etat;

    case 'partage': {
      const sujet = etat.sujets.find((s) => s.id === action.sujetId);
      if (!sujet) return etat;
      const deja = etat.partages[action.sujetId];
      if (deja) return etat;
      const code = Math.random().toString(36).slice(2, 7);
      return {
        ...etat,
        partages: {
          ...etat.partages,
          [action.sujetId]: { lien: `https://revolution.alphabette.fr/s/${code}`, votes: 0 },
        },
      };
    }

    case 'reinitialiser':
      return etatInitial();

    default:
      return etat;
  }
}

/** Date du jour, exposée pour les vues qui déclarent un rendez-vous. */
export const aujourdHui = () => jourISO(new Date());

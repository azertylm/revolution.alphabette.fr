/**
 * partage.ts — le recueil partagé des réponses (Firebase / Firestore).
 *
 * Tout ce qui sort de l'appareil passe par ici, et seulement ceci :
 *  - un identifiant technique anonyme (connexion anonyme Firebase) ;
 *  - la réponse choisie à une question (un numéro) ;
 *  - les questions publiées par les organisations et les citoyens.
 * Aucun nom, aucun e-mail, aucune position, aucune donnée de profil.
 *
 * Les réponses individuelles ne sont lisibles par personne d'autre que leur
 * auteur : seuls les compteurs (c0…c3) sont publics. Les règles de la base
 * (firestore.rules.revolution) garantissent qu'un appareil ne compte qu'une fois.
 *
 * Tant que ces règles ne sont pas publiées dans la console Firebase, la base
 * refuse tout : l'application le détecte et reste en « mode appareil ».
 */
import config from './firebase-config.json';
import type { QuestionPubliee, NouvelleQuestion } from './types';

export type EtatPartage = 'verification' | 'actif' | 'inactif';

type Fs = typeof import('firebase/firestore');

interface Api {
  fs: Fs;
  db: import('firebase/firestore').Firestore;
  uid: string;
}

let promesse: Promise<Api | null> | null = null;
let raison = '';

export function raisonInactif(): string {
  return raison;
}

async function ouvrir(): Promise<Api | null> {
  try {
    const [{ initializeApp, getApps }, auth, fs] = await Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
      import('firebase/firestore'),
    ]);
    const app = getApps().find((a) => a.name === 'revolution') ?? initializeApp(config, 'revolution');
    const a = auth.getAuth(app);
    await auth.setPersistence(a, auth.browserLocalPersistence).catch(() => undefined);
    const utilisateur =
      a.currentUser ??
      (await new Promise<import('firebase/auth').User | null>((resolve) => {
        const stop = auth.onAuthStateChanged(a, (u) => {
          stop();
          resolve(u);
        });
      })) ??
      (await auth.signInAnonymously(a)).user;
    const db = fs.getFirestore(app, (config as { firestoreDatabaseId?: string }).firestoreDatabaseId ?? '(default)');
    // Sonde : la base répond-elle aux questions de Révolution ?
    await fs.getDocs(fs.query(fs.collection(db, 'revolution_questions'), fs.limit(1)));
    return { fs, db, uid: utilisateur.uid };
  } catch (err) {
    const code = (err as { code?: string }).code ?? '';
    raison = code.includes('permission')
      ? 'la base partagée n’a pas encore reçu les règles de Révolution'
      : code.includes('admin-restricted') || code.includes('operation-not-allowed')
        ? 'la connexion anonyme n’est pas activée dans Firebase'
        : code.includes('unauthorized-domain') || code.includes('requests-from-referer')
          ? 'ce domaine n’est pas encore autorisé dans Firebase'
          : 'la base partagée ne répond pas';
    return null;
  }
}

export function partage(): Promise<Api | null> {
  promesse ??= ouvrir();
  return promesse;
}

/* ------------------------------------------------------------------------ */

export type Compteurs = [number, number, number, number];

export async function lireCompteurs(questionId: string): Promise<Compteurs | null> {
  const api = await partage();
  if (!api) return null;
  const { fs, db } = api;
  const snap = await fs.getDoc(fs.doc(db, 'revolution_compteurs', questionId));
  const d = snap.exists() ? (snap.data() as Record<string, number>) : {};
  return [d.c0 ?? 0, d.c1 ?? 0, d.c2 ?? 0, d.c3 ?? 0];
}

/** Ma réponse déjà enregistrée dans la base (pour un appareil qui a été vidé, par exemple). */
export async function lireMaReponse(questionId: string): Promise<number | null> {
  const api = await partage();
  if (!api) return null;
  const { fs, db, uid } = api;
  try {
    const snap = await fs.getDoc(fs.doc(db, 'revolution_reponses', `${questionId}_${uid}`));
    return snap.exists() ? Number(snap.data().choix) : null;
  } catch {
    return null;
  }
}

/**
 * Enregistre une réponse : le document de réponse et le compteur bougent
 * ensemble, en une seule écriture. Une seule réponse par appareil et par
 * question : une deuxième tentative est refusée par la base.
 */
export async function envoyerReponse(questionId: string, choix: number): Promise<'ok' | 'deja' | 'hors-ligne'> {
  const api = await partage();
  if (!api) return 'hors-ligne';
  const { fs, db, uid } = api;
  const lot = fs.writeBatch(db);
  lot.set(fs.doc(db, 'revolution_reponses', `${questionId}_${uid}`), {
    questionId,
    choix,
    uid,
    creeLe: fs.serverTimestamp(),
  });
  lot.set(
    fs.doc(db, 'revolution_compteurs', questionId),
    {
      c0: fs.increment(choix === 0 ? 1 : 0),
      c1: fs.increment(choix === 1 ? 1 : 0),
      c2: fs.increment(choix === 2 ? 1 : 0),
      c3: fs.increment(choix === 3 ? 1 : 0),
    },
    { merge: true },
  );
  try {
    await lot.commit();
    return 'ok';
  } catch (err) {
    if ((err as { code?: string }).code?.includes('permission')) return 'deja';
    throw err;
  }
}

/* ------------------------------------------------------------------------ */

export async function listerQuestions(): Promise<QuestionPubliee[] | null> {
  const api = await partage();
  if (!api) return null;
  const { fs, db } = api;
  const snap = await fs.getDocs(
    fs.query(fs.collection(db, 'revolution_questions'), fs.orderBy('creeLe', 'desc'), fs.limit(60)),
  );
  return snap.docs.map((d) => {
    const x = d.data();
    const ts = x.creeLe as { toDate?: () => Date } | null;
    return {
      id: d.id,
      texte: String(x.texte ?? ''),
      contexte: String(x.contexte ?? ''),
      choix: Array.isArray(x.choix) ? x.choix.map(String) : [],
      auteurType: String(x.auteurType ?? 'citoyen'),
      auteurNom: String(x.auteurNom ?? ''),
      territoire: String(x.territoire ?? 'national'),
      lien: String(x.lien ?? ''),
      creeLe: ts?.toDate ? ts.toDate().toISOString() : new Date().toISOString(),
      signalements: Number(x.signalements ?? 0),
      mienne: x.uid === api.uid,
    };
  });
}

export async function lireQuestion(id: string): Promise<QuestionPubliee | null> {
  const toutes = await listerQuestions();
  const trouvee = toutes?.find((q) => q.id === id);
  if (trouvee) return trouvee;
  const api = await partage();
  if (!api) return null;
  const { fs, db } = api;
  const snap = await fs.getDoc(fs.doc(db, 'revolution_questions', id));
  if (!snap.exists()) return null;
  const x = snap.data();
  const ts = x.creeLe as { toDate?: () => Date } | null;
  return {
    id: snap.id,
    texte: String(x.texte ?? ''),
    contexte: String(x.contexte ?? ''),
    choix: Array.isArray(x.choix) ? x.choix.map(String) : [],
    auteurType: String(x.auteurType ?? 'citoyen'),
    auteurNom: String(x.auteurNom ?? ''),
    territoire: String(x.territoire ?? 'national'),
    lien: String(x.lien ?? ''),
    creeLe: ts?.toDate ? ts.toDate().toISOString() : new Date().toISOString(),
    signalements: Number(x.signalements ?? 0),
    mienne: x.uid === api.uid,
  };
}

export async function publierQuestion(q: NouvelleQuestion): Promise<string | null> {
  const api = await partage();
  if (!api) return null;
  const { fs, db, uid } = api;
  const ref = await fs.addDoc(fs.collection(db, 'revolution_questions'), {
    texte: q.texte,
    contexte: q.contexte,
    choix: q.choix,
    auteurType: q.auteurType,
    auteurNom: q.auteurNom,
    territoire: q.territoire,
    lien: q.lien,
    signalements: 0,
    uid,
    creeLe: fs.serverTimestamp(),
  });
  return ref.id;
}

export async function retirerQuestion(id: string): Promise<boolean> {
  const api = await partage();
  if (!api) return false;
  const { fs, db } = api;
  await fs.deleteDoc(fs.doc(db, 'revolution_questions', id));
  return true;
}

/** Signaler une question : un signalement par appareil, compté sur la question. */
export async function signalerQuestion(id: string): Promise<'ok' | 'deja' | 'hors-ligne'> {
  const api = await partage();
  if (!api) return 'hors-ligne';
  const { fs, db, uid } = api;
  const lot = fs.writeBatch(db);
  lot.set(fs.doc(db, 'revolution_signalements', `${id}_${uid}`), { questionId: id, uid, creeLe: fs.serverTimestamp() });
  lot.update(fs.doc(db, 'revolution_questions', id), { signalements: fs.increment(1) });
  try {
    await lot.commit();
    return 'ok';
  } catch (err) {
    if ((err as { code?: string }).code?.includes('permission')) return 'deja';
    throw err;
  }
}

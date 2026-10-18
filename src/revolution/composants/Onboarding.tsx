import { useState } from 'react';
import { useRevolution } from '../contexte';
import { REGIONS } from '../regions';
import type { BadgeCitoyen } from '../types';
import { Badge, GrosBouton, Panneau } from '../ui';

/* ==========================================================================
   L'identité citoyenne : « Un humain = un vote ».
   Pseudo + code PIN à 4 chiffres. C'est tout. L'email est optionnel et ne sert
   qu'à la récupération ; le statut « vérifié » n'est qu'une garantie
   anti-multi-comptes — il n'apporte aucun pouvoir de plus.
   ========================================================================== */

/** Âge en années révolues à partir d'une date AAAA-MM-JJ. */
function age(naissance: string | null): number | null {
  if (!naissance) return null;
  const d = new Date(`${naissance}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 86400000));
}

export function Onboarding({ raison, onFermer }: { raison?: string; onFermer: () => void }) {
  const { etat, agir } = useRevolution();
  const [pseudo, setPseudo] = useState('');
  const [pin, setPin] = useState('');
  const [region, setRegion] = useState(etat.citoyen?.region ?? 'occitanie');
  const [naissance, setNaissance] = useState('');
  const [phrase, setPhrase] = useState('');
  const [modeDiscret, setModeDiscret] = useState(false);
  const [verification, setVerification] = useState(false);
  const [honneur, setHonneur] = useState(false);
  const [captcha, setCaptcha] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [erreur, setErreur] = useState('');

  const captchaAttendu = '12';
  const codeAttendu = '4821';
  const ans = age(naissance || null);
  const jeune = ans !== null && ans < 15;

  const creer = (badge: BadgeCitoyen) => {
    if (pseudo.trim().length < 3) return setErreur('Choisis un pseudo de 3 caractères minimum.');
    if (!/^\d{4}$/.test(pin)) return setErreur('Le code PIN, c’est 4 chiffres. Rien d’autre.');
    if (!region) return setErreur('La région est obligatoire : les questions locales sont régionalisées.');
    if (verification) {
      if (!honneur) return setErreur('Déclaration sur l’honneur non cochée.');
      if (captcha.trim() !== captchaAttendu) return setErreur('Vérification humaine : 7 + 5 font… ? Essaie encore.');
      if (code.trim() !== codeAttendu) return setErreur('Code de confirmation incorrect (démo : 4821).');
    }
    agir({
      type: 'citoyen',
      citoyen: {
        pseudo: jeune ? `${pseudo.trim()} (jeune)` : pseudo.trim(),
        pin,
        badge: jeune ? 'jeune' : verification ? 'verifie' : badge,
        region,
        naissance: naissance || null,
        phrase: phrase.slice(0, 140),
        modeDiscret,
      },
    });
    onFermer();
  };

  if (etat.citoyen) {
    return (
      <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
        <div className="w-full max-w-lg rounded-t-3xl border border-bord bg-carte p-5 sm:rounded-3xl">
          <h2 className="affiche text-2xl text-jaune">Tu es déjà le peuple</h2>
          <p className="mt-2 text-sm text-texte">
            Connecté en tant que <strong>{etat.citoyen.pseudo}</strong>. Le statut « vérifié » n’apporte aucun pouvoir
            supplémentaire : il garantit seulement qu’un humain vote une fois.
          </p>
          <div className="mt-4">
            <GrosBouton onClick={onFermer}>Fermer</GrosBouton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-bord bg-carte p-5 sm:rounded-3xl">
        <h2 className="affiche text-2xl text-jaune">Je suis le peuple</h2>
        <p className="mt-2 text-sm text-gris">
          {raison ?? 'Un humain = un vote.'} Deux champs, un bouton. L’email n’est jamais obligatoire.
        </p>

        <div className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wide text-gris">Pseudo</span>
              <input
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                maxLength={24}
                className="mt-1 w-full rounded-xl border border-bord bg-carte2 p-3 text-sm text-texte outline-none focus:border-jaune"
                placeholder="Camille_31"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wide text-gris">Code PIN (4 chiffres)</span>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                inputMode="numeric"
                className="mt-1 w-full rounded-xl border border-bord bg-carte2 p-3 text-sm tracking-[0.4em] text-texte outline-none focus:border-jaune"
                placeholder="••••"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wide text-gris">Région (obligatoire)</span>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="mt-1 w-full rounded-xl border border-bord bg-carte2 p-3 text-sm text-texte outline-none focus:border-jaune"
              >
                {REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nom}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wide text-gris">Date de naissance</span>
              <input
                type="date"
                value={naissance}
                onChange={(e) => setNaissance(e.target.value)}
                className="mt-1 w-full rounded-xl border border-bord bg-carte2 p-3 text-sm text-texte outline-none focus:border-jaune"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wide text-gris">
              Présentation (facultatif, 140 caractères)
            </span>
            <input
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              maxLength={140}
              className="mt-1 w-full rounded-xl border border-bord bg-carte2 p-3 text-sm text-texte outline-none focus:border-jaune"
              placeholder="Prof d’un lycée de banlieue, je veux des toilettes propres pour mes élèves."
            />
          </label>

          {jeune && (
            <p className="rounded-xl border border-bord bg-carte2 p-3 text-xs text-gris">
              🌱 Moins de 15 ans : compte « jeune citoyen ». Poids 1 sur les sujets scolaires et environnementaux, poids 0
              sur les sujets fédéraux. Passage automatique à citoyen standard à 15 ans. Ce n’est pas une sanction, c’est
              une protection.
            </p>
          )}

          <label className="flex items-center gap-2 text-xs text-gris">
            <input type="checkbox" checked={modeDiscret} onChange={(e) => setModeDiscret(e.target.checked)} />
            🕶️ Mode discret : mon pseudo apparaît comme « Citoyen #48231 » dans les classements publics.
          </label>

          {verification && (
            <Panneau accent="rouge">
              <p className="affiche text-sm text-rouge">Vérification humaine ultra-légère</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge ton="jaune">Citoyen</Badge>
                <span className="text-gris">→</span>
                <Badge ton="rouge">Citoyen vérifié</Badge>
                <span className="text-[11px] text-gris">
                  Droit de vote sur les questions fédérales. Aucun pouvoir de plus dans les classements.
                </span>
              </div>
              <label className="mt-3 flex items-start gap-2 text-xs text-texte">
                <input type="checkbox" checked={honneur} onChange={(e) => setHonneur(e.target.checked)} className="mt-0.5" />
                Je déclare sur l’honneur être une personne humaine, ne voter qu’une fois, et ne pas utiliser de comptes
                multiples.
              </label>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <label className="block">
                  <span className="text-[10px] font-bold uppercase text-gris">Vérification humaine : 7 + 5 = ?</span>
                  <input
                    value={captcha}
                    onChange={(e) => setCaptcha(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-bord bg-carte2 p-2 text-sm text-texte outline-none focus:border-jaune"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold uppercase text-gris">Email ou téléphone (optionnel)</span>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-bord bg-carte2 p-2 text-sm text-texte outline-none focus:border-jaune"
                    placeholder="pour recevoir le code"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold uppercase text-gris">Code reçu (démo : 4821)</span>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-bord bg-carte2 p-2 text-sm text-texte outline-none focus:border-jaune"
                  />
                </label>
              </div>
            </Panneau>
          )}

          {erreur && <p className="text-xs font-bold text-rouge">⚠️ {erreur}</p>}

          <div className="flex flex-wrap gap-2">
            <GrosBouton onClick={() => creer('citoyen')}>✊ Je suis le peuple</GrosBouton>
            {!verification ? (
              <GrosBouton variante="neutre" onClick={() => setVerification(true)}>
                ✔ Devenir citoyen vérifié
              </GrosBouton>
            ) : (
              <GrosBouton variante="rouge" onClick={() => creer('verifie')}>
                ✔ Valider et devenir vérifié
              </GrosBouton>
            )}
            <GrosBouton
              variante="neutre"
              onClick={() => {
                agir({
                  type: 'citoyen',
                  citoyen: {
                    pseudo: `Citoyen #${Math.floor(10000 + Math.random() * 89999)}`,
                    pin: '0000',
                    badge: 'citoyen',
                    region,
                    naissance: null,
                    phrase: '',
                    modeDiscret: true,
                  },
                });
                onFermer();
              }}
            >
              🔵 Continuer avec Google / Apple
            </GrosBouton>
            <GrosBouton variante="neutre" onClick={onFermer}>
              Plus tard
            </GrosBouton>
          </div>
          <p className="text-[11px] text-gris">
            Aucune IP stockée, aucun traçage. Un vote par question et par cycle horaire, modifiable jusqu’au top horaire.
          </p>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef } from 'react';
import { useRevolution } from '../contexte';
import type { Sujet } from '../types';
import { nombre, pct, statsQuestion } from '../outils';
import { GrosBouton, Panneau } from '../ui';

/* ==========================================================================
   L'affiche de partage : une image PNG aux couleurs de la charte, prête pour
   WhatsApp / Instagram / X. Elle est dessinée dans le navigateur, sans service
   extérieur, et n'envoie rien nulle part.
   ========================================================================== */

const LARGEUR = 1080;
const HAUTEUR = 1350;

export function AffichePartage({ sujet }: { sujet: Sujet }) {
  const { etat, agir } = useRevolution();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const partage = etat.partages[sujet.id];

  const phare = [...sujet.questions].sort((a, b) => statsQuestion(b).ouiPct - statsQuestion(a).ouiPct)[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const st = statsQuestion(phare);

    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, LARGEUR, HAUTEUR);

    // Bandeau jaune + bandeau rouge.
    ctx.fillStyle = '#F2B705';
    ctx.fillRect(0, 0, LARGEUR, 24);
    ctx.fillStyle = '#C8102E';
    ctx.fillRect(0, HAUTEUR - 24, LARGEUR, 24);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#F2B705';
    ctx.font = 'bold 34px "Arial Black", Arial, sans-serif';
    ctx.fillText('RÉVOLUTION — DÉMOCRATIE CONTINUE', LARGEUR / 2, 110);

    ctx.font = '150px "Segoe UI Emoji", serif';
    ctx.fillText(sujet.emoji, LARGEUR / 2, 300);

    ctx.fillStyle = '#F4F4F4';
    ctx.font = 'bold 72px "Arial Black", Arial, sans-serif';
    const mots = sujet.nom.toUpperCase().split(' ');
    let y = 400;
    let ligne = '';
    for (const mot of mots) {
      const essai = ligne ? `${ligne} ${mot}` : mot;
      if (ctx.measureText(essai).width > LARGEUR - 120) {
        ctx.fillText(ligne, LARGEUR / 2, y);
        y += 82;
        ligne = mot;
      } else {
        ligne = essai;
      }
    }
    ctx.fillText(ligne, LARGEUR / 2, y);

    // La question phare.
    ctx.fillStyle = '#C8102E';
    ctx.fillRect(70, y + 60, LARGEUR - 140, 6);
    ctx.fillStyle = '#F4F4F4';
    ctx.font = '42px "Helvetica Neue", Arial, sans-serif';
    const question = phare.texte;
    const motsQ = question.split(' ');
    let ligneQ = '';
    let yq = y + 140;
    for (const mot of motsQ) {
      const essai = ligneQ ? `${ligneQ} ${mot}` : mot;
      if (ctx.measureText(essai).width > LARGEUR - 160) {
        ctx.fillText(ligneQ, LARGEUR / 2, yq);
        yq += 56;
        ligneQ = mot;
      } else {
        ligneQ = essai;
      }
    }
    ctx.fillText(ligneQ, LARGEUR / 2, yq);

    // Le chiffre qui parle.
    ctx.fillStyle = '#F2B705';
    ctx.font = 'bold 190px "Arial Black", Arial, sans-serif';
    ctx.fillText(`${Math.round(st.ouiPct)}%`, LARGEUR / 2, yq + 230);
    ctx.fillStyle = '#F4F4F4';
    ctx.font = 'bold 46px "Arial Black", Arial, sans-serif';
    ctx.fillText('DE OUI', LARGEUR / 2, yq + 290);
    ctx.fillStyle = '#9D9D9D';
    ctx.font = '34px Arial, sans-serif';
    ctx.fillText(`${nombre(st.total)} votants`, LARGEUR / 2, yq + 340);

    ctx.fillStyle = '#F2B705';
    ctx.font = 'bold 40px "Arial Black", Arial, sans-serif';
    ctx.fillText('« À force de tirer sur le fil', LARGEUR / 2, HAUTEUR - 170);
    ctx.fillText('du peuple, il casse. »', LARGEUR / 2, HAUTEUR - 120);
    ctx.fillStyle = '#9D9D9D';
    ctx.font = '30px Arial, sans-serif';
    ctx.fillText('https://revolution.alphabette.fr', LARGEUR / 2, HAUTEUR - 60);
  }, [sujet, phare]);

  const telecharger = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const lien = document.createElement('a');
    lien.href = canvas.toDataURL('image/png');
    lien.download = `revolution-${sujet.id}.png`;
    lien.click();
  };

  const copier = async () => {
    const texte = partage?.lien ?? `https://revolution.alphabette.fr/s/${sujet.id.slice(0, 5)}`;
    try {
      await navigator.clipboard.writeText(texte);
    } catch {
      /* presse-papiers refusé : le lien reste affiché à l'écran. */
    }
  };

  return (
    <Panneau>
      <p className="affiche text-lg text-jaune">📣 Appel du peuple — partager ce sujet</p>
      <p className="mt-1 text-xs text-gris">
        Une affiche générée dans ton navigateur, un lien court, et le compteur des votes que ton partage a apportés.
      </p>
      <canvas
        ref={canvasRef}
        width={LARGEUR}
        height={HAUTEUR}
        className="mt-3 w-full max-w-sm rounded-xl border border-bord"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <GrosBouton onClick={telecharger}>⬇️ Télécharger l’affiche</GrosBouton>
        <GrosBouton
          variante="neutre"
          onClick={() => {
            agir({ type: 'partage', sujetId: sujet.id });
            void copier();
          }}
        >
          🔗 Créer et copier mon lien
        </GrosBouton>
      </div>
      {partage ? (
        <p className="mt-3 text-xs font-bold text-jaune">
          Ton lien : {partage.lien} — il a déjà fait voter {nombre(partage.votes)} personnes.
        </p>
      ) : (
        <p className="mt-3 text-[11px] text-gris">Aucun lien créé pour l’instant.</p>
      )}
    </Panneau>
  );
}

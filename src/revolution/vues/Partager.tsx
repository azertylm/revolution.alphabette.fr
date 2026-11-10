import { useEffect, useState } from 'react';
import { GrosBouton, Panneau } from '../ui';

export function lienQuestion(id: string) {
  return `${window.location.origin}${window.location.pathname}#/q/${id}`;
}

/** Lien, QR code à imprimer et partage natif du téléphone. */
export function BlocPartage({ id, texte }: { id: string; texte: string }) {
  const lien = lienQuestion(id);
  const [qr, setQr] = useState<string | null>(null);
  const [copie, setCopie] = useState(false);

  useEffect(() => {
    let vivant = true;
    void import('qrcode').then((m) =>
      m.toDataURL(lien, { margin: 1, width: 360, errorCorrectionLevel: 'M' }).then((url) => vivant && setQr(url)),
    );
    return () => {
      vivant = false;
    };
  }, [lien]);

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(`${texte}\nRéponds ici : ${lien}`);
      setCopie(true);
      window.setTimeout(() => setCopie(false), 2500);
    } catch {
      window.prompt('Copie ce lien :', lien);
    }
  };

  const partagerNatif = async () => {
    try {
      await navigator.share({ title: 'Révolution', text: texte, url: lien });
    } catch {
      /* partage annulé */
    }
  };

  return (
    <Panneau className="space-y-3">
      <p className="text-xs font-black uppercase tracking-wide text-gris">Partager la question</p>
      <p className="break-all rounded-xl border-2 border-bord bg-carte2 p-3 text-sm text-texte">{lien}</p>
      <div className="flex flex-wrap gap-2">
        <GrosBouton onClick={() => void copier()}>{copie ? 'Copié ✓' : 'Copier le lien'}</GrosBouton>
        {'share' in navigator && (
          <GrosBouton variante="neutre" onClick={() => void partagerNatif()}>
            Envoyer…
          </GrosBouton>
        )}
      </div>
      {qr && (
        <div className="flex flex-col items-center gap-2">
          <img src={qr} alt="QR code vers la question" className="h-48 w-48 rounded-lg bg-white p-2" />
          <a href={qr} download={`revolution-question-${id}.png`} className="text-sm font-bold underline">
            Télécharger le QR code (à imprimer sur une affiche ou un tract)
          </a>
        </div>
      )}
    </Panneau>
  );
}

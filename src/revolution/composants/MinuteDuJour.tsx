import { useRevolution } from '../contexte';
import { minuteDuJour, peupleInstruit, reponsesMinute } from '../education';
import { jourISO, nombre } from '../outils';
import { Badge, Panneau, TitreSection } from '../ui';

/* ==========================================================================
   LA MINUTE CITOYENNE — une seule fois par jour (prompt 9).

   Trente secondes par jour pour apprendre une règle du jeu démocratique. On ne
   la revoit jamais deux fois : la question tourne selon le jour de l'année. La
   jauge « Le peuple s'instruit » rend la progression collective visible.
   ========================================================================== */

export function MinuteDuJour() {
  const { etat, agir } = useRevolution();
  const jour = jourISO(new Date());
  const question = minuteDuJour(jour);
  const dejaRepondu = etat.minute.dernierJour === jour;
  const maReponse = etat.minute.reponses[jour];
  const jauge = peupleInstruit(etat.minute);

  return (
    <Panneau accent="jaune">
      <TitreSection droite={<Badge ton="jaune">⏱️ 30 secondes</Badge>}>🎓 La minute citoyenne</TitreSection>

      <div className="rounded-xl border-2 border-bord bg-carte2 p-3">
        {dejaRepondu ? (
          <>
            <p className="text-[11px] font-black uppercase tracking-wide text-gris">
              Ta minute du jour est terminée — reviens demain.
            </p>
            <p className="mt-2 affiche text-sm text-texte">{question.question}</p>
            <p className="mt-2 text-sm text-jaune">💡 {question.explication}</p>
            <p className="mt-2 text-[11px] text-gris">
              Ta réponse : {maReponse === 'savais' ? '« je le savais »' : '« je ne savais pas »'}. Une seule minute par
              jour : jamais deux fois la même séance.
            </p>
          </>
        ) : (
          <>
            <p className="text-[11px] font-black uppercase tracking-wide text-gris">La question du jour</p>
            <p className="mt-2 affiche text-base text-texte sm:text-lg">{question.question}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => agir({ type: 'minute-reponse', jour, questionId: question.id, appris: false })}
                className="affiche min-h-[3.25rem] rounded-xl bg-jaune text-sm text-black"
              >
                🤷 Je ne savais pas
              </button>
              <button
                type="button"
                onClick={() => agir({ type: 'minute-reponse', jour, questionId: question.id, appris: true })}
                className="affiche min-h-[3.25rem] rounded-xl border-[3px] border-bord bg-carte2 text-sm text-texte"
              >
                ✅ Je le savais
              </button>
            </div>
          </>
        )}
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-black uppercase tracking-wide text-gris">📚 Le peuple s’instruit</span>
          <span className="affiche text-sm text-jaune">{jauge} %</span>
        </div>
        <div className="mt-1 h-4 w-full overflow-hidden rounded-full bg-bord">
          <div className="h-full bg-jaune" style={{ width: `${jauge}%` }} />
        </div>
        <p className="mt-1 text-[11px] text-gris">
          {nombre(reponsesMinute(etat.minute))} réponses au total, dont {nombre(etat.minute.appris + etat.minute.suConnu)}{' '}
          de ton appareil. Les questions sont tirées du dictionnaire citoyen : on apprend en votant.
        </p>
      </div>
    </Panneau>
  );
}

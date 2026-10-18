import { useRevolution } from '../contexte';
import { exigences } from '../moteur';
import { REGIONS, REGIONS_METROPOLE, nomRegion } from '../regions';
import { joursRestants, nombre } from '../outils';
import { Badge, Etiquette, GrosBouton, Panneau, TitreSection } from '../ui';

/* ==========================================================================
   🗺️ « Le fil du peuple » : la carte de France des sections.
   Point jaune = section active · point rouge = rendez-vous officiel à venir.
   Un sujet présent dans 5 régions devient un sujet national.
   ========================================================================== */

const CONTOUR =
  'M52 4 L78 14 L92 40 L86 62 L74 84 L46 94 L24 86 L8 62 L12 34 Z';

export function FilDuPeuple() {
  const { etat } = useRevolution();

  const sectionsDe = (id: string) => {
    const infos = REGIONS.find((r) => r.id === id);
    if (!infos) return [];
    return etat.sections.filter(
      (s) => s.territoire === infos.nom || s.territoire === infos.communeExemple || s.territoire === infos.departementExemple,
    );
  };

  const rdvDe = (id: string) => {
    const infos = REGIONS.find((r) => r.id === id);
    if (!infos) return [];
    return etat.rendezVous.filter(
      (rdv) =>
        rdv.statut !== 'termine' &&
        joursRestants(rdv.date) >= 0 &&
        (rdv.territoire === infos.nom || rdv.territoire === infos.communeExemple || rdv.territoire === infos.departementExemple),
    );
  };

  const totalSections = etat.sections.length;
  const totalCitoyens = etat.sections.reduce((acc, s) => acc + s.citoyensActifs, 0);
  const prochains = etat.rendezVous.filter((r) => r.statut === 'officiel' && joursRestants(r.date) >= 0);
  const adoptions = etat.sujets.filter((s) => s.regionsSoutenantes.length > 0 && s.statut === 'officiel');

  return (
    <div className="space-y-5">
      <Panneau>
        <TitreSection droite={<Badge ton="jaune">{totalSections} sections</Badge>}>
          🗺️ Le fil du peuple
        </TitreSection>
        <p className="text-xs text-gris">
          {nombre(totalCitoyens)} citoyens répartis dans {nombre(REGIONS.length)} régions. Chaque point est une
          section locale réelle : celle de ta commune, de ton département, de ta région. La carte est stylisée, les
          données sont simulées pour le prototype.
        </p>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row">
          <svg viewBox="0 0 100 100" className="w-full max-w-xs shrink-0 self-center" role="img" aria-label="Carte stylisée de France">
            <path d={CONTOUR} fill="#161616" stroke="#F2B705" strokeWidth="0.7" />
            {REGIONS_METROPOLE.map((r) => {
              const sections = sectionsDe(r.id);
              const rdvs = rdvDe(r.id);
              const actif = sections.length > 0;
              const rouge = rdvs.length > 0;
              return (
                <g key={r.id}>
                  <title>
                    {r.nom} — {sections.length} section(s), {rdvs.length} rendez-vous à venir
                  </title>
                  {rouge && (
                    <circle cx={r.x} cy={r.y} r={4.2} fill="none" stroke="#C8102E" strokeWidth="1.4" className="clignote" />
                  )}
                  <circle cx={r.x} cy={r.y} r={actif ? 2.6 : 1.6} fill={rouge ? '#C8102E' : actif ? '#F2B705' : '#5b5b5b'} />
                  <text x={r.x} y={r.y - 4} textAnchor="middle" fontSize="3" fill="#9D9D9D">
                    {r.nom.length > 14 ? r.nom.slice(0, 12) + '…' : r.nom}
                  </text>
                </g>
              );
            })}
            <text x={4} y={99} fontSize="3.4" fill="#9D9D9D">
              DROM — encart
            </text>
            {REGIONS.slice(13).map((r, i) => {
              const actif = sectionsDe(r.id).length > 0;
              return (
                <circle key={r.id} cx={8 + i * 18} cy={93} r={actif ? 2.2 : 1.4} fill={actif ? '#F2B705' : '#5b5b5b'}>
                  <title>{r.nom}</title>
                </circle>
              );
            })}
          </svg>

          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap gap-3 text-[11px] font-bold text-gris">
              <span className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-jaune" /> Section active
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-rouge" /> Rendez-vous à venir
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-[#5b5b5b]" /> Rien d’ouvert encore
              </span>
            </div>
            <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {REGIONS.map((r) => {
                const sections = sectionsDe(r.id);
                const rdvs = rdvDe(r.id);
                const citoyens = sections.reduce((acc, s) => acc + s.citoyensActifs, 0);
                return (
                  <li key={r.id} className="flex items-center justify-between gap-2 rounded-xl border border-bord bg-carte2 px-3 py-2">
                    <span className="text-xs font-bold text-texte">{r.nom}</span>
                    <span className="flex flex-wrap items-center gap-2 text-[10px] text-gris">
                      {citoyens > 0 && <span>{nombre(citoyens)} citoyens</span>}
                      {sections.length > 0 && <Badge ton="jaune">{sections.length} section(s)</Badge>}
                      {rdvs.length > 0 && <Badge ton="rouge">{rdvs.length} RDV</Badge>}
                      {sections.length === 0 && rdvs.length === 0 && <Etiquette>dormant</Etiquette>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </Panneau>

      <Panneau accent="rouge">
        <TitreSection droite={<Badge ton="rouge">{prochains.length} à venir</Badge>}>
          📅 Calendrier national des rendez-vous
        </TitreSection>
        <ul className="space-y-2">
          {prochains.map((rdv) => (
            <li key={rdv.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-bord bg-carte2 px-3 py-2">
              <span className="text-xs text-texte">
                <strong>{rdv.niveau === 'national' ? 'France entière' : rdv.territoire}</strong> — {rdv.nature}
              </span>
              <span className="text-[11px] font-bold text-gris">
                dans {joursRestants(rdv.date)} jour(s) · {rdv.lieu}
              </span>
            </li>
          ))}
          {prochains.length === 0 && <li className="text-sm text-gris">Aucun rendez-vous à venir.</li>}
        </ul>
      </Panneau>

      <section className="space-y-3">
        <TitreSection>🇫🇷 Devenir un sujet national</TitreSection>
        <p className="text-xs text-gris">
          Un sujet qui dépasse un fort soutien dans 5 régions n’est plus local : il est proposé au vote national et
          entre au cahier de l’Assemblée. Le problème de l’un devient le problème de tous.
        </p>
        {adoptions.map((sujet) => {
          const n = sujet.regionsSoutenantes.length;
          return (
            <Panneau key={sujet.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="affiche text-sm text-texte">
                  {sujet.emoji} {sujet.nom}
                </p>
                <Badge ton={n >= 5 ? 'rouge' : 'jaune'}>
                  {n}/5 régions {n >= 5 ? '· sujet national' : ''}
                </Badge>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-bord">
                <div className="h-full bg-jaune" style={{ width: `${Math.min(100, (n / 5) * 100)}%` }} />
              </div>
              <p className="mt-2 text-[11px] text-gris">
                Régions soutenantes : {sujet.regionsSoutenantes.map((id) => nomRegion(id)).join(', ')}
              </p>
              {n >= 5 && (
                <p className="mt-1 text-[11px] font-bold text-jaune">
                  Ce problème existe partout : {nombre(exigences(etat).filter((e) => e.sujet.id === sujet.id).length)}{' '}
                  exigence(s) déjà au cahier national.
                </p>
              )}
            </Panneau>
          );
        })}
      </section>

      <div className="flex flex-wrap gap-2">
        <GrosBouton variante="neutre" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          ↑ Revenir en haut
        </GrosBouton>
      </div>
    </div>
  );
}

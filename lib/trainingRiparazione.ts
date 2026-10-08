/**
 * Il piano di Claude si AGGIUSTA, non si butta (Ste, 7/10: "me l'ha fatto standard… capita troppo spesso").
 *
 * Prima ogni violazione meccanica (seduta troppo lunga, giorno sbagliato, formato di parte alta doppio,
 * una giornata in più o in meno, troppe giornate fisiche, un id non in libreria) rimandava il piano a Claude,
 * e dopo tre no l'intera settimana finiva nel piano base, anche quando tre giornate su quattro erano giuste.
 * Qui il server corregge da solo le cose che sa correggere, PRIMA del validatore, e dice al ragazzo cosa ha
 * sistemato (`riparazioni`, mostrate nell'hub). Le regole di merito (obiettivi, finestre partita, carico)
 * restano al validatore: su quelle Claude riprova con gli errori nel messaggio.
 *
 * Modulo puro (test in tests/trainingRiparazione.test.ts): niente rete, niente Supabase.
 */
import { DAY_NAMES } from './constants';
import type { Blocco } from './trainingBlocks';
import { aperturaPer, isApertura } from './trainingFascia';
import { isParteAlta, ordineFormatiParteAlta, PA_SERIE_ID, PA_SERIE_SHORT_ID } from './trainingParteAlta';
import { gruppoParteBassa, isParteBassa, ordineFormatiParteBassa, PB_RICHIAMO_ID, PB_SERIE_ID, PB_SERIE_SHORT_ID } from './trainingParteBassa';
import { giorniAllaPartita, QUALITA_FISICHE } from './trainingRulesV2';
import { RISC_VELOCITA_ID } from './trainingVelocita';
import type { ContextV2, PianoLLM, SedutaLLM } from './trainingPlannerV2';

export interface OpzioniRiparazione {
  /** Giornate chieste dall'atleta (già clampate ai giorni rimasti); null = decide il planner. */
  nRichieste: number | null;
  /** Giorni in cui una seduta può ancora stare (da oggi, ammessi, non vietati). */
  giorniRimasti: number[];
}

const giornoNome = (d: number) => DAY_NAMES[d] ?? String(d);
const gruppoParteAlta = (id: string) => (id === PA_SERIE_SHORT_ID ? PA_SERIE_ID : id);

/** Blocchi che stanno in testa alla seduta e non si toccano mai (apertura fascia, riscaldamento velocità). */
const obbligatorio = (b: Blocco) => isApertura(b) || b.id === RISC_VELOCITA_ID;

/**
 * Riparazioni meccaniche sul piano proposto da Claude, nell'ordine: id non in libreria → giorni → sedute da
 * recuperare → formati doppi → numero di giornate → tetto fisico → durata. Ritorna il piano corretto e le righe per l'atleta.
 */
export function riparaPiano(p: PianoLLM, ctx: ContextV2, o: OpzioniRiparazione): { piano: PianoLLM; riparazioni: string[] } {
  const note: string[] = [];
  const disp = new Map(ctx.blocchi.map((b) => [b.id, b] as const));
  const isDeload = ctx.base.ciclo.isDeload;
  const maxDurata = Math.min(ctx.maxDurata, ctx.vincoli.durataMax ?? ctx.maxDurata);
  const matchDays = ctx.base.matchDays;
  const blocco = (id: string) => disp.get(id)!;
  const isFisica = (s: SedutaLLM) => s.blocchi.some((id) => QUALITA_FISICHE.has(blocco(id).qualita));
  const contiene = (s: SedutaLLM, r: { blocchi: string[] }) => r.blocchi.every((id) => s.blocchi.includes(id));
  const isRecupero = (s: SedutaLLM) => ctx.daRecuperare.some((r) => contiene(s, r));
  // L'apertura (8/10) sta fuori dal tempo della seduta: non conta nella durata da far rientrare
  const durata = (s: SedutaLLM) => Math.round(s.blocchi.reduce((a, id) => a + (isApertura(blocco(id)) ? 0 : blocco(id).durataMin * (s.leggeri?.includes(id) ? 0.85 : 1)), 0) * (isDeload ? 0.8 : 1));

  // 1. Id non in libreria (o doppi nella stessa giornata): via; una giornata rimasta vuota sparisce
  let sedute: SedutaLLM[] = (p.sedute || []).map((s) => {
    const ids = Array.isArray(s.blocchi) ? s.blocchi.filter((id): id is string => typeof id === 'string') : [];
    const ok: string[] = [];
    const via: string[] = [];
    for (const id of ids) { if (!disp.has(id)) via.push(id); else if (!ok.includes(id)) ok.push(id); }
    if (via.length) note.push(`${giornoNome(Number(s.giorno))}: ${via.length === 1 ? 'un blocco' : `${via.length} blocchi`} non in libreria, tolti`);
    return { ...s, giorno: Number(s.giorno), blocchi: ok, leggeri: Array.isArray(s.leggeri) ? s.leggeri.filter((id) => ok.includes(id)) : undefined };
  }).filter((s) => s.blocchi.length > 0).sort((a, b) => a.giorno - b.giorno);

  // 2. Giorni: passati, vietati, non ammessi, di partita o già occupati → il giorno libero più vicino
  //    (una seduta fisica mai il giorno prima della partita); senza un giorno libero la seduta salta
  const ammesso = (d: number) => o.giorniRimasti.includes(d) && !matchDays.includes(d);
  const dopoPartita = new Set(matchDays.map((md) => (md === 7 ? 1 : md + 1)));
  const occupati = new Set<number>();
  for (const s of sedute) {
    if (ammesso(s.giorno) && !occupati.has(s.giorno)) { occupati.add(s.giorno); continue; }
    const fisica = isFisica(s);
    // una seduta fisica non va né il giorno prima della partita (finestre) né quello dopo (regola 3: niente gambe)
    const cand = o.giorniRimasti.filter((d) => ammesso(d) && !occupati.has(d) && (!fisica || ((giorniAllaPartita(d, matchDays) ?? 9) > 1 && !dopoPartita.has(d))))
      .sort((a, b) => Math.abs(a - s.giorno) - Math.abs(b - s.giorno) || a - b);
    const da = giornoNome(s.giorno);
    if (cand.length === 0) { note.push(`${da}: seduta tolta, nessun giorno libero dove spostarla`); s.giorno = -1; continue; }
    const perche = matchDays.includes(s.giorno) ? 'giorno della partita' : occupati.has(s.giorno) ? 'giorno già occupato' : s.giorno < (o.giorniRimasti[0] ?? 1) ? 'giorno già passato' : 'giorno non disponibile';
    s.giorno = cand[0];
    occupati.add(s.giorno);
    note.push(`${da} → ${giornoNome(s.giorno)}: spostata (${perche})`);
  }
  sedute = sedute.filter((s) => s.giorno > 0).sort((a, b) => a.giorno - b.giorno);

  // 2b. Sedute da recuperare (piano automatico): la seduta saltata la settimana scorsa va riproposta con tutti i suoi
  //     blocchi. Se Claude ne ha messa una simile la completa; se manca, entra nel primo giorno libero o al posto della
  //     giornata leggera più in là (7/10: "manca la seduta da recuperare" per tre volte → piano base)
  const attesi = ctx.base.painHold || ctx.vincoli.recuperiFacoltativi ? []
    : ctx.daRecuperare.filter((r) => r.blocchi.every((id) => disp.has(id)) && r.blocchi.reduce((a, id) => a + (isApertura(blocco(id)) ? 0 : blocco(id).durataMin), 0) <= maxDurata);
  for (const r of attesi) {
    if (sedute.some((s) => contiene(s, r))) continue;
    const fisica = r.blocchi.some((id) => QUALITA_FISICHE.has(blocco(id).qualita));
    const giornoBuono = (d: number) => ammesso(d) && (!fisica || ((giorniAllaPartita(d, matchDays) ?? 9) > 1 && !dopoPartita.has(d)));
    // una seduta con almeno un blocco principale in comune, in un giorno buono, si completa se poi sta nel tempo
    const simile = sedute.find((s) => !isRecupero(s) && giornoBuono(s.giorno) && r.blocchi.some((id) => s.blocchi.includes(id) && !obbligatorio(blocco(id))));
    if (simile) {
      const completata = { ...simile, blocchi: [...simile.blocchi, ...r.blocchi.filter((id) => !simile.blocchi.includes(id))] };
      if (durata(completata) <= maxDurata) { simile.blocchi = completata.blocchi; simile.titolo = r.titolo; note.push(`${giornoNome(simile.giorno)}: completata con i blocchi della seduta da recuperare "${r.titolo}"`); continue; }
    }
    const occ = new Set(sedute.map((s) => s.giorno));
    let giorno = o.giorniRimasti.find((d) => giornoBuono(d) && !occ.has(d));
    if (giorno === undefined) {
      const vittima = [...sedute].reverse().find((s) => !isRecupero(s) && !isFisica(s) && giornoBuono(s.giorno))
        ?? [...sedute].reverse().find((s) => !isRecupero(s) && giornoBuono(s.giorno));
      if (!vittima) continue; // nessun posto: lo dirà il validatore
      giorno = vittima.giorno;
      sedute = sedute.filter((s) => s !== vittima);
      note.push(`${giornoNome(giorno)}: al posto della giornata proposta c'è la seduta da recuperare "${r.titolo}" (saltata la settimana scorsa)`);
    } else note.push(`${giornoNome(giorno)}: aggiunta la seduta da recuperare "${r.titolo}" (saltata la settimana scorsa)`);
    sedute.push({ giorno, titolo: r.titolo, blocchi: [...r.blocchi], spiegazione: 'Recupero della seduta saltata la settimana scorsa.' });
  }
  sedute.sort((a, b) => a.giorno - b.giorno);

  // 3. Formati sui gradini (pa-* / pb-*) una volta a settimana: il doppione diventa il prossimo formato libero, o esce.
  //    I recuperi contano per primi e non si toccano
  const usatiPa = new Set<string>();
  const usatiPb = new Set<string>();
  for (const s of ctx.sedutePassate ?? []) for (const b of s.blocchi ?? []) { if (isParteAlta(b.id)) usatiPa.add(gruppoParteAlta(b.id)); if (isParteBassa(b.id)) usatiPb.add(gruppoParteBassa(b.id)); }
  for (const s of sedute.filter(isRecupero)) for (const id of s.blocchi) { if (isParteAlta(id)) usatiPa.add(gruppoParteAlta(id)); if (isParteBassa(id)) usatiPb.add(gruppoParteBassa(id)); }
  for (const s of sedute) {
    if (isRecupero(s)) continue;
    const nuovi: string[] = [];
    for (const id of s.blocchi) {
      const pa = isParteAlta(id); const pb = isParteBassa(id);
      if (!pa && !pb) { nuovi.push(id); continue; }
      const usati = pa ? usatiPa : usatiPb;
      const gruppo = pa ? gruppoParteAlta : gruppoParteBassa;
      if (!usati.has(gruppo(id))) { usati.add(gruppo(id)); nuovi.push(id); continue; }
      const ordine = (pa ? ordineFormatiParteAlta(isDeload) : ordineFormatiParteBassa(isDeload)).filter((x) => x !== PB_RICHIAMO_ID);
      const alt = ordine.find((x) => disp.has(x) && !usati.has(gruppo(x)) && !nuovi.includes(x));
      if (alt) { usati.add(gruppo(alt)); nuovi.push(alt); note.push(`${giornoNome(s.giorno)}: ${pa ? 'parte alta' : 'gambe'} in un altro formato (quello scelto era già nella settimana)`); }
      else note.push(`${giornoNome(s.giorno)}: ${pa ? 'parte alta' : 'gambe'} tolta (quel formato era già nella settimana)`);
    }
    s.blocchi = nuovi;
  }
  sedute = sedute.filter((s) => s.blocchi.length > 0);

  // 4. Giornate chieste dall'atleta: le extra escono (prima le leggere, mai un recupero), quelle che mancano
  //    diventano giornate leggere (apertura + tecnica o mobilità) nei giorni liberi
  if (o.nRichieste !== null) {
    while (sedute.length > o.nRichieste) {
      const vittima = [...sedute].reverse().find((s) => !isRecupero(s) && !isFisica(s))
        ?? [...sedute].reverse().find((s) => !isRecupero(s)) ?? sedute[sedute.length - 1];
      sedute = sedute.filter((s) => s !== vittima);
      note.push(`${giornoNome(vittima.giorno)}: giornata tolta (ne avevi chieste ${o.nRichieste})`);
    }
    while (sedute.length < o.nRichieste) {
      const occ = new Set(sedute.map((s) => s.giorno));
      const liberi = o.giorniRimasti.filter((d) => ammesso(d) && !occ.has(d));
      const giorno = liberi.find((d) => !ctx.base.trainingDays.includes(d)) ?? liberi[0];
      const leggera = giornataLeggera(ctx, giorno, maxDurata);
      if (giorno === undefined || !leggera) break;
      sedute.push(leggera);
      note.push(`${giornoNome(giorno)}: aggiunta una giornata leggera (ne avevi chieste ${o.nRichieste})`);
    }
    sedute.sort((a, b) => a.giorno - b.giorno);
  }

  // 5. Tetto delle giornate fisiche della fase: le ultime in più diventano leggere (apertura + tecnica/mobilità)
  let fisiche = sedute.filter(isFisica).length + (ctx.sedutePassate ?? []).filter((s) => s.tipo === 'fisica' || s.tipo === 'mix').length;
  for (const s of [...sedute].reverse()) {
    if (fisiche <= ctx.maxSeduteFisiche) break;
    if (!isFisica(s) || isRecupero(s)) continue;
    const leggera = giornataLeggera(ctx, s.giorno, maxDurata, s.blocchi.filter((id) => obbligatorio(blocco(id))));
    if (!leggera) { sedute = sedute.filter((x) => x !== s); note.push(`${giornoNome(s.giorno)}: giornata tolta (oltre il tetto di ${ctx.maxSeduteFisiche} fisiche)`); }
    else { s.blocchi = leggera.blocchi; s.leggeri = undefined; s.titolo = leggera.titolo; s.spiegazione = leggera.spiegazione; note.push(`${giornoNome(s.giorno)}: diventa leggera (oltre il tetto di ${ctx.maxSeduteFisiche} giornate fisiche)`); }
    fisiche--;
  }

  // 6. Durata: via i blocchi facoltativi dal più lungo (il principale e l'apertura restano), poi la versione breve del principale
  for (const s of sedute) {
    if (durata(s) <= maxDurata || isRecupero(s)) continue;
    const principale = s.blocchi.map(blocco).find((b) => !obbligatorio(b));
    const facoltativi = s.blocchi.filter((id) => id !== principale?.id && !obbligatorio(blocco(id))).sort((a, b) => blocco(b).durataMin - blocco(a).durataMin);
    const tolti: string[] = [];
    for (const id of facoltativi) { if (durata(s) <= maxDurata) break; s.blocchi = s.blocchi.filter((x) => x !== id); tolti.push(id); }
    let breve: Blocco | undefined;
    if (durata(s) > maxDurata && principale) {
      breve = versioneBreve(ctx, principale);
      if (breve) s.blocchi = s.blocchi.map((id) => (id === principale.id ? breve!.id : id));
    }
    if (s.leggeri) s.leggeri = s.leggeri.filter((id) => s.blocchi.includes(id));
    if (tolti.length || breve) note.push(`${giornoNome(s.giorno)}: accorciata per stare nei ${maxDurata}'${tolti.length ? ` (${tolti.length === 1 ? 'un blocco in meno' : `${tolti.length} blocchi in meno`})` : ''}${breve ? ', versione breve' : ''}`);
  }

  return { piano: { ...p, sedute }, riparazioni: note };
}

/** La versione breve dello stesso blocco: `pa-serie` → breve, `pb-serie` → breve, o il workout short dello stesso codice. */
export function versioneBreve(ctx: ContextV2, b: Blocco): Blocco | undefined {
  const disp = (id: string) => ctx.blocchi.find((x) => x.id === id);
  if (b.id === PA_SERIE_ID) return disp(PA_SERIE_SHORT_ID);
  if (b.id === PB_SERIE_ID) return disp(PB_SERIE_SHORT_ID);
  if (b.variante === 'short' || isParteAlta(b.id) || isParteBassa(b.id)) return undefined;
  return ctx.blocchi.find((x) => x.famiglia === b.famiglia && x.livello === b.livello && x.progressione === b.progressione
    && (x.sottovariante ?? '') === (b.sottovariante ?? '') && x.variante === 'short' && x.durataMin < b.durataMin);
}

/** Giornata leggera come la costruisce il piano base: apertura (fuori dal tempo) + tecnica con la palla (o mobilità), entro il tempo. */
export function giornataLeggera(ctx: ContextV2, giorno: number, maxDurata: number, inTesta: string[] = []): SedutaLLM | null {
  const perQualita = (q: string) => ctx.blocchi.filter((b) => b.qualita === q && !isApertura(b)).sort((a, b) => (a.progressione ?? 1) - (b.progressione ?? 1) || a.durataMin - b.durataMin)[0];
  const apertura = inTesta.length ? undefined : aperturaPer(ctx.blocchi, maxDurata);
  const testa = inTesta.length ? inTesta : apertura ? [apertura.id] : [];
  const minutiTesta = testa.reduce((a, id) => { const b = ctx.blocchi.find((x) => x.id === id); return a + (b && !isApertura(b) ? b.durataMin : 0); }, 0);
  const principale = [perQualita('tecnica-palleggi'), perQualita('mobilita-recupero'), perQualita('fascia-prevenzione')]
    .find((b) => b && minutiTesta + b.durataMin <= maxDurata);
  if (!principale) return null; // la sola apertura non è una giornata (regola 26)
  return { giorno, titolo: 'Giornata leggera', blocchi: [...testa, principale.id], spiegazione: 'Giornata leggera: fascia e palla, senza carico.' };
}

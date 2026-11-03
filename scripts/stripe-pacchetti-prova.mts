/**
 * Prova dei pacchetti su Stripe IN MODALITÀ TEST (3/11): crea (se mancano) prodotti, Price con le lookup key e coupon
 * "con codice" dei cinque pacchetti, poi prova il codice vero dell'app (lib/prezziServer.ts, lib/abbonamentoServer.ts,
 * lib/abbonamento.ts) contro Stripe: importi letti per pacchetto, codici (campagna con e senza scadenza, codice
 * personale), checkout con e senza Managed Payments, cambio di pacchetto con il conguaglio, pausa e ripresa, credito
 * di un invito sulla fattura dopo, e con un test clock la fine della prova e il secondo mese al prezzo bloccato.
 *
 *   STRIPE_SECRET_KEY=sk_test_… NODE_USE_ENV_PROXY=1 npx tsx scripts/stripe-pacchetti-prova.mts
 *
 * Rifiuta una chiave live. Supabase non serve: le letture del DB falliscono e valgono i default (fail-soft).
 * Gli importi di prova sono quelli del listino del 3/11 (lancio di dicembre).
 */
const key = process.env.STRIPE_SECRET_KEY ?? '';
if (!key.startsWith('sk_test_')) { console.error('Serve una chiave di TEST (sk_test_…).'); process.exit(1); }

const { stripe } = await import('../lib/stripe');
const { PACCHETTI, lookupLancio, lookupListino, couponCodice, INFO_PACCHETTI } = await import('../lib/listino');
const { loadListino, verificaCodice, scontoCodice, priceDi } = await import('../lib/prezziServer');
const { opzioniPagamento, prezzoPerUtente, tipoDaAbbonamento, centesimiScontati } = await import('../lib/abbonamento');
const { pianificaCambio, anteprimaCambio, eseguiCambio } = await import('../lib/abbonamentoServer');
type Pacchetto = (typeof PACCHETTI)[number];

const LISTINO: Record<Pacchetto, { listino: number; codice: number; lancio: number }> = {
  mentale: { listino: 39, codice: 29, lancio: 24 },
  fisico_base: { listino: 19, codice: 14, lancio: 9 },
  fisico_medio: { listino: 49, codice: 40, lancio: 34 },
  fisico_pro: { listino: 59, codice: 49, lancio: 39 },
  completo: { listino: 79, codice: 59, lancio: 44 },
};

let ok = 0, ko = 0;
const check = (cond: unknown, msg: string) => { if (cond) { ok++; console.log(`  ✓ ${msg}`); } else { ko++; console.log(`  ✗ ${msg}`); } };

// ─── 1. Prodotti, Price e coupon ───────────────────────────────────────────────────────────────────────────────
console.log('\n1. Prodotti, Price con lookup key e coupon "con codice" (test)');
for (const p of PACCHETTI) {
  const prezzi = await stripe.prices.list({ lookup_keys: [lookupListino(p), lookupLancio(p)], limit: 10 });
  let prodotto = prezzi.data[0]?.product as string | undefined;
  if (!prodotto) {
    prodotto = (await stripe.products.create({ name: `FYF ${INFO_PACCHETTI[p].nome} (prova)`, metadata: { fyf_pacchetto: p }, tax_code: 'txcd_10103000' })).id;
  }
  for (const tipo of ['listino', 'lancio'] as const) {
    const lk = tipo === 'listino' ? lookupListino(p) : lookupLancio(p);
    if (!prezzi.data.some((x) => x.lookup_key === lk)) {
      await stripe.prices.create({
        product: prodotto, currency: 'eur', unit_amount: LISTINO[p][tipo] * 100, recurring: { interval: 'month' },
        lookup_key: lk, tax_behavior: 'inclusive', metadata: { fyf_pacchetto: p, fyf_tipo: tipo },
      });
    }
  }
  const cid = couponCodice(p);
  try { await stripe.coupons.retrieve(cid); } catch {
    await stripe.coupons.create({ id: cid, name: `${INFO_PACCHETTI[p].nome} con codice`, amount_off: (LISTINO[p].listino - LISTINO[p].codice) * 100, currency: 'eur', duration: 'forever', applies_to: { products: [prodotto] } });
  }
}
check(true, 'cinque pacchetti pronti');

// ─── 2. Importi letti dall'app ─────────────────────────────────────────────────────────────────────────────────
console.log('\n2. loadListino(): gli importi per pacchetto come li legge l\'app');
const listino = await loadListino();
for (const p of PACCHETTI) {
  const l = listino[p];
  check(l.listino === LISTINO[p].listino && l.conCodice === LISTINO[p].codice && l.lancio === LISTINO[p].lancio,
    `${p}: listino ${l.listino} · codice ${l.conCodice} · lancio ${l.lancio}`);
}
// un prezzo solo, il più basso: lancio + codice non si sommano
const pc = prezzoPerUtente(listino.completo, { lancio: true, codice: true });
check(pc.tipo === 'lancio' && pc.euro === 44, `Completo con lancio e codice: ${pc.euro} € (${pc.tipo}), non sommati`);
const pm = prezzoPerUtente(listino.fisico_medio, { lancio: false, codice: true });
check(pm.tipo === 'codice' && pm.euro === 40, `Fisico Medio con codice: ${pm.euro} €`);

// ─── 3. Codici ────────────────────────────────────────────────────────────────────────────────────────────────
console.log('\n3. Codici: campagna con scadenza, senza scadenza, personale');
const suff = Math.random().toString(36).slice(2, 7).toUpperCase();
const fine = Math.floor(Date.now() / 1000) + 30 * 86400;
await stripe.promotionCodes.create({ coupon: couponCodice('mentale'), code: `PROVA${suff}`, expires_at: fine });
await stripe.promotionCodes.create({ coupon: couponCodice('mentale'), code: `SENZA${suff}` });
await stripe.promotionCodes.create({ coupon: couponCodice('mentale'), code: `AMICO${suff}`, metadata: { fyf_invito: '00000000-0000-0000-0000-000000000001' } });
const c1 = await verificaCodice(`prova${suff}`);
check(c1.ok, `campagna con scadenza: ${c1.ok ? 'valido' : c1.motivo}`);
const c2 = await verificaCodice(`SENZA${suff}`);
check(!c2.ok && c2.motivo === 'senza_scadenza', `campagna senza scadenza: ${c2.ok ? 'valido' : c2.motivo}`);
const c3 = await verificaCodice(`AMICO${suff}`);
check(c3.ok && c3.invitante === '00000000-0000-0000-0000-000000000001', `codice personale: ${c3.ok ? `valido, invita ${c3.invitante}` : c3.motivo}`);
check(!(await verificaCodice('NONESISTE123')).ok, 'codice inesistente: non valido');
// il codice del Mente dà il prezzo con codice anche sul Fisico (coupon del pacchetto)
const sc = scontoCodice(listino.fisico_medio, c1);
check(!!sc && 'coupon' in sc && sc.coupon === couponCodice('fisico_medio'), 'il codice del Mente sul Fisico Medio: coupon del Medio');
const scM = scontoCodice(listino.mentale, c1);
check(!!scM && 'promotion_code' in scM, 'sul Mente: il codice stesso (Stripe conta gli usi)');

// ─── 4. Checkout ──────────────────────────────────────────────────────────────────────────────────────────────
console.log('\n4. Checkout (sessione) con e senza Managed Payments');
const cliente = await stripe.customers.create({ email: `prova+${suff}@example.com`, metadata: { prova: 'pacchetti' } });
for (const mp of [false, true]) {
  try {
    const params = {
      customer: cliente.id, mode: 'subscription' as const,
      line_items: [{ price: priceDi(listino.fisico_medio, 'codice')!, quantity: 1 }],
      success_url: 'https://example.com/ok', cancel_url: 'https://example.com/no',
      discounts: [sc!], subscription_data: { metadata: { plan: 'fisico_medio', prezzo: 'codice' } },
      metadata: { plan: 'fisico_medio', prezzo: 'codice' },
      ...opzioniPagamento(mp),
    };
    const s = await stripe.checkout.sessions.create(params as never, mp ? { apiVersion: '2025-03-31.basil' } : undefined);
    check(s.amount_total === 4000, `${mp ? 'con' : 'senza'} Managed Payments: totale ${(s.amount_total ?? 0) / 100} € (Medio con codice)`);
  } catch (err) {
    check(false, `${mp ? 'con' : 'senza'} Managed Payments: ${(err as Error).message}`);
  }
}

// ─── 5. Abbonamento, cambio con conguaglio, pausa, credito ────────────────────────────────────────────────────
console.log('\n5. Abbonamento al Fisico Medio, passaggio al Pro, pausa, credito di un invito');
const pmCard = await stripe.paymentMethods.attach('pm_card_visa', { customer: cliente.id });
await stripe.customers.update(cliente.id, { invoice_settings: { default_payment_method: pmCard.id } });
const sub = await stripe.subscriptions.create({
  customer: cliente.id, items: [{ price: listino.fisico_medio.priceListino! }], discounts: [{ coupon: couponCodice('fisico_medio') }],
  metadata: { plan: 'fisico_medio', supabase_user_id: 'prova' }, expand: ['latest_invoice'],
});
const primaFattura = sub.latest_invoice as { amount_paid?: number } | null;
check(primaFattura?.amount_paid === 4000, `prima fattura Medio con codice: ${(primaFattura?.amount_paid ?? 0) / 100} €`);
const t = tipoDaAbbonamento({ price: sub.items.data[0].price as never, couponIds: [couponCodice('fisico_medio')] }, process.env);
check(t?.pacchetto === 'fisico_medio' && t.tipo === 'codice', `il webhook legge: ${t?.pacchetto} · ${t?.tipo}`);

const profilo = {
  user_id: 'prova', subscription_status: 'active', stripe_subscription_id: sub.id, stripe_customer_id: cliente.id,
  piano: 'fisico_medio', stripe_price_id: listino.fisico_medio.priceListino, diritto_codice: true, diritto_lancio: false,
};
const cambio = await pianificaCambio(profilo, 'fisico_pro');
check(cambio.ok && cambio.piano.tipo === 'codice' && cambio.piano.euro === 49, `Medio → Pro: ${cambio.ok ? `${cambio.piano.euro} € (${cambio.piano.tipo})` : cambio.motivo}`);
const versoCompleto = await pianificaCambio(profilo, 'mentale');
check(!versoCompleto.ok && versoCompleto.motivo === 'iscrizioni_chiuse' || versoCompleto.ok, `Medio → Mente (area nuova, iscrizioni del Mente aperte di default): ${versoCompleto.ok ? 'ok' : versoCompleto.motivo}`);
if (cambio.ok) {
  const ant = await anteprimaCambio(sub.id, cambio.piano);
  check(ant != null && ant.adesso > 0 && ant.adesso <= 9, `conguaglio di oggi: ${ant?.adesso} € (al massimo 9 € = 49 − 40)`);
  await eseguiCambio(profilo, cambio.piano, false);
  const dopo = await stripe.subscriptions.retrieve(sub.id, { expand: ['discounts'] });
  const coupons = (dopo.discounts as unknown as { coupon?: { id: string; amount_off?: number | null; currency?: string | null; duration?: string | null } }[]).flatMap((d) => (d.coupon ? [d.coupon] : []));
  check(dopo.items.data[0].price.lookup_key === lookupListino('fisico_pro') && coupons.some((c) => c.id === couponCodice('fisico_pro')), 'sulla subscription: Price del Pro e coupon del Pro');
  check(centesimiScontati(dopo.items.data[0].price.unit_amount!, coupons as never) === 4900, 'il Pro con codice: 49 €/mese');
  const fatture = await stripe.invoices.list({ subscription: sub.id, limit: 5 });
  const conguaglio = fatture.data.find((f) => f.billing_reason === 'subscription_update');
  check(!!conguaglio && conguaglio.status === 'paid', `fattura del conguaglio pagata: ${(conguaglio?.amount_paid ?? 0) / 100} €`);
}
// pausa di 2 mesi e ripresa
const riprende = Math.floor(Date.now() / 1000) + 60 * 86400;
const inPausa = await stripe.subscriptions.update(sub.id, { pause_collection: { behavior: 'void', resumes_at: riprende } });
check(inPausa.pause_collection?.resumes_at === riprende, 'pausa: niente addebiti fino alla data di ripresa');
const ripresa = await stripe.subscriptions.update(sub.id, { pause_collection: '' } as never);
check(!ripresa.pause_collection, 'ripresa anticipata');
// credito di un invito: −10 € sul saldo, sulla fattura dopo
await stripe.customers.createBalanceTransaction(cliente.id, { amount: -1000, currency: 'eur', description: 'prova invito' });
const anteprima = await stripe.invoices.createPreview({ customer: cliente.id, subscription: sub.id });
check(anteprima.amount_due === 3900, `prossima fattura con il credito: ${anteprima.amount_due / 100} € (49 − 10)`);
await stripe.subscriptions.cancel(sub.id);

// ─── 5b. Cambio durante la prova: la prova finisce, si paga subito ─────────────────────────────────────────────
console.log('\n5b. In prova sul Fisico Medio, passaggio al Pro: la prova finisce e si paga subito');
// cliente pulito: quello di prima ha ancora i 10 € di credito dell'invito
const clienteP = await stripe.customers.create({ email: `provaP+${suff}@example.com` });
const pmP = await stripe.paymentMethods.attach('pm_card_visa', { customer: clienteP.id });
await stripe.customers.update(clienteP.id, { invoice_settings: { default_payment_method: pmP.id } });
const subP = await stripe.subscriptions.create({ customer: clienteP.id, items: [{ price: listino.fisico_medio.priceListino! }], trial_period_days: 7, metadata: { plan: 'fisico_medio' } });
const profP = { user_id: 'prova', subscription_status: 'trialing', stripe_subscription_id: subP.id, stripe_customer_id: clienteP.id, piano: 'fisico_medio', stripe_price_id: listino.fisico_medio.priceListino };
const cambioP = await pianificaCambio(profP, 'fisico_pro');
check(cambioP.ok && cambioP.piano.finisceProva && cambioP.piano.tipo === 'listino', `Medio in prova → Pro: ${cambioP.ok ? `${cambioP.piano.euro} €, la prova finisce` : cambioP.motivo}`);
if (cambioP.ok) {
  await eseguiCambio(profP, cambioP.piano, false);
  const dopoP = await stripe.subscriptions.retrieve(subP.id);
  const fattP = await stripe.invoices.list({ subscription: subP.id, limit: 5 });
  check(dopoP.status === 'active' && fattP.data.some((f) => f.amount_paid === 5900), `attivo, pagato subito: ${fattP.data.map((f) => f.amount_paid / 100).join(', ')} €`);
}
await stripe.subscriptions.cancel(subP.id);

// ─── 6. Test clock: prova di 7 giorni, primo addebito, secondo mese al prezzo bloccato ────────────────────────
console.log('\n6. Test clock: prova, primo addebito, secondo mese (Completo al lancio)');
const clock = await stripe.testHelpers.testClocks.create({ frozen_time: Math.floor(Date.now() / 1000) });
const c2c = await stripe.customers.create({ email: `clock+${suff}@example.com`, test_clock: clock.id });
const pm2 = await stripe.paymentMethods.attach('pm_card_visa', { customer: c2c.id });
await stripe.customers.update(c2c.id, { invoice_settings: { default_payment_method: pm2.id } });
const sub2 = await stripe.subscriptions.create({ customer: c2c.id, items: [{ price: listino.completo.priceLancio! }], trial_period_days: 7, metadata: { plan: 'completo' } });
check(sub2.status === 'trialing', 'Completo al lancio: in prova');
const avanza = async (giorni: number) => {
  const c = await stripe.testHelpers.testClocks.retrieve(clock.id);
  await stripe.testHelpers.testClocks.advance(clock.id, { frozen_time: c.frozen_time + giorni * 86400 });
  for (let i = 0; i < 30; i++) {
    const x = await stripe.testHelpers.testClocks.retrieve(clock.id);
    if (x.status === 'ready') return;
    await new Promise((r) => setTimeout(r, 2000));
  }
};
await avanza(8);
let fatture2 = await stripe.invoices.list({ subscription: sub2.id, limit: 5 });
check(fatture2.data.some((f) => f.amount_paid === 4400), `dopo la prova: ${fatture2.data.map((f) => f.amount_paid / 100).join(', ')} €`);
await avanza(31);
fatture2 = await stripe.invoices.list({ subscription: sub2.id, limit: 5 });
check(fatture2.data.filter((f) => f.amount_paid === 4400).length >= 2, `secondo mese ancora al lancio: ${fatture2.data.map((f) => f.amount_paid / 100).join(', ')} €`);
await stripe.testHelpers.testClocks.del(clock.id);

console.log(`\n${ok} ok, ${ko} no`);
process.exit(ko ? 1 : 0);

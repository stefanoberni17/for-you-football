import { beforeEach, describe, expect, it } from 'vitest';
import { _azzeraScrollLock, bloccaScroll } from '@/lib/scrollLock';

describe('blocco dello scroll con più fogli aperti (2/11)', () => {
  beforeEach(() => _azzeraScrollLock());

  it('due fogli che si chiudono in ordine inverso: la pagina torna a scorrere', () => {
    const body = { overflow: '' };
    const sbloccaTermini = bloccaScroll(body);
    const sbloccaCheckin = bloccaScroll(body);
    expect(body.overflow).toBe('hidden');
    sbloccaTermini(); // il foglio dei Termini si chiude per primo
    expect(body.overflow).toBe('hidden');
    sbloccaCheckin();
    expect(body.overflow).toBe('');
  });

  it('in ordine normale, e uno sblocco ripetuto non conta due volte', () => {
    const body = { overflow: 'auto' };
    const a = bloccaScroll(body);
    const b = bloccaScroll(body);
    b();
    b();
    expect(body.overflow).toBe('hidden');
    a();
    expect(body.overflow).toBe('auto');
  });

  it('una pagina rimasta bloccata da prima non resta bloccata per sempre', () => {
    const body = { overflow: 'hidden' };
    const a = bloccaScroll(body);
    a();
    expect(body.overflow).toBe('');
  });
});

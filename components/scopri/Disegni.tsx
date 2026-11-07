/**
 * I disegni della pagina di vendita (7/11, Ste: «più classico, quasi vintage, che ricordi la connessione di corpo e mente
 * nel calcio; piccole immagini, più emotivo»). Tratto a mano libera in SVG, colore dal testo intorno (currentColor),
 * il cuoio del pallone in ocra. Niente immagini esterne.
 */

type P = { className?: string; titolo?: string };

function Svg({ className = '', titolo, viewBox, children }: P & { viewBox: string; children: React.ReactNode }) {
  return (
    <svg viewBox={viewBox} className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" role={titolo ? 'img' : undefined} aria-label={titolo} aria-hidden={titolo ? undefined : true}>
      {children}
    </svg>
  );
}

/** Il pallone di cuoio con i lacci, quello di una volta. */
export function Pallone({ className, titolo, cuoio = true }: P & { cuoio?: boolean }) {
  return (
    <Svg viewBox="0 0 100 100" className={className} titolo={titolo}>
      <circle cx="50" cy="50" r="44" fill={cuoio ? 'var(--scopri-cuoio)' : 'none'} strokeWidth="2.6" />
      <g strokeWidth="1.8">
        <path d="M37 8.5C27 34 27 66 37 91.5" />
        <path d="M63 8.5C73 34 73 66 63 91.5" />
        <path d="M30.5 37C40 33 60 33 69.5 37" />
        <path d="M30.5 63C40 67 60 67 69.5 63" />
        <path d="M7 41C15 38 23 38 30.5 40" />
        <path d="M7 59C15 62 23 62 30.5 60" />
        <path d="M93 41C85 38 77 38 69.5 40" />
        <path d="M93 59C85 62 77 62 69.5 60" />
      </g>
      <g strokeWidth="1.4">
        <path d="M50 14V31" />
        <path d="M46.5 16.5H53.5M46.5 20.5H53.5M46.5 24.5H53.5M46.5 28.5H53.5" />
      </g>
      <path d="M22 26C27 19 34 14.5 42 12.5" stroke="#fff" strokeOpacity=".45" strokeWidth="2.4" />
    </Svg>
  );
}

/** Il pallone che arriva: «ti arriva un pallone semplice». */
export function PalloneCheArriva({ className, titolo }: P) {
  return (
    <svg viewBox="0 0 120 80" className={className} role={titolo ? 'img' : undefined} aria-label={titolo} aria-hidden={titolo ? undefined : true}>
      <g stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" fill="none">
        <path d="M8 30H40" />
        <path d="M16 42H44" strokeOpacity=".7" />
        <path d="M4 54H38" strokeOpacity=".45" />
      </g>
      <svg x="46" y="8" width="64" height="64" viewBox="0 0 100 100">
        <Pallone />
      </svg>
    </svg>
  );
}

/** La palla che va via, tratteggiata: «dopo un errore cominci a nasconderti». */
export function PallaPersa({ className, titolo }: P) {
  return (
    <svg viewBox="0 0 120 80" className={className} role={titolo ? 'img' : undefined} aria-label={titolo} aria-hidden={titolo ? undefined : true}>
      <path d="M10 70C30 66 46 48 58 30" stroke="currentColor" strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" fill="none" />
      <svg x="58" y="6" width="44" height="44" viewBox="0 0 100 100" opacity=".85">
        <Pallone />
      </svg>
      <path d="M8 74H26" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/** La luna e due stelle: «la sera prima la giochi dieci volte in testa». */
export function SeraPrima({ className, titolo }: P) {
  return (
    <Svg viewBox="0 0 120 80" className={className} titolo={titolo}>
      <path d="M66 12a28 28 0 1 0 22 46a23 23 0 1 1-22-46z" fill="var(--scopri-cuoio)" fillOpacity=".55" strokeWidth="2.2" />
      <path d="M26 18v10M21 23h10" strokeWidth="2" />
      <path d="M100 18v7M96.5 21.5h7" strokeWidth="1.8" />
      <path d="M34 54v6M31 57h6" strokeWidth="1.6" />
      <path d="M18 70h84" strokeWidth="1.6" strokeDasharray="1 6" />
    </Svg>
  );
}

/** Il fischietto: il fischio finale. */
export function Fischietto({ className, titolo }: P) {
  return (
    <Svg viewBox="0 0 120 80" className={className} titolo={titolo}>
      <path d="M20 26C34 20 50 30 46 46" strokeWidth="1.8" strokeDasharray="0.1 5" />
      <circle cx="17" cy="25" r="5" strokeWidth="2.2" />
      <path d="M44 32H96V48H76A20 20 0 1 1 56 32Z" fill="var(--scopri-cuoio)" fillOpacity=".4" strokeWidth="2.4" />
      <path d="M96 32V48" strokeWidth="2.4" />
      <circle cx="56" cy="52" r="8" strokeWidth="1.8" />
      <path d="M86 32V25M80 25H92" strokeWidth="2" />
      <path d="M102 30l8-5M103 40h9M102 50l8 5" strokeWidth="1.8" />
    </Svg>
  );
}

/** Le linee del campo dietro il telefono: cerchio di centrocampo e metà campo. */
export function CerchioCentrocampo({ className }: P) {
  return (
    <Svg viewBox="0 0 400 400" className={className}>
      <circle cx="200" cy="200" r="150" strokeWidth="1.6" />
      <path d="M0 200H400" strokeWidth="1.6" />
      <circle cx="200" cy="200" r="4" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/** Mezzo campo visto dall'alto: area, area piccola, dischetto, lunetta. */
export function MezzoCampo({ className }: P) {
  return (
    <Svg viewBox="0 0 300 200" className={className}>
      <path d="M10 10H290V190H10Z" strokeWidth="1.6" />
      <path d="M70 10V70H230V10" strokeWidth="1.6" />
      <path d="M115 10V32H185V10" strokeWidth="1.6" />
      <circle cx="150" cy="52" r="2.8" fill="currentColor" stroke="none" />
      <path d="M122 70A36 36 0 0 0 178 70" strokeWidth="1.6" />
      <path d="M100 190A50 50 0 0 1 200 190" strokeWidth="1.6" />
      <path d="M132 10V4H168V10" strokeWidth="1.6" />
    </Svg>
  );
}

/** Un fregio tra le sezioni: due righe e il pallone in mezzo. */
export function Fregio({ className = '' }: P) {
  return (
    <div className={`flex items-center justify-center gap-4 text-forest-400 ${className}`} aria-hidden>
      <span className="h-px w-16 bg-current opacity-40 sm:w-28" />
      <Pallone className="h-7 w-7" />
      <span className="h-px w-16 bg-current opacity-40 sm:w-28" />
    </div>
  );
}

/** Il timbro rotondo, come lo stemma di una squadra: testa, corpo, gioco intorno al pallone. */
export function Stemma({ className, titolo = 'For You Football: testa, corpo, gioco' }: P) {
  const testo = 'FOR YOU FOOTBALL · TESTA · CORPO · GIOCO · ';
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={titolo}>
      <defs>
        <path id="scopri-stemma-giro" d="M100 100m-74 0a74 74 0 1 1 148 0a74 74 0 1 1-148 0" />
      </defs>
      <g fill="none" stroke="currentColor">
        <circle cx="100" cy="100" r="95" strokeWidth="2.4" />
        <circle cx="100" cy="100" r="89" strokeWidth="1" />
        <circle cx="100" cy="100" r="58" strokeWidth="1" />
      </g>
      <text fill="currentColor" style={{ fontFamily: 'var(--font-scopri-serif), Georgia, serif', fontSize: 15.5, letterSpacing: 3.2, fontWeight: 600 }}>
        <textPath href="#scopri-stemma-giro" startOffset="0" textLength="458" lengthAdjust="spacing">{testo}</textPath>
      </text>
      <svg x="62" y="62" width="76" height="76" viewBox="0 0 100 100">
        <Pallone />
      </svg>
    </svg>
  );
}

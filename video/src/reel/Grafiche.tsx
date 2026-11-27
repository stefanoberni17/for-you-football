import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ALTEZZA, FPS } from "./montaggio";
import { stile } from "./stile";

// Grafiche che avvalorano quello che si dice: confronto, dati di uno studio, voci che si
// accendono, frase finale. Stesso fondo verde foresta degli inserti.
const FONDO = "rgba(9, 26, 17, 0.9)";
const SPENTO = "rgba(255,255,255,0.35)";
const USCITA = 8;

const useEntrata = (durata: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dentro = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: 10,
  });
  const fuori = interpolate(frame, [durata - USCITA, durata], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { frame, fps, dentro, fuori };
};

const Riquadro: React.FC<{
  y: number;
  children: React.ReactNode;
  opacita: number;
  sposta: number;
}> = ({ y, children, opacita, sposta }) => (
  <AbsoluteFill style={{ paddingTop: y * ALTEZZA, alignItems: "center" }}>
    <div
      style={{
        background: FONDO,
        borderRadius: 28,
        boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
        opacity: opacita,
        transform: `translateY(${sposta}px)`,
      }}
    >
      {children}
    </div>
  </AbsoluteFill>
);

export const Colonne: React.FC<{
  durata: number;
  accendi: number; // frame relativo
  sinistra: { titolo: string; sotto?: string };
  destra: { titolo: string; sotto?: string };
  y: number;
}> = ({ durata, accendi, sinistra, destra, y }) => {
  const { frame, fps, dentro, fuori } = useEntrata(durata);
  const acceso = spring({
    frame: frame - accendi,
    fps,
    config: { damping: 14, stiffness: 160 },
  });
  const colonna = (
    c: { titolo: string; sotto?: string },
    luce: number,
    verde: boolean,
  ) => (
    <div style={{ width: 400, padding: "30px 20px 32px", textAlign: "center" }}>
      <div
        style={{
          fontFamily: stile.font,
          fontWeight: 800,
          fontSize: 60,
          letterSpacing: 1,
          color: verde ? (luce > 0.5 ? stile.verde : SPENTO) : stile.bianco,
          transform: `scale(${verde ? 0.9 + 0.1 * luce : 1})`,
        }}
      >
        {c.titolo}
      </div>
      {c.sotto ? (
        <div
          style={{
            fontFamily: stile.fontAccento,
            fontStyle: "italic",
            fontWeight: 600,
            fontSize: 44,
            color: verde
              ? luce > 0.5
                ? stile.verdeChiaro
                : SPENTO
              : stile.verdeChiaro,
            marginTop: 6,
          }}
        >
          {c.sotto}
        </div>
      ) : null}
    </div>
  );
  return (
    <Riquadro y={y} opacita={dentro * fuori} sposta={(1 - dentro) * -30}>
      <div style={{ display: "flex", alignItems: "stretch" }}>
        {colonna(sinistra, 1, false)}
        <div
          style={{
            width: 4,
            background: "rgba(255,255,255,0.2)",
            margin: "24px 0",
          }}
        />
        {colonna(destra, acceso, true)}
      </div>
    </Riquadro>
  );
};

export const Numeri: React.FC<{
  durata: number;
  righe: {
    frame: number;
    valore: string;
    etichetta: string;
    spento?: boolean;
  }[];
  fonte: string;
}> = ({ durata, righe, fonte }) => {
  const { frame, fps, dentro, fuori } = useEntrata(durata);
  return (
    <AbsoluteFill
      style={{
        // Velo scuro sul girato: il dato si legge da solo.
        background: `rgba(6, 18, 12, ${0.78 * dentro * fuori})`,
        justifyContent: "center",
        alignItems: "center",
        paddingBottom: 240,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 70,
          opacity: fuori,
        }}
      >
        {righe.map((r, i) => {
          const s = spring({
            frame: frame - r.frame,
            fps,
            config: { damping: 12, stiffness: 150 },
          });
          if (frame < r.frame) return <div key={i} style={{ height: 250 }} />;
          return (
            <div
              key={i}
              style={{
                textAlign: "center",
                opacity: s,
                transform: `scale(${0.7 + 0.3 * s})`,
              }}
            >
              <div
                style={{
                  fontFamily: stile.font,
                  fontWeight: 800,
                  fontSize: 190,
                  lineHeight: 1,
                  color: r.spento ? "rgba(255,255,255,0.55)" : stile.verde,
                }}
              >
                {r.valore}
              </div>
              <div
                style={{
                  fontFamily: stile.font,
                  fontWeight: 700,
                  fontSize: 54,
                  color: stile.bianco,
                  marginTop: 6,
                }}
              >
                {r.etichetta}
              </div>
            </div>
          );
        })}
        <div
          style={{
            textAlign: "center",
            fontFamily: stile.fontAccento,
            fontStyle: "italic",
            fontWeight: 600,
            fontSize: 38,
            color: stile.verdeChiaro,
            opacity: dentro,
          }}
        >
          {fonte}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Chip: React.FC<{
  durata: number;
  titolo: string;
  voci: { frame: number; testo: string }[];
  y: number;
}> = ({ durata, titolo, voci, y }) => {
  const { frame, fps, dentro, fuori } = useEntrata(durata);
  return (
    <Riquadro y={y} opacita={dentro * fuori} sposta={(1 - dentro) * -30}>
      <div style={{ padding: "24px 32px 30px", width: 920 }}>
        <div
          style={{
            fontFamily: stile.font,
            fontWeight: 800,
            fontSize: 48,
            color: stile.bianco,
            textAlign: "center",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          {titolo}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 16,
            marginTop: 20,
          }}
        >
          {voci.map((v, i) => {
            const s = spring({
              frame: frame - v.frame,
              fps,
              config: { damping: 12, stiffness: 170 },
            });
            const on = frame >= v.frame;
            return (
              <div
                key={i}
                style={{
                  fontFamily: stile.font,
                  fontWeight: 700,
                  fontSize: 44,
                  padding: "10px 26px",
                  borderRadius: 999,
                  color: on ? stile.scuro : SPENTO,
                  background: on ? stile.verde : "transparent",
                  border: `4px solid ${on ? stile.verde : "rgba(255,255,255,0.25)"}`,
                  transform: `scale(${on ? 0.85 + 0.15 * s : 0.9})`,
                  boxShadow: on ? `0 0 ${16 * s}px ${stile.verde}` : "none",
                }}
              >
                {v.testo}
              </div>
            );
          })}
        </div>
      </div>
    </Riquadro>
  );
};

export const Finale: React.FC<{ durata: number; righe: string[] }> = ({
  durata,
  righe,
}) => {
  const { frame, fps, fuori } = useEntrata(durata);
  return (
    <AbsoluteFill
      style={{
        background: `rgba(6, 18, 12, ${0.7 * fuori})`,
        justifyContent: "center",
        alignItems: "center",
        paddingBottom: 300,
      }}
    >
      {righe.map((r, i) => {
        const s = spring({
          frame: frame - i * Math.round(FPS * 0.35),
          fps,
          config: { damping: 14 },
        });
        return (
          <div
            key={i}
            style={{
              fontFamily: stile.font,
              fontWeight: 800,
              fontSize: 120,
              lineHeight: 1.05,
              color: i % 2 === 1 ? stile.verde : stile.bianco,
              opacity: s * fuori,
              transform: `translateY(${(1 - s) * 40}px)`,
              textTransform: "uppercase",
              ...stile.contorno,
            }}
          >
            {r}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// Scene a tutto schermo (niente girato sotto): fondo verde foresta pieno.
const FONDO_SCENA = "#08170f";

const useScena = (durata: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entra = interpolate(frame, [0, 8], [0, 1], {
    extrapolateRight: "clamp",
  });
  const esce = interpolate(frame, [durata - 8, durata], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { frame, fps, vis: Math.min(entra, esce) };
};

const testoTitolo: React.CSSProperties = {
  fontFamily: stile.font,
  fontWeight: 800,
  fontSize: 96,
  lineHeight: 1.02,
  color: stile.bianco,
  textTransform: "uppercase",
  textAlign: "center",
};
const testoSotto: React.CSSProperties = {
  fontFamily: stile.fontAccento,
  fontStyle: "italic",
  fontWeight: 600,
  fontSize: 64,
  color: stile.verdeChiaro,
  textAlign: "center",
};

export const Freccia: React.FC<{
  durata: number;
  titolo: string;
  sotto: string;
  quando: number;
}> = ({ durata, titolo, sotto, quando }) => {
  const { frame, fps, vis } = useScena(durata);
  const linea = spring({
    frame: frame - 4,
    fps,
    config: { damping: 200 },
    durationInFrames: 24,
  });
  const s = spring({
    frame: frame - quando,
    fps,
    config: { damping: 200 },
    durationInFrames: 12,
  });
  const L = 760;
  return (
    <AbsoluteFill
      style={{
        background: FONDO_SCENA,
        opacity: vis,
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: 420,
      }}
    >
      <svg width={L + 80} height={120} style={{ overflow: "visible" }}>
        <line
          x1={40}
          y1={60}
          x2={40 + L * linea}
          y2={60}
          stroke={stile.verde}
          strokeWidth={22}
          strokeLinecap="round"
        />
        <polygon
          points={`${40 + L * linea + 10},60 ${40 + L * linea - 50},18 ${40 + L * linea - 50},102`}
          fill={stile.verde}
          opacity={linea}
        />
      </svg>
      <div style={{ ...testoTitolo, marginTop: 70 }}>{titolo}</div>
      <div
        style={{
          ...testoSotto,
          marginTop: 18,
          opacity: s,
          transform: `translateY(${(1 - s) * 20}px)`,
        }}
      >
        {sotto}
      </div>
    </AbsoluteFill>
  );
};

export const Corrispondenza: React.FC<{
  durata: number;
  sopra: string;
  titolo: number;
  riempi: number;
  fine: number;
}> = ({ durata, sopra, titolo, riempi, fine }) => {
  const { frame, fps, vis } = useScena(durata);
  const t = spring({
    frame: frame - titolo,
    fps,
    config: { damping: 200 },
    durationInFrames: 12,
  });
  const r = spring({
    frame: frame - riempi,
    fps,
    config: { damping: 200 },
    durationInFrames: 40,
  });
  const f = spring({
    frame: frame - fine,
    fps,
    config: { damping: 200 },
    durationInFrames: 12,
  });
  const sopraVis = interpolate(frame, [titolo - 6, titolo], [1, 0.35], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const LARGA = 820;
  const etichetta = (testo: string, sotto: string) => (
    <div style={{ width: 300, textAlign: "center" }}>
      <div
        style={{
          fontFamily: stile.font,
          fontWeight: 800,
          fontSize: 54,
          color: stile.bianco,
        }}
      >
        {testo}
      </div>
      <div style={{ ...testoSotto, fontSize: 40 }}>{sotto}</div>
    </div>
  );
  return (
    <AbsoluteFill
      style={{
        background: FONDO_SCENA,
        opacity: vis,
        alignItems: "center",
        paddingTop: 230,
      }}
    >
      <div
        style={{
          fontFamily: stile.font,
          fontWeight: 700,
          fontSize: 58,
          color: stile.bianco,
          textAlign: "center",
          maxWidth: 900,
          opacity: sopraVis,
        }}
      >
        {sopra}
      </div>
      <div
        style={{
          ...testoTitolo,
          fontSize: 92,
          color: stile.verde,
          marginTop: 70,
          opacity: t,
          transform: `scale(${0.85 + 0.15 * t})`,
        }}
      >
        Corrispondenza
        <br />
        dinamica
      </div>
      <div style={{ marginTop: 70, opacity: t }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: LARGA,
          }}
        >
          {etichetta("ESERCIZIO", "in palestra")}
          {etichetta("PARTITA", "in campo")}
        </div>
        <div
          style={{
            marginTop: 26,
            width: LARGA,
            height: 34,
            borderRadius: 17,
            background: "rgba(255,255,255,0.15)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${15 + 85 * r}%`,
              height: "100%",
              borderRadius: 17,
              background: stile.verde,
              boxShadow: `0 0 24px ${stile.verde}`,
            }}
          />
        </div>
        <div style={{ ...testoSotto, fontSize: 50, marginTop: 30, opacity: f }}>
          più si somigliano, più forza porti in campo
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Reel 06, quarta versione: grafici veri (linea, barre a tre colonne, ponte).

const ROSSO = "#ff5a5a";

const usaMolla = (frame: number, fps: number, da: number, durata = 14) =>
  spring({
    frame: frame - da,
    fps,
    config: { damping: 200 },
    durationInFrames: durata,
  });

// Grafico a linea: dall'esercizio in palestra al gesto in partita, la forza che porti in
// campo sale. In fondo si accende il punto "il contrasto".
export const GraficoLinea: React.FC<{
  durata: number;
  titolo: number; // quando compare il titolo
  traccia: number; // quando parte la linea
  tracciaFine: number; // quando arriva in cima
  punto: number; // quando si accende "il contrasto"
}> = ({ durata, titolo, traccia, tracciaFine, punto }) => {
  const { frame, fps, vis } = useScena(durata);
  const t = usaMolla(frame, fps, titolo, 12);
  const assi = usaMolla(frame, fps, titolo + 6, 16);
  const lin = interpolate(frame, [traccia, tracciaFine], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const p = spring({
    frame: frame - punto,
    fps,
    config: { damping: 10, stiffness: 160 },
  });
  const pulsa = frame >= punto ? 1 + 0.08 * Math.sin((frame - punto) / 4) : 1;

  // Area del grafico (coordinate SVG).
  const W = 860;
  const H = 620;
  const X0 = 90;
  const Y0 = 560; // asse x
  const X1 = 820;
  const YT = 70; // cima
  // Curva che sale: piatta all'inizio, ripida verso il gesto vero.
  const punti = Array.from({ length: 41 }, (_, i) => {
    const u = i / 40;
    const y = Y0 - 40 - (Y0 - 40 - YT) * Math.pow(u, 1.8);
    return [X0 + (X1 - X0) * u, y] as const;
  });
  const n = Math.max(1, Math.round(lin * 40));
  const visti = punti.slice(0, n + 1);
  const d = visti.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
  const area = `${d} L${visti[visti.length - 1][0]},${Y0} L${X0},${Y0} Z`;
  const [cx, cy] = visti[visti.length - 1];
  const [fx, fy] = punti[40];

  return (
    <AbsoluteFill
      style={{
        background: FONDO_SCENA,
        opacity: vis,
        alignItems: "center",
        paddingTop: 150,
      }}
    >
      <div
        style={{
          ...testoTitolo,
          fontSize: 88,
          color: stile.verde,
          opacity: t,
          transform: `scale(${0.85 + 0.15 * t})`,
        }}
      >
        Corrispondenza
        <br />
        dinamica
      </div>
      <svg
        width={W}
        height={H + 110}
        style={{ marginTop: 40, overflow: "visible", opacity: assi }}
      >
        <defs>
          <linearGradient id="areaLinea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stile.verde} stopOpacity={0.45} />
            <stop offset="100%" stopColor={stile.verde} stopOpacity={0} />
          </linearGradient>
        </defs>
        {/* Griglia leggera */}
        {[0.25, 0.5, 0.75].map((g) => (
          <line
            key={g}
            x1={X0}
            x2={X1}
            y1={Y0 - (Y0 - YT) * g}
            y2={Y0 - (Y0 - YT) * g}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={3}
          />
        ))}
        {/* Assi */}
        <line
          x1={X0}
          y1={Y0}
          x2={X1 + 20}
          y2={Y0}
          stroke="rgba(255,255,255,0.6)"
          strokeWidth={6}
          strokeLinecap="round"
        />
        <line
          x1={X0}
          y1={Y0}
          x2={X0}
          y2={YT - 20}
          stroke="rgba(255,255,255,0.6)"
          strokeWidth={6}
          strokeLinecap="round"
        />
        {/* Area e linea */}
        {lin > 0 ? <path d={area} fill="url(#areaLinea)" /> : null}
        {lin > 0 ? (
          <path
            d={d}
            fill="none"
            stroke={stile.verde}
            strokeWidth={14}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 14px ${stile.verde})` }}
          />
        ) : null}
        {lin > 0 && lin < 1 ? (
          <circle cx={cx} cy={cy} r={16} fill={stile.bianco} />
        ) : null}
        {/* Punto di partenza: l'esercizio in palestra */}
        {lin > 0 ? (
          <circle cx={X0} cy={Y0 - 40} r={16} fill={stile.verdeChiaro} />
        ) : null}
        {/* Il contrasto */}
        {frame >= punto ? (
          <g transform={`translate(${fx},${fy}) scale(${p * pulsa})`}>
            <circle r={46} fill={stile.verde} opacity={0.25} />
            <circle
              r={26}
              fill={stile.verde}
              style={{ filter: `drop-shadow(0 0 20px ${stile.verde})` }}
            />
          </g>
        ) : null}
        {/* Etichette assi */}
        <text
          x={X0 - 30}
          y={(Y0 + YT) / 2}
          fill={stile.bianco}
          fontFamily={stile.font}
          fontWeight={700}
          fontSize={36}
          textAnchor="middle"
          transform={`rotate(-90 ${X0 - 30} ${(Y0 + YT) / 2})`}
        >
          FORZA CHE PORTI IN CAMPO
        </text>
        <text
          x={X0}
          y={Y0 + 70}
          fill={stile.verdeChiaro}
          fontFamily={stile.font}
          fontWeight={800}
          fontSize={44}
          textAnchor="start"
        >
          PALESTRA
        </text>
        <text
          x={X1 + 20}
          y={Y0 + 70}
          fill={stile.verdeChiaro}
          fontFamily={stile.font}
          fontWeight={800}
          fontSize={44}
          textAnchor="end"
        >
          PARTITA
        </text>
      </svg>
      {frame >= punto ? (
        <div
          style={{
            position: "absolute",
            top: 395,
            right: 190,
            fontFamily: stile.font,
            fontWeight: 800,
            fontSize: 58,
            color: stile.scuro,
            background: stile.verde,
            padding: "10px 26px",
            borderRadius: 18,
            opacity: p,
            transform: `scale(${0.6 + 0.4 * p}) rotate(-3deg)`,
            boxShadow: `0 0 30px ${stile.verde}`,
          }}
        >
          IL CONTRASTO
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

type Colonna3 = {
  titolo: string;
  quando: number; // quando compare la colonna
  forza: number; // 0-1
  somiglianza: number; // 0-1
  forzaDa: number; // quando sale la barra della forza
  somiglianzaDa: number; // quando sale la barra della somiglianza
};

// Tre colonne (palestra, variante, partita), due barre ciascuna: forza costruita e
// somiglianza al gesto. Niente numeri: è il concetto, non una misura.
export const Barre3: React.FC<{
  durata: number;
  colonne: Colonna3[];
  evidenzia: number; // quando si accende la colonna in mezzo
}> = ({ durata, colonne, evidenzia }) => {
  const { frame, fps, vis } = useScena(durata);
  const ALTA = 640;
  const e = spring({
    frame: frame - evidenzia,
    fps,
    config: { damping: 12, stiffness: 140 },
  });
  const legenda = (colore: string, testo: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div
        style={{ width: 40, height: 40, borderRadius: 10, background: colore }}
      />
      <div
        style={{
          fontFamily: stile.font,
          fontWeight: 700,
          fontSize: 44,
          color: stile.bianco,
        }}
      >
        {testo}
      </div>
    </div>
  );
  return (
    <AbsoluteFill
      style={{
        background: FONDO_SCENA,
        opacity: vis,
        alignItems: "center",
        paddingTop: 170,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          alignItems: "flex-start",
        }}
      >
        {legenda(stile.bianco, "Forza costruita")}
        {legenda(stile.verde, "Somiglianza al gesto")}
      </div>
      <div
        style={{
          display: "flex",
          gap: 34,
          marginTop: 50,
          alignItems: "flex-end",
          height: ALTA + 110,
        }}
      >
        {colonne.map((c, i) => {
          const comp = usaMolla(frame, fps, c.quando, 10);
          const f = usaMolla(frame, fps, c.forzaDa, 22);
          const s = usaMolla(frame, fps, c.somiglianzaDa, 22);
          const mezzo = i === 1;
          const luce = mezzo ? e : 0;
          const spenta = !mezzo && frame >= evidenzia ? 0.45 : 1;
          return (
            <div
              key={i}
              style={{
                width: 270,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                opacity: comp * spenta,
                transform: `translateY(${(1 - comp) * 40}px) scale(${1 + 0.06 * luce})`,
              }}
            >
              <div
                style={{
                  height: ALTA,
                  width: "100%",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  gap: 18,
                  borderRadius: 24,
                  padding: "0 14px",
                  background:
                    luce > 0.01
                      ? `rgba(45,209,122,${0.12 * luce})`
                      : "transparent",
                  boxShadow:
                    luce > 0.01
                      ? `0 0 ${40 * luce}px rgba(45,209,122,${0.5 * luce})`
                      : "none",
                  border: `4px solid rgba(45,209,122,${0.9 * luce})`,
                }}
              >
                <div
                  style={{
                    width: 96,
                    height: (ALTA - 20) * c.forza * f,
                    background: stile.bianco,
                    borderRadius: "16px 16px 0 0",
                  }}
                />
                <div
                  style={{
                    width: 96,
                    height: (ALTA - 20) * c.somiglianza * s,
                    background: stile.verde,
                    borderRadius: "16px 16px 0 0",
                    boxShadow: `0 0 20px ${stile.verde}`,
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: 22,
                  fontFamily: stile.font,
                  fontWeight: 800,
                  fontSize: 46,
                  lineHeight: 1.05,
                  textAlign: "center",
                  color: mezzo && luce > 0.5 ? stile.verde : stile.bianco,
                  textTransform: "uppercase",
                }}
              >
                {c.titolo}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Il ponte: palestra e partita ai lati, la variante in mezzo che li collega.
export const Ponte: React.FC<{
  durata: number;
  sinistra: number;
  destra: number;
  centro: number;
}> = ({ durata, sinistra, destra, centro }) => {
  const { frame, fps, vis } = useScena(durata);
  const sx = usaMolla(frame, fps, sinistra, 12);
  const dx = usaMolla(frame, fps, destra, 12);
  const c = spring({
    frame: frame - centro,
    fps,
    config: { damping: 10, stiffness: 150 },
  });
  const linea = usaMolla(frame, fps, centro, 16);
  const nodo = (x: number, acceso: number, testo: string, grande = false) => (
    <div
      style={{
        position: "absolute",
        left: x - 160,
        top: 0,
        width: 320,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        opacity: 0.35 + 0.65 * acceso,
      }}
    >
      <div
        style={{
          width: grande ? 120 : 84,
          height: grande ? 120 : 84,
          marginTop: grande ? 0 : 18,
          borderRadius: 999,
          background: acceso > 0.5 ? stile.verde : FONDO_SCENA,
          border: `8px solid ${acceso > 0.5 ? stile.verde : "rgba(255,255,255,0.4)"}`,
          transform: `scale(${0.7 + 0.3 * acceso})`,
          boxShadow:
            grande && acceso > 0.5
              ? `0 0 ${50 * acceso}px ${stile.verde}`
              : "none",
        }}
      />
      <div
        style={{
          marginTop: 30,
          fontFamily: stile.font,
          fontWeight: 800,
          fontSize: grande ? 52 : 46,
          lineHeight: 1.05,
          textAlign: "center",
          color: grande && acceso > 0.5 ? stile.verde : stile.bianco,
          textTransform: "uppercase",
        }}
      >
        {testo}
      </div>
    </div>
  );
  return (
    <AbsoluteFill
      style={{
        background: FONDO_SCENA,
        opacity: vis,
        alignItems: "center",
        paddingTop: 420,
      }}
    >
      <div
        style={{
          ...testoTitolo,
          fontSize: 110,
          color: stile.verde,
          opacity: c,
          transform: `scale(${0.6 + 0.4 * c})`,
        }}
      >
        Il ponte
      </div>
      <div
        style={{ position: "relative", width: 960, height: 300, marginTop: 90 }}
      >
        <div
          style={{
            position: "absolute",
            left: 160,
            right: 160,
            top: 56,
            height: 10,
            borderRadius: 5,
            background: "rgba(255,255,255,0.2)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 160 + 320 * (1 - linea),
            width: 640 * linea,
            top: 56,
            height: 10,
            borderRadius: 5,
            background: stile.verde,
            boxShadow: `0 0 18px ${stile.verde}`,
          }}
        />
        {nodo(160, sx, "Palestra")}
        {nodo(480, c, "Variante FYF", true)}
        {nodo(800, dx, "Partita")}
      </div>
    </AbsoluteFill>
  );
};

// Il gancio dei primi secondi, a effetto: due righe che sbattono dentro, la seconda in
// rosso con una scossa, freccia su per la forza e giù per i contrasti.
export const GancioForte: React.FC<{
  riga1: string;
  riga2: string;
  quando2: number; // frame della seconda riga
  durata: number;
}> = ({ riga1, riga2, quando2, durata }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame, fps, config: { damping: 11, stiffness: 180 } });
  const b = spring({
    frame: frame - quando2,
    fps,
    config: { damping: 9, stiffness: 200 },
  });
  const fuori = interpolate(frame, [durata - 6, durata], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Scossa breve quando arriva la seconda riga.
  const k = frame - quando2;
  const scossa = k >= 0 && k < 10 ? Math.sin(k * 2.6) * (10 - k) * 2.2 : 0;
  const riga: React.CSSProperties = {
    fontFamily: stile.font,
    fontWeight: 800,
    fontSize: 104,
    lineHeight: 1,
    textTransform: "uppercase",
    textAlign: "center",
    ...stile.contorno,
    WebkitTextStroke: "16px #000000",
  };
  const freccia = (su: boolean, colore: string, s: number) => (
    <svg
      width={90}
      height={110}
      style={{ overflow: "visible", transform: `scale(${s})` }}
    >
      <polygon
        points={
          su
            ? "45,0 90,55 62,55 62,110 28,110 28,55 0,55"
            : "45,110 90,55 62,55 62,0 28,0 28,55 0,55"
        }
        fill={colore}
        stroke="#000"
        strokeWidth={8}
        paintOrder="stroke"
      />
    </svg>
  );
  return (
    <AbsoluteFill
      style={{
        // Velo in alto: il testo si stacca dal girato.
        background:
          "linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 32%, rgba(0,0,0,0) 48%)",
        opacity: fuori,
        alignItems: "center",
        paddingTop: 170,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 26,
          transform: `scale(${2 - a}) translateX(${scossa * 0.4}px)`,
          opacity: Math.min(1, a * 1.5),
        }}
      >
        {freccia(true, stile.verde, a)}
        <div style={{ ...riga, color: stile.bianco, maxWidth: 800 }}>
          {riga1}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 26,
          marginTop: 40,
          opacity: frame >= quando2 ? Math.min(1, b * 1.5) : 0,
          transform: `scale(${frame >= quando2 ? 2.2 - 1.2 * b : 0}) translateX(${scossa}px) rotate(${-2 * b}deg)`,
        }}
      >
        {freccia(false, ROSSO, b)}
        <div style={{ ...riga, color: ROSSO, maxWidth: 800 }}>{riga2}</div>
      </div>
    </AbsoluteFill>
  );
};

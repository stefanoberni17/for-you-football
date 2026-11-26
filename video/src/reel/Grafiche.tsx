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

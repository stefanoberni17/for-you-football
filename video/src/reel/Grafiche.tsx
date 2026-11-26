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

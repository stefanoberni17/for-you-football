import { createContext, useContext } from "react";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ALTEZZA, frameNelReel, INSERTI_TOP_Y } from "./montaggio";
import type { PezzoMontato } from "./montaggio";
import {
  Chip,
  Colonne,
  Corrispondenza,
  Finale,
  Freccia,
  Numeri,
} from "./Grafiche";
import { stile } from "./stile";
import type { Inserto } from "./tipi";

const USCITA_FRAME = 8;

// Fondo delle schede: verde foresta scuro del brand.
const FONDO = "rgba(9, 26, 17, 0.88)";
const GRIGIO = "rgba(255,255,255,0.28)";

const FasciaY = createContext(INSERTI_TOP_Y);

const Fascia: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const y = useContext(FasciaY);
  return (
    <AbsoluteFill style={{ paddingTop: y * ALTEZZA, alignItems: "center" }}>
      {children}
    </AbsoluteFill>
  );
};

// Entrata con molla, uscita in dissolvenza negli ultimi frame.
const useEntrataUscita = (durata: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dentro = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 140 },
  });
  const fuori = interpolate(frame, [durata - USCITA_FRAME, durata], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { frame, fps, dentro, fuori };
};

const Scheda: React.FC<{
  titolo: string;
  sottotitolo?: string;
  durata: number;
}> = ({ titolo, sottotitolo, durata }) => {
  const { frame, fps, dentro, fuori } = useEntrataUscita(durata);
  // La barra verde entra prima, il testo la segue.
  const barra = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: 8,
  });
  const testo = spring({
    frame: frame - 5,
    fps,
    config: { damping: 200 },
    durationInFrames: 10,
  });
  return (
    <Fascia>
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          background: FONDO,
          borderRadius: 24,
          overflow: "hidden",
          opacity: fuori,
          transform: `translateX(${(1 - dentro) * -120}px)`,
          boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
        }}
      >
        <div
          style={{
            width: 14,
            background: stile.verde,
            transform: `scaleY(${barra})`,
          }}
        />
        <div style={{ padding: "22px 40px 24px 30px", opacity: testo }}>
          <div
            style={{
              fontFamily: stile.font,
              fontWeight: 800,
              fontSize: 56,
              color: stile.bianco,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              lineHeight: 1,
            }}
          >
            {titolo}
          </div>
          {sottotitolo ? (
            <div
              style={{
                fontFamily: stile.fontAccento,
                fontStyle: "italic",
                fontWeight: 600,
                fontSize: 46,
                color: stile.verdeChiaro,
                marginTop: 8,
              }}
            >
              {sottotitolo}
            </div>
          ) : null}
        </div>
      </div>
    </Fascia>
  );
};

type TappaReel = { frame: number; etichetta: string; sotto?: string };

const Percorso: React.FC<{
  tappe: TappaReel[];
  inizio: number;
  durata: number;
}> = ({ tappe, inizio, durata }) => {
  const { frame, fps, dentro, fuori } = useEntrataUscita(durata);
  const ora = inizio + frame; // frame nel Reel
  const LARGHEZZA = 920;
  const MARGINE = 150;
  const passo =
    tappe.length > 1 ? (LARGHEZZA - 2 * MARGINE) / (tappe.length - 1) : 0;

  // La linea verde avanza fino all'ultima tappa raggiunta, con una molla.
  const raggiunte = tappe.filter((t) => ora >= t.frame).length;
  const ultima = tappe[Math.max(0, raggiunte - 1)];
  const avanzamento = spring({
    frame: ora - (ultima?.frame ?? inizio),
    fps,
    config: { damping: 200 },
    durationInFrames: 14,
  });
  const daX = Math.max(0, raggiunte - 2) * passo;
  const aX = Math.max(0, raggiunte - 1) * passo;
  const lineaX = raggiunte <= 1 ? 0 : daX + (aX - daX) * avanzamento;

  return (
    <Fascia>
      <div
        style={{
          width: LARGHEZZA,
          height: 230,
          position: "relative",
          background: FONDO,
          borderRadius: 28,
          opacity: fuori * dentro,
          transform: `translateY(${(1 - dentro) * 40}px)`,
          boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
        }}
      >
        {/* Linea grigia di fondo e linea verde del percorso fatto. */}
        <div
          style={{
            position: "absolute",
            left: MARGINE,
            right: MARGINE,
            top: 112,
            height: 6,
            borderRadius: 3,
            background: GRIGIO,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: MARGINE,
            top: 112,
            height: 6,
            width: lineaX,
            borderRadius: 3,
            background: stile.verde,
            boxShadow: `0 0 14px ${stile.verde}`,
          }}
        />
        {tappe.map((t, i) => {
          const accesa = spring({
            frame: ora - t.frame,
            fps,
            config: { damping: 12, stiffness: 160 },
          });
          const attiva = ora >= t.frame;
          const ultimaAttiva = attiva && i === raggiunte - 1;
          const x = MARGINE + i * passo;
          return (
            <div key={i}>
              <div
                style={{
                  position: "absolute",
                  left: x - 18,
                  top: 97,
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  background: attiva ? stile.verde : FONDO,
                  border: `5px solid ${attiva ? stile.verde : GRIGIO}`,
                  transform: `scale(${attiva ? 0.6 + 0.4 * accesa : 0.8})`,
                  boxShadow: ultimaAttiva
                    ? `0 0 ${18 + 10 * accesa}px ${stile.verde}`
                    : "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: x - 135,
                  width: 270,
                  top: 26,
                  textAlign: "center",
                  fontFamily: stile.font,
                  fontWeight: 800,
                  fontSize: 44,
                  color: attiva ? stile.bianco : "rgba(255,255,255,0.35)",
                  transform: `translateY(${attiva ? (1 - accesa) * 12 : 0}px)`,
                }}
              >
                {t.etichetta}
              </div>
              {t.sotto ? (
                <div
                  style={{
                    position: "absolute",
                    left: x - 135,
                    width: 270,
                    top: 148,
                    textAlign: "center",
                    fontFamily: stile.fontAccento,
                    fontStyle: "italic",
                    fontWeight: 600,
                    fontSize: 36,
                    lineHeight: 1.05,
                    color: attiva ? stile.verdeChiaro : "transparent",
                    opacity: attiva ? accesa : 0,
                  }}
                >
                  {t.sotto}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </Fascia>
  );
};

export const Inserti: React.FC<{
  inserti: Inserto[];
  pezzi: PezzoMontato[];
  y?: number;
}> = ({ inserti, pezzi, y = INSERTI_TOP_Y }) => {
  return (
    <FasciaY.Provider value={y}>
      <AbsoluteFill>
        {inserti.map((ins, i) => {
          if (ins.tipo === "scheda") {
            const da = frameNelReel(ins.da, pezzi);
            const durata = frameNelReel(ins.a, pezzi) - da;
            if (durata <= 0) return null;
            return (
              <Sequence
                key={i}
                from={da}
                durationInFrames={durata}
                layout="none"
              >
                <Scheda
                  titolo={ins.titolo}
                  sottotitolo={ins.sottotitolo}
                  durata={durata}
                />
              </Sequence>
            );
          }
          if (ins.tipo !== "percorso") {
            const da = frameNelReel(ins.da, pezzi);
            const durata = frameNelReel(ins.a, pezzi) - da;
            if (durata <= 0) return null;
            const rel = (s: number) => frameNelReel(s, pezzi) - da;
            return (
              <Sequence
                key={i}
                from={da}
                durationInFrames={durata}
                layout="none"
              >
                {ins.tipo === "colonne" ? (
                  <Colonne
                    durata={durata}
                    accendi={rel(ins.accendi)}
                    sinistra={ins.sinistra}
                    destra={ins.destra}
                    y={ins.y ?? y}
                  />
                ) : ins.tipo === "numeri" ? (
                  <Numeri
                    durata={durata}
                    righe={ins.righe.map((r) => ({
                      ...r,
                      frame: rel(r.quando),
                    }))}
                    fonte={ins.fonte}
                  />
                ) : ins.tipo === "chip" ? (
                  <Chip
                    durata={durata}
                    titolo={ins.titolo}
                    voci={ins.voci.map((v) => ({ ...v, frame: rel(v.quando) }))}
                    y={ins.y ?? y}
                  />
                ) : ins.tipo === "freccia" ? (
                  <Freccia
                    durata={durata}
                    titolo={ins.titolo}
                    sotto={ins.sotto}
                    quando={rel(ins.quando)}
                  />
                ) : ins.tipo === "corrispondenza" ? (
                  <Corrispondenza
                    durata={durata}
                    sopra={ins.sopra}
                    titolo={rel(ins.titolo)}
                    riempi={rel(ins.riempi)}
                    fine={rel(ins.fine)}
                  />
                ) : (
                  <Finale durata={durata} righe={ins.righe} />
                )}
              </Sequence>
            );
          }
          const tappe = ins.tappe.map((t) => ({
            ...t,
            frame: frameNelReel(t.quando, pezzi),
          }));
          const da = tappe[0]?.frame ?? 0;
          const durata = frameNelReel(ins.a, pezzi) - da;
          if (durata <= 0) return null;
          return (
            <Sequence key={i} from={da} durationInFrames={durata} layout="none">
              <FasciaY.Provider value={ins.y ?? y}>
                <Percorso tappe={tappe} inizio={da} durata={durata} />
              </FasciaY.Provider>
            </Sequence>
          );
        })}
      </AbsoluteFill>
    </FasciaY.Provider>
  );
};

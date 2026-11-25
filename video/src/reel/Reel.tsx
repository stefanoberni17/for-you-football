import { useMemo } from "react";
import {
  AbsoluteFill,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { GANCIO_SECONDI, inquadratura, montaPezzi, paroleNelReel, ZOOM_DERIVA } from "./montaggio";
import type { PezzoMontato } from "./montaggio";
import { Inserti } from "./Inserti";
import { Sottotitoli } from "./Sottotitoli";
import { stile } from "./stile";
import type { ReelProps } from "./tipi";

const Pezzo: React.FC<{ girato: string; voltoY: number; pezzo: PezzoMontato }> = ({
  girato,
  voltoY,
  pezzo,
}) => {
  const frame = useCurrentFrame();
  // Lento avvicinamento dentro il pezzo: l'immagine non resta mai ferma.
  const deriva = interpolate(frame, [0, pezzo.durataFrame], [0, ZOOM_DERIVA]);
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "black" }}>
      <OffthreadVideo
        src={staticFile(girato)}
        trimBefore={Math.round(pezzo.da * 30)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          // Volto nella parte medio-alta, zoom attorno al volto.
          ...inquadratura(voltoY, pezzo.zoom + deriva),
        }}
      />
    </AbsoluteFill>
  );
};

const Gancio: React.FC<{ testo: string }> = ({ testo }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dentro = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 10 });
  const fuori = interpolate(frame, [GANCIO_SECONDI * fps - 8, GANCIO_SECONDI * fps], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 170 }}>
      <div
        style={{
          fontFamily: stile.font,
          fontWeight: 800,
          fontSize: 54,
          lineHeight: 1.1,
          color: stile.scuro,
          background: stile.verde,
          padding: "18px 34px",
          borderRadius: 22,
          maxWidth: 900,
          textAlign: "center",
          opacity: dentro * fuori,
          transform: `translateY(${(1 - dentro) * -30}px)`,
        }}
      >
        {testo}
      </div>
    </AbsoluteFill>
  );
};

export const Reel: React.FC<ReelProps> = ({
  girato,
  voltoY,
  pezzi,
  parole,
  paroleChiave = [],
  gancio,
  inserti = [],
  sottotitoliY,
  insertiY,
}) => {
  const { fps } = useVideoConfig();
  const montati = useMemo(() => montaPezzi(pezzi), [pezzi]);
  const captions = useMemo(() => paroleNelReel(parole, montati), [parole, montati]);

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {montati.map((p, i) => (
        <Sequence key={i} from={p.inizioFrame} durationInFrames={p.durataFrame}>
          <Pezzo girato={girato} voltoY={voltoY} pezzo={p} />
        </Sequence>
      ))}
      <Sottotitoli captions={captions} paroleChiave={paroleChiave} y={sottotitoliY} />
      <Inserti inserti={inserti} pezzi={montati} y={insertiY} />
      {gancio ? (
        <Sequence durationInFrames={Math.round(GANCIO_SECONDI * fps)}>
          <Gancio testo={gancio} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};

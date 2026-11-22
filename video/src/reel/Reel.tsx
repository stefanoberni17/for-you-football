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
import { GANCIO_SECONDI, montaPezzi, paroleNelReel, ZOOM_DERIVA } from "./montaggio";
import type { PezzoMontato } from "./montaggio";
import { Sottotitoli } from "./Sottotitoli";
import { stile } from "./stile";
import type { ReelProps } from "./tipi";

const Pezzo: React.FC<{ girato: string; pezzo: PezzoMontato }> = ({ girato, pezzo }) => {
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
          // Zoom verso il volto, che sta nel terzo alto.
          transformOrigin: "50% 32%",
          transform: `scale(${pezzo.zoom + deriva})`,
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
    <AbsoluteFill style={{ alignItems: "center", paddingTop: stile.margineAlto }}>
      <div
        style={{
          fontFamily: stile.font,
          fontWeight: 800,
          fontSize: 54,
          lineHeight: 1.1,
          color: "#0b1f14",
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

export const Reel: React.FC<ReelProps> = ({ girato, pezzi, parole, gancio }) => {
  const { fps } = useVideoConfig();
  const montati = useMemo(() => montaPezzi(pezzi), [pezzi]);
  const captions = useMemo(() => paroleNelReel(parole, montati), [parole, montati]);

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {montati.map((p, i) => (
        <Sequence key={i} from={p.inizioFrame} durationInFrames={p.durataFrame}>
          <Pezzo girato={girato} pezzo={p} />
        </Sequence>
      ))}
      <Sottotitoli captions={captions} />
      {gancio ? (
        <Sequence durationInFrames={Math.round(GANCIO_SECONDI * fps)}>
          <Gancio testo={gancio} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};

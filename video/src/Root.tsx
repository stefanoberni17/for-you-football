import { Composition } from "remotion";
import { Reel } from "./reel/Reel";
import { durataReel, FPS, montaPezzi } from "./reel/montaggio";
import type { ReelProps } from "./reel/tipi";
import { prova } from "./progetti/prova";
import { reel06 } from "./progetti/reel06";

// Ogni video da pubblicare = una Composition con i suoi dati in src/progetti/.
const progetti: Record<string, ReelProps> = { prova, reel06 };

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {Object.entries(progetti).map(([id, props]) => (
        <Composition
          key={id}
          id={id}
          component={Reel}
          defaultProps={props}
          fps={FPS}
          width={1080}
          height={1920}
          durationInFrames={durataReel(montaPezzi(props.pezzi))}
        />
      ))}
    </>
  );
};

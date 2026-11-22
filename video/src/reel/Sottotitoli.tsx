import { useMemo } from "react";
import {
  AbsoluteFill,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { createTikTokStyleCaptions } from "@remotion/captions";
import type { Caption, TikTokPage } from "@remotion/captions";
import { stile } from "./stile";

// Poche parole per volta: si leggono col telefono in mano.
const CAMBIA_OGNI_MS = 900;

const Pagina: React.FC<{ page: TikTokPage }> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const oraMs = page.startMs + (frame / fps) * 1000;
  const entrata = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 6 });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        // Sopra la zona di descrizione e bottoni di Instagram.
        paddingBottom: stile.margineSottotitoli,
        paddingLeft: 80,
        paddingRight: 80,
      }}
    >
      <div
        style={{
          fontFamily: stile.font,
          fontSize: 78,
          fontWeight: 800,
          lineHeight: 1.12,
          textAlign: "center",
          whiteSpace: "pre-wrap",
          color: stile.bianco,
          textTransform: "uppercase",
          letterSpacing: -0.5,
          WebkitTextStroke: "10px rgba(0,0,0,0.85)",
          paintOrder: "stroke fill",
          transform: `scale(${0.92 + 0.08 * entrata})`,
        }}
      >
        {page.tokens.map((t, i) => {
          const attiva = t.fromMs <= oraMs && t.toMs > oraMs;
          return (
            <span key={`${t.fromMs}-${i}`} style={{ color: attiva ? stile.verde : stile.bianco }}>
              {t.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Sottotitoli: React.FC<{ captions: Caption[] }> = ({ captions }) => {
  const { fps } = useVideoConfig();
  const { pages } = useMemo(
    () => createTikTokStyleCaptions({ captions, combineTokensWithinMilliseconds: CAMBIA_OGNI_MS }),
    [captions],
  );

  return (
    <AbsoluteFill>
      {pages.map((page, i) => {
        const next = pages[i + 1] ?? null;
        const from = Math.round((page.startMs / 1000) * fps);
        const fine = next
          ? Math.round((next.startMs / 1000) * fps)
          : Math.round(((page.startMs + page.durationMs) / 1000) * fps) + 10;
        const durata = fine - from;
        if (durata <= 0) return null;
        return (
          <Sequence key={i} from={from} durationInFrames={durata} layout="none">
            <Pagina page={page} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

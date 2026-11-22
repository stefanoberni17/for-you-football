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
import { ALTEZZA, pulisci, SOTTOTITOLI_TOP_Y } from "./montaggio";
import { stile } from "./stile";

// Poche parole per volta: si leggono col telefono in mano.
const CAMBIA_OGNI_MS = 900;

const Pagina: React.FC<{ page: TikTokPage; chiave: Set<string> }> = ({ page, chiave }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const oraMs = page.startMs + (frame / fps) * 1000;
  const entrata = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 6 });

  return (
    <AbsoluteFill
      style={{
        // Poco sotto la metà, sotto il volto.
        paddingTop: SOTTOTITOLI_TOP_Y * ALTEZZA,
        alignItems: "center",
        paddingLeft: 70,
        paddingRight: 70,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "baseline",
          columnGap: 4,
          rowGap: 4,
          maxWidth: 940,
          opacity: entrata,
          transform: `translateY(${(1 - entrata) * 14}px)`,
        }}
      >
        {page.tokens.map((t, i) => {
          const attiva = t.fromMs <= oraMs && t.toMs > oraMs;
          const accento = chiave.has(pulisci(t.text));
          const testo = t.text.trim();
          if (accento) {
            return (
              <span
                key={`${t.fromMs}-${i}`}
                style={{
                  fontFamily: stile.fontAccento,
                  fontStyle: "italic",
                  fontWeight: 600,
                  fontSize: 94,
                  padding: "0 6px",
                  color: attiva ? stile.verde : stile.verdeChiaro,
                  ...stile.contorno,
                }}
              >
                {testo}
              </span>
            );
          }
          return (
            <span
              key={`${t.fromMs}-${i}`}
              style={{
                fontFamily: stile.font,
                fontWeight: 700,
                fontSize: 74,
                lineHeight: 1.15,
                color: attiva ? stile.scuro : stile.bianco,
                background: attiva ? stile.verde : "transparent",
                borderRadius: 14,
                padding: "0 10px",
                ...(attiva ? {} : stile.contorno),
              }}
            >
              {testo}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Sottotitoli: React.FC<{ captions: Caption[]; paroleChiave: string[] }> = ({
  captions,
  paroleChiave,
}) => {
  const { fps } = useVideoConfig();
  const chiave = useMemo(() => new Set(paroleChiave), [paroleChiave]);
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
            <Pagina page={page} chiave={chiave} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

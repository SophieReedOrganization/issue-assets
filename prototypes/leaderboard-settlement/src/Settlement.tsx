import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { T, FONT, BEATS } from "./theme";

/* ────────────────────────────────────────────────
   共用小元件
   ──────────────────────────────────────────────── */

const Chrome: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{
      background: T.warm,
      fontFamily: FONT,
      color: T.charcoal,
      padding: "0 72px",
      justifyContent: "center",
    }}
  >
    {children}
  </AbsoluteFill>
);

const Title: React.FC<{ sub?: string }> = ({ sub }) => (
  <div style={{ marginBottom: 64 }}>
    <div style={{ fontSize: 64, fontWeight: 800, color: T.ink, letterSpacing: "-0.02em" }}>
      排行榜
    </div>
    {sub ? (
      <div style={{ fontSize: 34, color: T.muted, marginTop: 10 }}>{sub}</div>
    ) : null}
  </div>
);

/** 名次列。value 會隨 progress 從 0 數到目標值。 */
const Row: React.FC<{
  rank: number;
  name: string;
  value: number;
  progress: number;
  dim?: boolean;
}> = ({ rank, name, value, progress, dim }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 32,
      padding: "34px 40px",
      background: T.white,
      border: `2px solid ${T.gray}`,
      borderRadius: 32,
      marginBottom: 20,
      opacity: dim ? 0.42 : 1,
    }}
  >
    <span style={{ fontSize: 36, color: T.muted, width: 88, fontVariantNumeric: "tabular-nums" }}>
      #{rank}
    </span>
    <span style={{ width: 68, height: 68, borderRadius: 999, background: T.mint }} />
    <span style={{ fontSize: 42, fontWeight: 600, flex: 1 }}>{name}</span>
    <span style={{ fontSize: 46, fontWeight: 800, color: T.ink, fontVariantNumeric: "tabular-nums" }}>
      {Math.round(value * progress)}
    </span>
  </div>
);

/* ────────────────────────────────────────────────
   1. 倒數：時間被壓縮，週期正在收束
   ──────────────────────────────────────────────── */

const Countdown: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const steps = ["還有 3 天結算", "還有 2 天結算", "還有 1 天結算", "今晚 24:00 結算"];
  const idx = Math.min(steps.length - 1, Math.floor(interpolate(frame, [0, 2.6 * fps], [0, steps.length])));

  // 每次換字給一個極短的彈入，讓時間感有節拍
  const stepStart = (idx * 2.6 * fps) / steps.length;
  const pop = spring({ frame: frame - stepStart, fps, config: { damping: 200 }, durationInFrames: 12 });

  const urgency = interpolate(idx, [0, steps.length - 1], [0, 1]);
  const enter = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 18 });

  return (
    <Chrome>
      <div style={{ opacity: enter }}>
        <Title sub="本週 · 經驗值" />
        <div
          style={{
            display: "inline-flex",
            alignItems: "baseline",
            gap: 18,
            padding: "28px 48px",
            borderRadius: 999,
            background: interpolate(urgency, [0, 1], [0, 1]) > 0.6 ? T.mustard : T.mint,
            marginBottom: 60,
            transform: `scale(${interpolate(pop, [0, 1], [0.94, 1])})`,
          }}
        >
          <span style={{ fontSize: 48, fontWeight: 800, color: urgency > 0.6 ? "#5a4410" : T.ink }}>
            {steps[idx]}
          </span>
        </div>

        <Row rank={1} name="G*B" value={468} progress={1} />
        <Row rank={2} name="G*A" value={401} progress={1} />
        <Row rank={3} name="G7A" value={320} progress={1} />
        <Row rank={4} name="G*A" value={288} progress={1} dim />
      </div>
    </Chrome>
  );
};

/* ────────────────────────────────────────────────
   2. 揭曉：三個名次依序落定
   ──────────────────────────────────────────────── */

const Podium: React.FC<{ place: 1 | 2 | 3; name: string; value: number; delay: number }> = ({
  place,
  name,
  value,
  delay,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames: 26 });

  const height = place === 1 ? 420 : place === 2 ? 320 : 260;
  const medal = place === 1 ? "🥇" : place === 2 ? "🥈" : "🥉";

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        transform: `translateY(${interpolate(s, [0, 1], [70, 0])}px)`,
        opacity: s,
      }}
    >
      <div style={{ fontSize: place === 1 ? 96 : 74, marginBottom: 16 }}>{medal}</div>
      <div style={{ fontSize: place === 1 ? 48 : 40, fontWeight: 800, marginBottom: 8 }}>{name}</div>
      <div
        style={{
          fontSize: place === 1 ? 58 : 48,
          fontWeight: 800,
          color: T.ink,
          fontVariantNumeric: "tabular-nums",
          marginBottom: 18,
        }}
      >
        {Math.round(value * s)}
      </div>
      <div
        style={{
          width: "100%",
          height,
          borderRadius: "36px 36px 0 0",
          background: place === 1 ? T.mustard : T.white,
          border: `2px solid ${place === 1 ? T.mustard : T.gray}`,
          borderBottom: "none",
        }}
      />
    </div>
  );
};

const Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const seal = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 20 });
  const sealOut = interpolate(frame, [0.5 * fps, 0.9 * fps], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Chrome>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          opacity: sealOut,
          pointerEvents: "none",
          zIndex: 2,
        }}
      >
        <div
          style={{
            padding: "40px 90px",
            background: T.deep,
            color: T.white,
            borderRadius: 999,
            fontSize: 68,
            fontWeight: 800,
            letterSpacing: "0.04em",
            transform: `scale(${interpolate(seal, [0, 1], [0.86, 1])})`,
          }}
        >
          本週結算
        </div>
      </div>

      <div style={{ opacity: interpolate(frame, [0.4 * fps, 0.8 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        <Title sub="7/21 – 7/27 · 共 11 人參與" />
        <div style={{ display: "flex", gap: 20, alignItems: "flex-end", height: 860 }}>
          <Podium place={3} name="G7A" value={320} delay={0.8 * fps} />
          <Podium place={1} name="G*B" value={468} delay={1.4 * fps} />
          <Podium place={2} name="G*A" value={401} delay={1.1 * fps} />
        </div>
      </div>
    </Chrome>
  );
};

/* ────────────────────────────────────────────────
   3. 個人成績：跟自己比
   ──────────────────────────────────────────────── */

const Personal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const card = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 24 });
  const count = interpolate(frame, [0.15 * fps, 0.9 * fps], [0, 320], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const delta = spring({ frame: frame - 0.9 * fps, fps, config: { damping: 200 }, durationInFrames: 22 });

  return (
    <Chrome>
      <Title />
      <div
        style={{
          background: `linear-gradient(120deg, ${T.mint}, #e6f7f5)`,
          border: `3px solid ${T.tiffany}`,
          borderRadius: 52,
          padding: "72px 64px",
          transform: `scale(${interpolate(card, [0, 1], [0.94, 1])})`,
          opacity: card,
        }}
      >
        <div style={{ fontSize: 38, color: T.ink, marginBottom: 16 }}>你這週賺到</div>
        <div
          style={{
            fontSize: 168,
            fontWeight: 800,
            color: T.ink,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            marginBottom: 20,
          }}
        >
          {Math.round(count)}
          <span style={{ fontSize: 54, fontWeight: 700, marginLeft: 20 }}>經驗值</span>
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 14,
            fontSize: 50,
            fontWeight: 800,
            color: T.up,
            opacity: delta,
            transform: `translateY(${interpolate(delta, [0, 1], [16, 0])}px)`,
          }}
        >
          ↑ 比上週多 30%
          <span style={{ fontSize: 36, fontWeight: 500, color: T.muted }}>上週 246</span>
        </div>
      </div>

      <div
        style={{
          marginTop: 44,
          display: "flex",
          alignItems: "center",
          gap: 26,
          padding: "44px 54px",
          background: T.white,
          border: `2px solid ${T.tiffany}`,
          borderRadius: 36,
          opacity: spring({ frame: frame - 1.2 * fps, fps, config: { damping: 200 }, durationInFrames: 20 }),
        }}
      >
        <span style={{ fontSize: 86, fontWeight: 800, color: T.deep, fontVariantNumeric: "tabular-nums" }}>
          #3
        </span>
        <div>
          <div style={{ fontSize: 46, fontWeight: 700 }}>全校第 3 名</div>
          <div style={{ fontSize: 32, color: T.muted, marginTop: 6 }}>共 11 人參與</div>
        </div>
      </div>
    </Chrome>
  );
};

/* ────────────────────────────────────────────────
   4. 歸零：新的一週，人人有機會
   ──────────────────────────────────────────────── */

const Reset: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 名次數字歸零，再讓新週期的倒數浮出
  const drain = interpolate(frame, [0, 0.7 * fps], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fresh = spring({ frame: frame - 0.8 * fps, fps, config: { damping: 200 }, durationInFrames: 26 });

  return (
    <Chrome>
      <Title sub="本週 · 經驗值" />
      <div style={{ opacity: interpolate(drain, [0, 1], [0.35, 1]) }}>
        <Row rank={1} name="G*B" value={468} progress={drain} />
        <Row rank={2} name="G*A" value={401} progress={drain} />
        <Row rank={3} name="G7A" value={320} progress={drain} />
      </div>

      <div
        style={{
          marginTop: 64,
          textAlign: "center",
          opacity: fresh,
          transform: `translateY(${interpolate(fresh, [0, 1], [26, 0])}px)`,
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 800, color: T.ink, marginBottom: 22 }}>
          新的一週開始
        </div>
        <div
          style={{
            display: "inline-block",
            padding: "26px 56px",
            borderRadius: 999,
            background: T.mint,
            fontSize: 44,
            fontWeight: 700,
            color: T.ink,
          }}
        >
          還有 7 天結算
        </div>
        <div style={{ fontSize: 36, color: T.muted, marginTop: 32 }}>每個人都從零開始</div>
      </div>
    </Chrome>
  );
};

/* ────────────────────────────────────────────────
   組合
   ──────────────────────────────────────────────── */

/**
 * variant 決定播哪幾段。
 *
 *  full   完整敘事，給規格參考用，不是 app 內會播的長度
 *  inapp  學生結算後第一次進排行榜看到的（有進帳）
 *  quiet  當期沒有進帳的學生看到的，只保留「重來」那一段
 */
export type Variant = "full" | "inapp" | "quiet";

export const Settlement: React.FC<{ variant?: Variant }> = ({ variant = "full" }) => {
  const { fps } = useVideoConfig();
  const sec = (n: number) => Math.round(n * fps);

  if (variant === "quiet") {
    return (
      <AbsoluteFill style={{ background: T.warm }}>
        <Sequence from={0} durationInFrames={sec(2.0)}>
          <Reset />
        </Sequence>
      </AbsoluteFill>
    );
  }

  if (variant === "inapp") {
    return (
      <AbsoluteFill style={{ background: T.warm }}>
        <Sequence from={0} durationInFrames={sec(2.2)}>
          <Reveal />
        </Sequence>
        <Sequence from={sec(2.0)} durationInFrames={sec(1.6)}>
          <Personal />
        </Sequence>
        <Sequence from={sec(3.4)} durationInFrames={sec(1.6)}>
          <Reset />
        </Sequence>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ background: T.warm }}>
      <Sequence from={sec(BEATS.countdown.from)} durationInFrames={sec(BEATS.countdown.dur)}>
        <Countdown />
      </Sequence>
      <Sequence from={sec(BEATS.reveal.from)} durationInFrames={sec(BEATS.reveal.dur)}>
        <Reveal />
      </Sequence>
      <Sequence from={sec(BEATS.personal.from)} durationInFrames={sec(BEATS.personal.dur)}>
        <Personal />
      </Sequence>
      <Sequence from={sec(BEATS.reset.from)} durationInFrames={sec(BEATS.reset.dur)}>
        <Reset />
      </Sequence>
    </AbsoluteFill>
  );
};

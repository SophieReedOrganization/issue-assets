/**
 * 取自 apps/student/src/styles/globals.css 的實際 token。
 * 這支影片是給 #1135 用的結算時刻示意，配色必須跟產品一致。
 */
export const T = {
  tiffany: "#81d6d0",
  deep: "#1f8e86",
  ink: "#1f6f68",
  charcoal: "#333333",
  warm: "#f7f7f2",
  mint: "#beefe9",
  mustard: "#ffd166",
  coral: "#ff8a7a",
  cream: "#f2ede4",
  gray: "#e9ecef",
  white: "#ffffff",
  muted: "#7b857f",
  up: "#1a7d3e",
} as const;

export const FONT =
  '"PingFang TC","Noto Sans TC","Hiragino Sans","Microsoft JhengHei",sans-serif';

/** 場景切點，單位是秒。改這裡就好，元件都從這裡讀。 */
export const BEATS = {
  countdown: { from: 0, dur: 4.0 },
  reveal: { from: 3.8, dur: 4.6 },
  personal: { from: 8.2, dur: 3.6 },
  reset: { from: 11.6, dur: 3.4 },
} as const;

export const TOTAL_SECONDS = 15;

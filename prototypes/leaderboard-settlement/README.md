# 排行榜結算動畫原型（Remotion）

#1135 的結算揭曉動畫規格來源。這是 React，時間軸與 spring 參數可直接照搬。

## 跑起來

```bash
npm install
npm run studio          # 開編輯器即時調
npx remotion render SettlementInApp out/inapp.mp4
```

## 三個 composition

| id | 長度 | 用途 |
|---|---|---|
| `SettlementFull` | 15s | 完整敘事，理解節奏用，不是 app 內長度 |
| `SettlementInApp` | 5s | 學生結算後第一次進排行榜（當期有進帳） |
| `SettlementQuiet` | 2s | 當期沒有進帳的學生，只保留「歸零重來」 |

## 對節奏看這裡

- `src/theme.ts` 的 `BEATS`：四個場景的起點與長度，單位是秒
- `src/Settlement.tsx` 的 `Podium`：`delay` 決定三個名次的落定順序
  目前是 `place3 = 0.8s`、`place2 = 1.1s`、`place1 = 1.4s`，也就是 **第 3 → 第 2 → 第 1**
- 所有動畫用 `spring({ frame, fps, config: { damping: 200 }, durationInFrames: N })`
  `damping: 200` 是無彈跳的自然運動，Remotion 官方建議值

## 注意

色票取自學生端出貨 token（`--eduba-*`），不是設計規範 v4.1。見 #1139。

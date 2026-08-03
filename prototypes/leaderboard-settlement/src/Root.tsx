import React from "react";
import { Composition } from "remotion";
import { Settlement } from "./Settlement";
import { TOTAL_SECONDS } from "./theme";

const FPS = 30;
const SIZE = { width: 1080, height: 1920 } as const;

export const RemotionRoot: React.FC = () => (
  <>
    {/* 完整敘事，給規格參考，不是 app 內的長度 */}
    <Composition
      id="SettlementFull"
      component={Settlement}
      defaultProps={{ variant: "full" as const }}
      durationInFrames={TOTAL_SECONDS * FPS}
      fps={FPS}
      {...SIZE}
    />
    {/* 學生結算後第一次進排行榜看到的（當期有進帳） */}
    <Composition
      id="SettlementInApp"
      component={Settlement}
      defaultProps={{ variant: "inapp" as const }}
      durationInFrames={Math.round(5 * FPS)}
      fps={FPS}
      {...SIZE}
    />
    {/* 當期沒有進帳的學生看到的，只保留重來那一段 */}
    <Composition
      id="SettlementQuiet"
      component={Settlement}
      defaultProps={{ variant: "quiet" as const }}
      durationInFrames={Math.round(2 * FPS)}
      fps={FPS}
      {...SIZE}
    />
  </>
);

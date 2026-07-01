# 監控可行性 — 工程 Review（講義 ↔ 平台 通訊協定）

> **需求**:監控面板要能看到**所有狀態**(學生在講義中做到哪裡);**若某份平台 HTML 不符合本規範,則 fallback 回目前狀態**——知道學生在「哪一份講義」,但看不到細節。(見 §1.5)
> **請 review 的事**:用這套 postMessage 協定,把互動講義接成「平台監控得到學生進度(在第幾頁/哪一關、答對沒、完成沒)」——請評估**平台端實作可行性**、確認 §2 checklist 與 §3 決策點。
> **一句話結論**:模板端已就緒(所有事件都在送、v18 已全 6987 份 + tab 型模板實測);缺口只在**平台端要加 handler**(目前只接 game:ready + TASK_COMPLETED)。
> 基準:引擎 `雜誌風_舊結構/index.html`(`PROTOCOL_VERSION='1.1'` / `ENGINE_VERSION='v18'`)。日期 2026-07-01。
> 附件:`附件A_頁式引擎_參考實作_v18.html`(完整參考實作)、`附件B_tab型模板_監控改造範例.html`(既有 tab 模板改成可監控的實例,已實測)。

---

## 1. 監控需求 → 對應事件(一眼對照)

| 想監控什麼 | 上行事件 | 關鍵欄位 | 平台現況 |
|---|---|---|:---:|
| 學生開始 | `game:ready` | totalPages, totalQuestions, capabilities | ✅ 已接 |
| **現在在第幾頁 / 哪一關** | `PROGRESS_UPDATE` | **page**(絕對位置), section(關卡標題), pageType | ❌ **未接** |
| 每題對錯 / 耗時 / 第幾次 | `ANSWER` | questionId, correct, timeMs, attempt | ❌ 未接 |
| 即時過關數 | `SECTION_CLEARED` | firstTry, clearedQuestions | ❌ 未接 |
| 完成 + 成績 | `TASK_COMPLETED` | achievedScore, performance, suggestedRewards | ✅ 已接 |

→ **要監控「在第幾頁/哪一關」的關鍵就是加 `PROGRESS_UPDATE` handler**;資料模板端已在送。

---

## 1.5 🔴 監控分級與 fallback(核心需求)

平台**依模板是否符合規範自動分級**,不合規就退回現況,零風險漸進導入:

| 級別 | 條件 | 監控面板看得到 |
|---|---|---|
| **Level 2 完整** | 模板有發 `game:ready` 且 `capabilities` 含 `PROGRESS_UPDATE` | 學生**在第幾頁/哪一關**、作答對錯、過關數、完成+成績(全狀態) |
| **Level 1 fallback(=目前狀態)** | 未依規範:逾時收不到 `game:ready`,或 capabilities 不含 PROGRESS_UPDATE | 只知學生**開了哪一份講義(task)**;有發 TASK_COMPLETED 則另知「已完成」 |

**平台偵測(判斷用哪一級)**:
```js
// 建 iframe 前先掛 listener;載入後啟動計時器
let tier = 1, t = setTimeout(()=>applyTier(1), 2000);   // 逾時 → fallback
onMessage('game:ready', (data) => {
  clearTimeout(t);
  tier = (data.capabilities || []).includes('PROGRESS_UPDATE') ? 2 : 1;
  applyTier(tier);
});
// (可選)逾時前補發一次 REQUEST_READY 再等,提高辨識率
```

- **好處**:不必一次改完所有模板;**改好一份就自動升 Level 2,其餘自動 fallback**(對舊/第三方 HTML 零影響)。
- 面板呈現:Level 2 顯示細節位置;Level 1 顯示「進行中(某份講義)」即可。
- 判級也可只看「2 秒內有無 `game:ready`」當最簡門檻;`capabilities` 則用來細分支援到哪些事件。

---

## 1.6 設計原則:小核心 + 能力 + fallback(如何涵蓋各式各樣的 HTML)

> 面對「各式各樣」的模板,**刻意不在規範裡窮舉型別**——那會讓規範肥大、模板更難合規(合規率低→fallback 多)、資料語意失真、平台被迫 `switch(型別)` 而脆弱。改用以下三原則,反而覆蓋最廣、最不易壞:

1. **小而穩的通用詞彙**:只用 5 個上行事件;位置一律抽象成 `page`(索引)+`section`(標籤)+`percent`(完成度)+`pageType`(自由字串單位)。頁式/tab/影片/閱讀/模擬皆能表達,平台**一種讀法**。
2. **能力驅動,非型別驅動**:平台看模板送了什麼(`capabilities`)決定顯示什麼,**不認得也不判斷模板型別**。新型別會送 `PROGRESS_UPDATE` 就自動被監控,零平台改動。
3. **預設 fallback(§1.5)**:看不懂就優雅降級到「知道在哪一份」。
- **最小合規** = 只要 `game:ready` + `PROGRESS_UPDATE` 兩件事即可被完整監控位置。門檻越低、合規率越高。
- **逃生口**:型別專屬資訊放 `PROGRESS_UPDATE.data.detail`(選配),平台預設忽略。
- **設計非目標**:本規範**不列舉模板型別**、不為特定型別加專屬事件/欄位;一致性靠附件 A/B 兩份參考實作當範本。

---

## 2. 🔴 平台端待辦（接入 checklist）
現況:`apps/student/src/hooks/useIframeMessaging.ts` 只接 `game:ready` + `TASK_COMPLETED`。

1. **加 `PROGRESS_UPDATE` handler**(核心)→ 存 `page`+`section`,推監控面板。
2. 加 `ANSWER` / `SECTION_CLEARED` handler(選)→ 每題對錯 / 即時過關。
3. **續讀**:收 `game:ready` 後,有存檔則發 `SET_PAGE{page, clearedUpTo}`。
4. **冪等去重**:`game:ready`、`TASK_COMPLETED` 以 `taskId` 去重(reload / 拉取可能重入)。
5. **補漏**:偵測漏接時主動發 `REQUEST_READY` / `REQUEST_STATE`。
6. **listener 時機**:建立 iframe **前**就掛好 `message` listener。
7. **作答儲存鍵**:用 **(instanceId/taskId + questionId)** 複合鍵。
8. 安全(選):需嚴謹則驗 `e.origin`(見 §4.6)。

> 工時感:核心監控(1 項)= 在既有 `switch(type)` 加 1 個 case + 一條寫入。續讀/補漏/去重視需求增量。

---

## 3. 需你確認的決策點
- **`achievedScore`/`accuracy` = 「一次答對率」**（一次就答對題數 / 總題數,重試後才過的不計)。是否符合平台成績/獎勵口徑?要「最終答對率」可另加欄位(放 `data`,向下相容)。
- **`percent` = 完成度(過關題數 %),非閱讀頁位**;「在第幾頁」一律用 `page`。
- **完成由學生按「完成學習」觸發**(非自動);平台可 `window.sendTaskComplete()` 強制。
- **恢復採平台主動拉取**(`REQUEST_STATE`),模板不自動重送(避免現行未去重平台重複發獎)。

---

## 4. 完整協定(自足)

### 4.1 封裝
```js
// 上行(模板→平台)
window.parent.postMessage({ type:'<事件>', data:{...}, source:'eduTemplate', timestamp:Date.now() }, '*');
// 下行(平台→模板)
iframe.contentWindow.postMessage({ type:'<指令>', data:{...}, source:'eduPlatform' }, '*');
```
> 只處理對應 `source`;未知 `type` 雙方忽略(向下相容)。`key 是 data 不是 payload`。

### 4.2 上行事件(5 種)
```js
// game:ready — 載入完成(先掛 listener 再發;可經 REQUEST_READY 重發)
{ totalPages:40, totalQuestions:24, protocolVersion:"1.1", engineVersion:"v18",
  capabilities:["game:ready","PROGRESS_UPDATE","ANSWER","SECTION_CLEARED","TASK_COMPLETED",
                "SET_PAGE","RESET_PROGRESS","REQUEST_READY","REQUEST_STATE","SET_ZHUYIN","SET_THEME"],
  timestamp:… }

// PROGRESS_UPDATE — 位置改變時送(回報「絕對位置」)
{ page:7,                 // 🔴 抽象位置索引(頁式=頁index / tab=tab index / 影片=時間段…),單調即可
  totalPages:40,
  percent:35,             // 完成度 0-100
  section:"關卡 2:…",     // 人類可讀標籤(顯示用)
  pageType:"cardpage",    // 位置單位「自由字串」:page/tab/section/video/step…;平台只顯示、不 switch 型別
  clearedQuestions:6, totalQuestions:24,
  detail:{ /* … */ }      // (選配)逃生口:模板專屬資訊,平台預設忽略、不必理解
}

// ANSWER — 每次作答(對錯都送)
{ questionId:"q3", type:"mcq|sort|slider", correct:true, timeMs:4200, attempt:1 }

// SECTION_CLEARED — 某題過關
{ questionId:"q3", firstTry:true, clearedQuestions:7, totalQuestions:24 }

// TASK_COMPLETED — 完成(學生按「完成學習」/ sendTaskComplete 才發,只主動發一次)
{ achievedScore:0.92,               // 0-1,一次答對率
  completedAt:"2026-…Z",
  performance:{ totalQuestions:24, correctAnswers:22, accuracy:0.92, maxCombo:9, guessingCount:0, totalTimeMs:540000 },
  suggestedRewards:{ xp:25(≤25), coins:10(≤10), badges:["accuracy_high","no_guess"] },
  sessionLog:[ {event,ts,data}, … ] }
```

### 4.3 下行指令(5 種)
```js
SET_PAGE       { page:7, clearedUpTo:6 }   // 續讀:clearedUpTo 是「頁 index(0-based)」,非題數
RESET_PROGRESS { }                          // 清進度回首頁
REQUEST_READY  { }                          // 要求重發 game:ready(補 listener 漏接)
REQUEST_STATE  { }                          // 拉取:重發 ready + PROGRESS_UPDATE +(已完成則)TASK_COMPLETED
SET_ZHUYIN / SET_THEME                      // no-op(SET_ZHUYIN 由 courseware-runtime.js 處理)
```

### 4.4 時序
```
載入 → game:ready ─▶ 平台   ◀─ SET_PAGE(續讀,可選)
翻頁 → PROGRESS_UPDATE(每次)▶
作答 → ANSWER / SECTION_CLEARED ▶
完成 → TASK_COMPLETED ▶
```

### 4.5 平台端整合範例
```js
window.addEventListener('message', (e) => {
  if (!e.data || e.data.source !== 'eduTemplate') return;
  const { type, data } = e.data;
  switch (type) {
    case 'game:ready':      initProgress(data.totalQuestions);
                            // 有存檔則:iframe.contentWindow.postMessage({type:'SET_PAGE',data:{page,clearedUpTo},source:'eduPlatform'},'*');
                            break;
    case 'PROGRESS_UPDATE': saveLocation(data.page, data.section, data.percent); break;  // 🔴 監控在第幾頁/哪一關
    case 'ANSWER':          logAnswer(data); break;
    case 'SECTION_CLEARED': updateCleared(data.clearedQuestions); break;
    case 'TASK_COMPLETED':  grantRewards(data.suggestedRewards); markDone(data.achievedScore); break;
  }
});
```

### 4.6 注意事項
- game:ready 後才發下行;平台建議建 iframe 前先掛 listener。
- `page` = 絕對頁位(監控用);`percent`/`clearedQuestions` = 完成度。
- `TASK_COMPLETED` 正常一次;平台以 `taskId` 冪等去重。
- `questionId` 只在單一講義內唯一 → 用 (instanceId/taskId + questionId) 複合鍵。
- 🔴 `source` 字串**不是安全邊界**(可偽造、targetOrigin='*');需嚴謹則平台驗 `e.origin`、模板改指定明確 targetOrigin。
- `timestamp` 為模板本機時間;權威時間用 `completedAt`(ISO)或平台時鐘。

### 4.7 擴充性與連接穩定性(v18)
- **擴充**:game:ready 帶 `protocolVersion`/`capabilities`;新欄位一律放 `data`、不動 envelope 頂層;`type` 命名(生命週期 `x:y`、領域 `UPPER_SNAKE`)。
- **穩定(平台主動拉取補漏)**:漏接 ready → `REQUEST_READY`;疑漏進度/完成 → `REQUEST_STATE`。抗斷:PROGRESS_UPDATE 絕對頁位、SECTION_CLEARED 累計數皆與順序無關 + 本地 EduStorage 存檔。

### 4.8 頁式 / tab 式**通用**(關鍵觀念)
`page` 是「**抽象位置索引**」,不限捲動頁:

| 模板型態 | `page` 對應 | `section` | `pageType` |
|---|---|---|---|
| 頁式(捲動/輪播,如雜誌風) | 頁 index | 關卡標題 | cover/lesson/cardpage |
| **tab 型(只分 tab)** | **tab index** | tab 標題 | `"tab"` |

→ tab 型模板要「知道在哪一關」,就是**切 tab 時把 tab index 當 `page` 發 PROGRESS_UPDATE**,平台端讀法完全一樣。**已在 `附件B` 用平台既有 tab 模板實作並雙引擎實測通過**(切 tab → page:0→1 + section 正確)。

---

## 5. 本地存檔（localStorage)重點
- 續讀輔助(平台 `SET_PAGE` 為權威);只存輕量進度。
- 🔴 唯一 key:`edu_<instanceId|taskId|default>_<handoutId>_progress`;`handoutId` 優先 `window.HANDOUT_ID`,否則由 `COURSE_DATA`(meta.unitTitle|首概念|概念數|題數)雜湊 → **相似講義不互吃進度**。
- 清除:完成後 / `RESET_PROGRESS` 自動清;存取全 try/catch(無痕/滿/停用靜默降級)。
- 生成注意:`meta.unitTitle` 要有值可區別(或注入 `window.HANDOUT_ID`);嵌入 URL 帶 `instanceId`。

---

## 6. 規範 ↔ 引擎 v18 驗證(全部 ✅,已逐條對照原始碼 + 雙引擎實測)

| 事件/指令 | 驗證 | | 事件/指令 | 驗證 |
|---|:--:|---|---|:--:|
| 封裝 envelope | ✅ | | SET_PAGE | ✅ |
| game:ready(含 version/caps) | ✅ | | RESET_PROGRESS | ✅ |
| PROGRESS_UPDATE | ✅ | | REQUEST_READY | ✅ |
| ANSWER | ✅ | | REQUEST_STATE | ✅ |
| SECTION_CLEARED | ✅ | | SET_ZHUYIN/THEME/未知 | ✅ 忽略 |
| TASK_COMPLETED | ✅ | | 單次作答無重複 | ✅ |

實測(Chromium + WebKit/Safari + Firefox):載入恰 1 次 game:ready、單次作答 ANSWER/SECTION_CLEARED 各 1、TASK_COMPLETED 一次且可拉取重送、壞 source/未知 type 忽略、tab 型改造切關正確。

---

## 7. 附件與已完成
- **附件A** `附件A_頁式引擎_參考實作_v18.html` — 完整參考實作(postMessage / EduStorage 原始碼)。
- **附件B** `附件B_tab型模板_監控改造範例.html` — 既有 tab 模板改成可監控的實例(已實測)。
- 詳細規範(如需逐欄位):`通訊規範.md`、`本地存檔與生成規範.md`。
- 模板端已完成:v18 全 6987 份 production + 生產包引擎已套用;跳頂/RWD/觸控/桌機滾輪 + 協定 三引擎實測通過。

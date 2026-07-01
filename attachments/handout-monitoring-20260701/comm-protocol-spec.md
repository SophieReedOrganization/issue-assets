# 講義 ↔ 平台 通訊規範(postMessage)

> 對象:嵌在平台 iframe 內的互動講義模板(雜誌風引擎)。
> 來源:`雜誌風_舊結構/index.html`,2026-06-16 從程式碼抽出,與實際行為一致。
> 完整參考實作(v18,含觸控/RWD/協定強化)附於 `附件A_頁式引擎_參考實作_v18.html`。

---

## 1. 封裝格式

**所有訊息都是一個物件,透過 `postMessage` 傳遞。**

### 上行(模板 → 平台)
```js
window.parent.postMessage({
  type: '<事件名>',
  data: { ... },            // 事件內容(key 是 data,不是 payload)
  source: 'eduTemplate',    // 固定;平台用此過濾
  timestamp: 1718500000000  // Date.now()
}, '*');
```

### 下行(平台 → 模板)
```js
iframe.contentWindow.postMessage({
  type: '<指令名>',
  data: { ... },
  source: 'eduPlatform'     // 固定;模板只處理此來源
}, '*');
```

> 模板會忽略 `source !== 'eduPlatform'` 的下行訊息;平台應忽略 `source !== 'eduTemplate'` 的上行訊息。未知 `type` 雙方都向下相容忽略。

---

## 2. 上行事件(模板主動發 5 種)

### 2.1 `game:ready` — 載入完成
引擎建好所有頁面、**掛好 listener 後**發一次。平台收到後才可發下行指令。
可經下行 `REQUEST_READY` 要求重發(見 §3.4,防平台漏接)。
```js
data: {
  totalPages: 40, totalQuestions: 24,
  protocolVersion: "1.1",     // 協定版本(擴充性:平台據此判斷相容)
  engineVersion: "v18",       // 引擎版本
  capabilities: [             // 本模板支援的事件/指令(平台可據此調整)
    "game:ready","PROGRESS_UPDATE","ANSWER","SECTION_CLEARED","TASK_COMPLETED",
    "SET_PAGE","RESET_PROGRESS","REQUEST_READY","REQUEST_STATE","SET_ZHUYIN","SET_THEME"
  ],
  timestamp: 1718500000000
}
```

### 2.2 `PROGRESS_UPDATE` — 每次切頁(含當前頁位置)
**觸發點**:點「上一頁」(prevBtn)、「下一頁」(nextBtn)、左右滑動翻頁(drag)、初次載入。
即每次頁面位置改變都送一次,回報**絕對位置 `page`**(非相對動作 / 非累加),平台可即時更新進度條、儲存續讀點。
```js
data: {
  page: 7,                  // 🔴 抽象位置索引(0-based,單調即可):頁式=頁index / tab=tab index / 影片=時間段…
  totalPages: 40,
  percent: 35,              // 完成度 0-100(以過關題數為主,無題則以頁數)
  section: "關卡 2:複雜情境", // 人類可讀標籤(顯示用)
  pageType: "cardpage",     // 位置單位「自由字串」:cover/divider/lesson/cardpage/tab/video/section/step…;平台只顯示、不 switch 型別
  clearedQuestions: 6,
  totalQuestions: 24
  // detail: { … }          //(選配)逃生口:模板專屬資訊,平台預設忽略、不必理解
}
```

### 2.3 `ANSWER` — 每次作答(對錯都送)
```js
data: {
  questionId: "q3",
  type: "mcq",              // mcq | sort | slider
  correct: true,
  timeMs: 4200,             // 本次作答耗時
  attempt: 1                // 第幾次嘗試(可重做)
}
```

### 2.4 `SECTION_CLEARED` — 某題過關
該互動題答對、解鎖下一頁時發。
```js
data: {
  questionId: "q3",
  firstTry: true,           // 是否一次答對
  clearedQuestions: 7,
  totalQuestions: 24
}
```

### 2.5 `TASK_COMPLETED` — 全部完成
**觸發**:全部過關後,學生在「完成宣告頁」按「🎓 完成學習」才發(學生主動宣告);或平台呼叫 `window.sendTaskComplete()` 強制完成。**不是**過完最後一關就自動發。
一次任務只主動發一次;若平台漏接,可用下行 `REQUEST_STATE` 拉回(見 §3.5)。
```js
data: {
  achievedScore: 0.92,      // 0-1;🔴「一次答對率」= 一次就答對的題數 / 總題數(重試後才過的不計入),非「答對比例」
  completedAt: "2026-06-16T09:30:00.000Z",
  performance: {
    totalQuestions: 24, correctAnswers: 22, accuracy: 0.92,   // correctAnswers/accuracy 同為「一次答對」口徑
    maxCombo: 9, guessingCount: 0, totalTimeMs: 540000
  },
  suggestedRewards: {        // 建議獎勵(平台可採用或自訂)
    xp: 25,                  // ≤25
    coins: 10,               // ≤10
    badges: ["accuracy_high", "no_guess"]  // accuracy_high=正確率≥80%;no_guess=零亂猜
  },
  sessionLog: [ { event, ts, data }, ... ]  // 完整事件流水(answer/page:view/task:complete)
}
```

---

## 3. 下行指令(平台發給模板)

### 3.1 `SET_PAGE` — 續讀(還原進度 + 跳頁)
```js
data: {
  page: 7,                  // 跳到的頁 index(0-based,同 PROGRESS_UPDATE.page)
  clearedUpTo: 6            // 🔴 已過關到第幾頁的「頁 index(0-based)」,非題數;引擎把 index≤此值的互動頁全標為已過關
}
```

### 3.2 `RESET_PROGRESS` — 重置
清空闖關紀錄並回到首頁。`data` 可空。

### 3.3 `SET_ZHUYIN` / `SET_THEME` — 目前 no-op
此引擎無注音字型/深色主題,收到不報錯、不動作(保留向下相容,日後可實作)。
> 註:`SET_ZHUYIN`(注音開關/破音字)實際由 head 的官方 `courseware-runtime.js` 處理。

### 3.4 `REQUEST_READY` — 要求重發 game:ready(連接穩定性)
平台若可能漏接首個 `game:ready`(listener 晚掛、iframe 先載入),可主動發此指令,模板收到即**重發 `game:ready`**。`data` 可空。
> `game:ready` 因此可能收到多次 —— 平台的 game:ready 處理**必須冪等**(重入不重複初始化/不重複發獎)。

### 3.5 `REQUEST_STATE` — 拉取目前狀態(補漏)
平台發此指令,模板會**重發**:`game:ready` + 一則目前的 `PROGRESS_UPDATE` +(若任務已完成)再發一次 `TASK_COMPLETED`。用於平台偵測到漏接關鍵事件時主動補齊。`data` 可空。
> 設計取捨:模板**不做未經請求的自動重送**(否則現行未去重的平台會重複發獎);恢復一律走平台**主動拉取**,對舊平台零影響。

---

## 4. 典型時序

```
模板載入
  └─ game:ready ─────────────────────────────▶ 平台
                  ◀──── SET_PAGE(續讀,可選)──── 平台
學生翻頁
  └─ PROGRESS_UPDATE(每次切頁)──────────────▶ 平台
學生作答
  └─ ANSWER(每次)───────────────────────────▶ 平台
  └─ SECTION_CLEARED(答對過關)──────────────▶ 平台
全部過關
  └─ TASK_COMPLETED ─────────────────────────▶ 平台
```

---

## 5. 平台端整合範例

```js
window.addEventListener('message', (e) => {
  if (!e.data || e.data.source !== 'eduTemplate') return;   // 只收模板
  const { type, data } = e.data;
  switch (type) {
    case 'game:ready':       initProgressBar(data.totalQuestions);
                             // 續讀:restorePage 後發 SET_PAGE
                             iframe.contentWindow.postMessage(
                               { type:'SET_PAGE', data:{ page:saved.page, clearedUpTo:saved.clearedUpTo }, source:'eduPlatform' }, '*');
                             break;
    case 'PROGRESS_UPDATE':  saveProgress(data.page, data.percent); break;
    case 'ANSWER':           logAnswer(data); break;
    case 'SECTION_CLEARED':  updateClearedCount(data.clearedQuestions); break;
    case 'TASK_COMPLETED':   grantRewards(data.suggestedRewards); markDone(data.achievedScore); break;
  }
});
```

---

## 6. 注意事項

- **必等 `game:ready` 後**才發下行指令。模板已改為「先掛 listener 再發 game:ready」,並支援 `REQUEST_READY` 重發;平台仍建議**在建立 iframe 前**就掛好 listener。
- `PROGRESS_UPDATE` 回報**絕對頁位**,平台據此做進度/續讀,不要靠累加。
- **要監控「學生在第幾頁」用 `page`(絕對頁 index)**;`percent`/`clearedQuestions` 是「完成度(過關題數)」,不是閱讀位置。
- 正常情況一個任務只主動發**一次** `TASK_COMPLETED`;平台若漏接可用 `REQUEST_STATE` 拉回。平台仍應以 (taskId) **冪等去重**(iframe reload 可能再次 game:ready/完成)。
- `questionId` 只在單一講義內唯一、跨講義可能重複;平台記錄作答請用 **(instanceId/taskId + questionId) 複合鍵**。
- 🔴 **`source` 字串不是安全邊界**:`eduTemplate`/`eduPlatform` 可被偽造,`targetOrigin` 用 `'*'`。若需嚴謹,平台驗 `e.origin`、模板改指定明確 targetOrigin。
- `timestamp` 為模板本機時間,平台若需權威時間以 `completedAt`(ISO)或自身時鐘為準。
- iframe 嵌入需允許 `postMessage`(同源或 `*`);模板用 `window.parent`。

---

## 7. 擴充性與連接穩定性(v18 起)

### 7.1 擴充性
- **版本協商**:`game:ready` 帶 `protocolVersion` / `engineVersion`,平台可據此分支相容行為。
- **能力宣告**:`game:ready.capabilities` 列出本模板支援的事件/指令,平台可據此調整監控 UI;新模板加事件不會讓舊平台誤判。
- **向下相容守則(重要)**:未知 `type` 雙方忽略;**新增欄位一律放進 `data`**(消費端挑欄位,天然相容),**不要改動 envelope 頂層**(type/data/source/timestamp);`type` 命名維持慣例(生命週期 `xxx:yyy`、領域事件 `UPPER_SNAKE`)。

### 7.2 連接穩定性(補漏機制,皆為平台主動拉取)
| 情境 | 平台動作 | 模板回應 |
|------|----------|----------|
| 漏接 `game:ready`(listener 晚掛) | 發 `REQUEST_READY` | 重發 `game:ready` |
| 懷疑漏接進度/完成 | 發 `REQUEST_STATE` | 重發 `game:ready` + 目前 `PROGRESS_UPDATE` +(已完成則)`TASK_COMPLETED` |

- 模板**不做未經請求的自動重送**——避免現行未去重平台重複發獎;恢復一律平台拉取,對舊平台零影響。
- 抗斷設計:`PROGRESS_UPDATE`(絕對頁位)、`SECTION_CLEARED`(累計 clearedQuestions)皆與順序無關;加上本地 `EduStorage` 存檔,斷線/重開學生端不掉進度。
- 建議平台:①建 iframe 前先掛 listener;② game:ready/完成處理**冪等**;③關鍵事件(完成)若一段時間內沒收到,主動 `REQUEST_STATE` 補齊。

### 7.3 設計原則:如何涵蓋「各式各樣」的模板(不窮舉型別)
> 刻意**不在規範裡列舉模板型別**——窮舉會讓規範肥大、模板更難合規(合規率低→fallback 多)、資料語意失真、平台被迫 `switch(型別)` 而脆弱。改用三原則,覆蓋最廣且最不易壞:

1. **小而穩的通用詞彙**:僅 5 個上行事件;位置一律抽象成 `page`(索引)+`section`(標籤)+`percent`(完成度)+`pageType`(自由字串單位)。頁式/tab/影片/閱讀/模擬皆可表達,平台**一種讀法**。
2. **能力驅動,非型別驅動**:平台依 `capabilities`(送了什麼)決定顯示,**不判斷模板型別**。新型別會送 `PROGRESS_UPDATE` 就自動被監控,零平台改動。
3. **預設 fallback**:看不懂就降級到「知道在哪一份」(見監控可行性文件 §1.5)。

- **最小合規** = 只要送 `game:ready` + `PROGRESS_UPDATE` 兩件事,位置即可被完整監控。門檻越低、合規率越高。
- **逃生口**:型別專屬資訊放 `PROGRESS_UPDATE.data.detail`(選配),平台預設忽略。
- **設計非目標**:不為特定型別加專屬事件/欄位;一致性靠參考實作(附件 A 頁式 / 附件 B tab)當範本。

---

## 8. 改造既有模板回報位置(頁式 / tab 式通用)

### 8.1 觀念:`page` 是「抽象位置索引」,不限捲動頁
監控「學生在哪」只需要**一個單調的位置索引 + 該位置標題**。不同模板對應不同單位,平台端讀法完全一樣:

| 模板型態 | `page` 對應 | `section` 對應 | `pageType` |
|---|---|---|---|
| 雜誌風(捲動頁 / 輪播) | 頁 index | 關卡標題 | cover / lesson / cardpage |
| **tab 闖關型**(如平台上「只分 tab 沒分頁」那種) | **目前 tab 的 index** | **tab 標題** | `"tab"` |

→ tab 型模板要「知道在哪一關」,就是**切 tab 時把 tab index 當 `page` 發出來**。平台不需分辨模板型態。

### 8.2 tab 型最小改法(此類模板通常已有 `postToParent` + `TASK_COMPLETED`,只缺位置回報)
只要補兩處:

**(a) 載入、tabs 建好後發 `game:ready`**
```js
var TABS = CD.tabs || [];
window.postToParent('game:ready', {
  totalPages: TABS.length, totalQuestions: totalQ,
  protocolVersion:'1.1', engineVersion:'tab-tpl',
  capabilities:['game:ready','PROGRESS_UPDATE','TASK_COMPLETED'],
  timestamp: Date.now()
});
reportTab(0);   // 初次進場也回報一次
```

**(b) 每次切 tab 發 `PROGRESS_UPDATE`**(放進 tab 按鈕 click / `showTab` / `unlockNext` 內,設好 active 之後)
```js
function reportTab(idx){
  var cleared = countClearedTabs();     // 依 state 算已過關 tab 數
  window.postToParent('PROGRESS_UPDATE', {
    page: idx,                          // 🔴 目前 tab index = 位置
    totalPages: TABS.length,
    section: (TABS[idx]||{}).title,     // tab 標題(哪一關)
    pageType: 'tab',
    percent: Math.round(cleared/(TABS.length||1)*100),
    clearedQuestions: cleared, totalQuestions: totalQ
  });
}
// 例:tab 按鈕 click handler 內,btn.classList.add('active') 之後:
//   reportTab(+btn.dataset.tabidx);
```

**(選配)** 每題作答發 `ANSWER`、每關解鎖(`unlockNext`)發 `SECTION_CLEARED`,欄位同 §2.3 / §2.4。

### 8.3 注意
- `page` 只要**在該模板內單調且穩定**即可(tab index 天然符合);跨講義仍靠 (instanceId/taskId) 區分。
- tab 內即使還會捲動,`page` 仍用 **tab index**(平台要的是「第幾關」,不是像素捲動位置)。
- 完成沿用既有 `finishLearning()` → `sendTaskComplete()`;要補漏可加 §3.4 / §3.5 的 `REQUEST_READY` / `REQUEST_STATE`。

---

> **本地存檔(localStorage 唯一性 / 清除)與生成 HTML 注意事項** 見另一份:[`本地存檔與生成規範.md`](本地存檔與生成規範.md)。

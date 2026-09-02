# 結論

這張單抓到真問題，但目前草稿有三個根本缺陷：

1. 把「字型預設與簡編本詞目不一致」寫成「產品實際錯讀率 6.9%」——證據不支持。
2. 把 DOM、iframe、VTT、PDF、歷史教材混成同一顯示面——它們不是同一條技術路徑。
3. 想用 2,601 條 regex＋IVS 一次解完——這會把既有兩條特例機制硬撐成語言處理系統，結構上不可靠。

問題不是單純「補詞表」，而是平台沒有明確的注音權威來源、詞義消歧政策與各輸出面的共同契約。P4 也偏低：若實際教材命中率高，這是 P2；未做語料抽樣前至少應列 P3，不是「有空再改」的建議事項。

## 逐條複驗

### C1　🔶 大致正確，但「整站」說過頭

成立部分：

- [useZhuyinFont.ts](/Users/jc/Claude/github/codebase/frontend/monorepo/apps/student/src/hooks/useZhuyinFont.ts:5) 定義 `grade <= 4`，且必須已登入。
- [ZhuyinFontProvider.tsx](/Users/jc/Claude/github/codebase/frontend/monorepo/apps/student/src/components/providers/ZhuyinFontProvider.tsx:18) 對 `body` 加 `font-zhuyin`。
- [globals.css](/Users/jc/Claude/github/codebase/frontend/monorepo/apps/student/src/styles/globals.css:8) 載入 `/fonts/BpmfZihiKaiStd-Regular.ttf`。
- 同檔 `video::cue` 確實指定該字型。
- [zhuyin.ts](/Users/jc/Claude/github/codebase/frontend/monorepo/apps/student/src/courseware/features/zhuyin.ts:16) 對 iframe 注入同一字型。

限制：

- code、pre、KaTeX、數學、輸入框、contenteditable、`.zhuyin-off` 明確排除。
- iframe 只涵蓋包含新版 runtime、會送 `game:ready` 的教材；[useIframeZhuyin.ts](/Users/jc/Claude/github/codebase/frontend/monorepo/apps/student/src/hooks/useIframeZhuyin.ts:7) 明說舊模板不回應。
- PDF canvas、圖片內文字、影片內嵌字幕都不吃 body 字型。

所以應改成：「學生主 document 的一般 DOM 文字，以及支援新版 runtime 的 iframe，主要靠該字型顯示注音。」

### C2　✅，但「全站」仍要限定

[zhuyin-core.ts](/Users/jc/Claude/github/codebase/frontend/monorepo/apps/student/src/courseware/zhuyin-core.ts:18) 確實只有：

- 奇數
- 奇偶

兩者都在「奇」後插 U+E01E1。

[useZhuyinPolyphonic.ts](/Users/jc/Claude/github/codebase/frontend/monorepo/apps/student/src/hooks/useZhuyinPolyphonic.ts:23) 會：

- 初次走訪 `document.body`
- 掛 `MutationObserver`
- 處理新節點與文字變更

但它只逐一處理單個 text node，到不了 iframe 和 VTT，也無法匹配被 React 元素切成多個節點的詞。

### C3　❌，「唯一來源」不成立

前半段成立：

- [pdf_analysis/prompts.py](/Users/jc/Claude/github/codebase/backend/baania-core/src/baania_core/application/pdf_analysis/prompts.py:32) 明確要求只存漢字、不逐字存注音。
- [comic/quiz.py](/Users/jc/Claude/github/codebase/backend/baania-core/src/baania_core/application/comic/quiz.py:18) 說題目只存純文字。
- [bopomofo_converter.py](/Users/jc/Claude/github/codebase/backend/baania-core/src/baania_core/infrastructure/media/bopomofo_converter.py:25) 是 pass-through stub。

但「全平台唯一來源」錯了：

- legacy atlas 的 [bopomofo_converter.py](/Users/jc/Claude/github/codebase/backend/edutech-atlas/edutech-atlas-api/app/routes/html_generator/bopomofo_converter.py:17) 仍有萌典查詢實作，且直接取 `heteronyms[0]`。
- [generation_pipeline.py](/Users/jc/Claude/github/codebase/backend/edutech-atlas/edutech-atlas-api/app/routes/html_generator/generation_pipeline.py:110) 在模板啟用時會執行它。
- 舊 companion／solving prompts 曾直接要求 `<ruby>`。
- 現行 cortex 才在 [prompts.py](/Users/jc/Claude/github/codebase/ai/baania-cortex/src/baania_cortex/api/v1/companion/prompts.py:279) 明確禁止 ruby，改由前端字型處理。
- PDF、圖片、音訊、烘焙字幕也不是這條來源。

正確說法是：「現行 student app 一般 DOM 純漢字的主要注音路徑，是字型預設＋IVS 修正。」

### C4　🔶 樣本與索引機制成立，但不能宣稱整份表等於 shipped font

我重新下載 ButTaiwan/bpmfvs 的 raw `phonic_table_Z.txt`，與 scratchpad 檔案 SHA-256 完全相同：

`1c40e5a96629e14b8ffdfb1f201c5a6c41f0b7b3e1595617c3fd299e8658baeb`

repo 與 `prod_font.ttf` 也完全相同：

`b5de180c456840edc57d07256d7d167a95306c81ab1936677c4706491a9e7d37`

字型 metadata：

- `Bpmf Zihi KaiStd Regular`
- `ㄅ字嗨注音標楷`
- `Version 1.501`

fontTools 的 cmap format 14 確認：

- 奇：E01E0 → ss00、E01E1 → ss01
- 興：E01E0 → ss00、E01E1 → ss01
- 椰、血只有 E01E0
- 子有 E01E0、E01E1

對這次 2,601 條所需的讀音，我另外檢查 selector mapping，沒有發現「表裡有、字型實際沒 mapping」的案例。

但：

- `phonic_table_Z.txt` 有 18,636 個字條目，shipped font 的 best cmap 只有 15,604 code points，不能無條件說整份表就是字型完整讀音表。
- fontTools 證明的是 glyph/selector 對應，不是直接從 glyph 解出語音。
- 詞表生成必須綁定字型版本；換字型或新版字型不能假設索引仍相同。

### C5　✅

我重新看過 `font_render.png` 並查 Excel：

| 詞 | 簡編本 | 字型預設 | 判定 |
|---|---|---|---|
| 椰子 | ㄧㄝˊ ˙ㄗ | ㄧㄝˊ ㄗˇ | 子錯 |
| 血脈 | ㄒㄧㄝˇ ㄇㄞˋ | ㄒㄧㄝˇ ㄇㄞˋ | 正確 |
| 高興 | ㄍㄠ ㄒㄧㄥˋ | ㄍㄠ ㄒㄧㄥ | 興錯 |

「椰」顯示成一聲無法在這條字型路徑重現。

不能因此斷言使用者看錯；更合理的是保留另一內容面、舊快取、舊教材或來源內容的可能，另行取得原始頁面重現。

### C6　🔶 數字可重現，但解讀錯誤

實跑：

```text
words_checked: 38266
ok: 35626
mismatch_words: 2640
fixable: 2601
unfixable: 39
ambiguous_multi_reading: 4
skipped_len_mismatch: 41
skipped_not_in_font: 2
distinct_chars: 392
single_char_primary_mismatch: 151
```

因此原腳本輸出確實可重現。但 6.9% 只能稱為：

> 「簡編本中，可被腳本納入的純漢字多字詞，其任一基本讀音皆不等於字型逐字預設讀音的比例。」

不能稱為：

- 簡編本全量錯誤率
- 學生端實際錯讀率
- production 語料命中率
- 392 個破音字都一定需要相同修法

腳本有以下問題：

1. **主讀音排序錯誤**  
   `dict_reads[0]` 假設 Excel 原始順序就是 `多音排序`。102 個多 row 詞中至少 20 個不是，包括便當、便宜、肚子、相稱、所長、一行、完了。  
   會讓「肚子」「相稱」的修正目標選錯；正確排序後 distinct chars 也從 392 變成 391。

2. **ANY reading 會掩蓋主讀音錯誤**  
   只要吻合任一次讀音就算 OK。按 `多音排序` 主讀音計算是 2,669 筆 mismatch；其中 29 筆被 ANY-reading 邏輯吞掉，例如便當、便宜、妻子、睡覺、意思、完了。

3. **忽略 `變體注音`**  
   只讀 `注音一式`，因此不是實際語流或課本標音 audit。

4. **漏掉單字詞**  
   6,028 個單字詞未納入 2,640；另有 151 個單字主讀音與字型預設不同。

5. **不是 45,130 條全量**  
   非純漢字、單字、音節數不符、字型缺字都被排除。

6. **原腳本只驗 base cmap**  
   沒驗目標 IVS selector 是否真的存在。這次獨立補驗後 2,601 筆沒有發現缺 mapping，但腳本仍應修正。

#### 抽查前 10 筆

前 10 筆全部確實符合「Excel 基本注音 ≠ 字型預設」：

| # | 詞目 | 主要差異 |
|---:|---|---|
| 1 | 八家將 | 將：ㄐㄧㄤ → ㄐㄧㄤˋ |
| 2 | 巴不得 | 得：ㄉㄜˊ → ˙ㄉㄜ |
| 3 | 吧檯 | 吧：˙ㄅㄚ → ㄅㄚ |
| 4 | 拔刀相助 | 相：ㄒㄧㄤˋ → ㄒㄧㄤ |
| 5 | 靶子 | 子：ㄗˇ → ˙ㄗ |
| 6 | 爸爸 | 第二個爸：ㄅㄚˋ → ˙ㄅㄚ |
| 7 | 般若 | 般、若皆錯 |
| 8 | 剝削 | 削：ㄒㄧㄠ → ㄒㄩㄝˋ |
| 9 | 伯伯 | 第二個伯：ㄅㄛˊ → ˙ㄅㄛ |
| 10 | 脖子 | 子：ㄗˇ → ˙ㄗ |

所以資料不是造假；問題是把這個離線差異統計過度包裝成產品錯誤率。

### C7　❌，對「變」類的概括錯誤

實際資料：

- `變` rows：831
- 含「一／不」：735
- 不含「一／不」：96
- 一／不出現位置：767，基本讀音確實全部吻合字型預設
- 但有 78 個 `變` row 的其他字，其基本讀音仍與字型預設不同

`變` 不只是一／不變調，還包括：

- 輕聲
- 兒化
- 重疊詞變調
- 葡萄、耳朵、狐狸、窗戶等其他語流形式

因此：

- 「一／不本身在基本讀音欄吻合」成立。
- 「831 條都是一／不，且比對上一致」不成立。
- 本調、表面調、輕聲與兒化必須拆成 pronunciation policy，不能塞成一個不擋開工的備註。

### C8　✅，而且風險比草稿寫得嚴重

已有風險全部成立：

- regex 順序與最長匹配
- 重疊詞
- 同字串多義：東西、便宜、所長、一行
- 跨 DOM text node 無法匹配

另有更嚴重的問題：

- 2,600 條 regex 對每個 text node 逐條跑，複雜度接近 `nodes × rules`。
- streaming 文字會以半個詞、半句逐步 mutation，匹配結果可能依到達時序不同。
- 插入 IVS 是實際改寫 DOM 文字，不只是視覺效果。
- `stripZhuyinSelectors` 除測試外沒有 production caller。
- copy/paste、搜尋、selection、`textContent`、telemetry、AI context 都可能帶入 IVS。
- iframe 的 click/context extractor 會讀改寫後的 `textContent`，可能把 IVS 傳給學伴或拿去做 section matching。
- 關閉注音只移除 class 和 observer，沒有移除已插入的 selector。
- React reconciliation 可能覆蓋或重新插碼。
- `POLYPHONIC_CHARS` 需人工與詞表同步；漏更新會靜默失效。
- VTT cue 根本不經這個 fixer。
- 字型升版會讓 IVS index 與資料版本耦合。

「最長匹配」也只解決 token overlap，解不了同形異義。便宜、東西、所長這類仍需要內容 metadata 或語意消歧政策。

## 決策層

### 診斷層級

正確診斷不是「字型壞掉」，也不是單純「缺 2,601 條例外」。

真正問題是：

> 平台把逐字預設字音當成詞句注音，卻沒有正式的詞彙消歧層、注音權威排序、表面變調政策與跨輸出面契約。

詞表只能是其中一個資料來源，不能等同完整解法。

### 現在的範圍會製造新不一致

若只修 2,601 條：

- 簡編本有收的詞正確，沒收的課本詞仍錯。
- 多義詞被固定成某一讀音，另一個語境反而被改錯。
- 主 DOM 正確、VTT 仍錯。
- 新 iframe 正確、舊 iframe 不變。
- 畫面正確、PDF/列印仍不同。
- 2,601 條可修、39 條缺 glyph 永久不一致。
- 本調、變調、輕聲、兒化混用。

這不是「先修大部分」而已；若沒有明示政策，它會形成無法解釋的產品規則。

### P4 不合理

錯誤注音是低年級核心識字輔助提供錯誤資訊，不是純視覺瑕疵或改善建議。

建議：

- production 高頻教材抽樣顯示廣泛命中：P2
- 命中集中於少數低頻詞：P3
- 不到 P0/P1，因為系統仍可使用，也沒有資料或安全事故
- 若業務只是決定延後做，應另用 roadmap priority 表示，不應把 severity 降成 P4

### 簡編本不能是唯一基準

建議權威順序：

1. 指定教材已審定的標音：該教材內最高優先。
2. 教育部一字多音審訂表／課綱相關規範。
3. 簡編本：通用詞彙 lexicon。
4. 人工維護的領域詞、人名、地名與 context override。

簡編本是詞典，不是全文斷詞器，也不是所有課本語流標音規格。`多音排序` 更不代表任一語境的唯一正解。

## 程式結構層

不應直接把 CSV 機械轉成 2,601 條 regex。

比較合理的結構是：

- 版本化 pronunciation corpus，保存來源、詞義、讀音、優先級、字型版本。
- trie／Aho–Corasick 或 tokenizer 做一次掃描與 longest-match。
- 明確定義同形多義詞的策略：不改、依內容 metadata、人工 override，或語意模型。
- 產出 adapter 分流：
  - DOM → IVS
  - 新 iframe → runtime
  - VTT → 預處理 cue 或自訂字幕 layer
  - PDF/Word → 專用 renderer
- 39 條缺音走字型資產升級，不是假裝詞表能修。
- 在 copy、serialization、搜尋、AI context 邊界統一 strip IVS。
- 加 corpus regression、瀏覽器/font shaping、效能及 accessibility 測試。

## 漏掉的顯示面

- **AI 學伴聊天**：現行回覆是普通 DOM，會吃主字型與 MutationObserver；不是另一套 LLM 自寫注音。舊 atlas prompt 才是另一來源。
- **VTT**：只套字型，不會插 IVS，破音字仍用預設音。
- **舊 iframe**：沒有新版 runtime 就不會收到修正。
- **PDF 教材**：[PdfTaskViewer](/Users/jc/Claude/github/codebase/frontend/monorepo/apps/student/src/components/content/PdfTaskViewer.tsx:19) 是 PDF.js canvas，DOM 修法無效。
- **學生錯題卷列印**：[wrong-questions-pdf.ts](/Users/jc/Claude/github/codebase/frontend/monorepo/apps/student/src/lib/wrong-questions-pdf.ts:138) 建獨立 document，使用 PingFang/Noto Sans，不繼承學生端注音。
- **機構端 PDF/Word**：#1603 仍 OPEN，而且明確排除學生畫面與破音字正確性。
- 圖片文字、漫畫氣泡、影片內嵌字幕、音訊/TTS。
- copy/paste、搜尋、螢幕閱讀器、AI context、analytics 的 IVS 污染。
- font load 失敗與 fallback 行為。
- Chrome、Safari、iPad、PDF renderer 對 cmap14/IVS shaping 的相容性。
- 字型與簡編本資料的版本、授權及更新治理。

## 建議的正確拆法

### 1. 注音規範／決策母單

先拍板：

- 權威來源排序
- 本調或表面調
- 輕聲、兒化、一／不變調
- 多義詞策略
- 哪些顯示面承諾一致
- audit 的正式分母與 production 語料命中率

### 2. Student DOM＋新版 iframe 核心修正

範圍只承諾：

- 主 student DOM
- 支援新版 runtime 的 iframe
- 已決策的無歧義詞彙
- 共用版本化 corpus 與 matching engine
- IVS 不得洩漏到 copy/search/context
- 明確效能預算

這張才是現有 #1795 應改寫成的核心實作單。

### 3. VTT 字幕

WebVTT 不是 DOM text node，必須獨立設計 cue preprocessing 或自訂字幕 layer。

### 4. 字型缺音資產

處理 39 條缺讀音及字型升版相容性。責任與 lexical matching 不同，應另開。

### 5. PDF／Word

沿用 #1603；學生錯題卷與 org-admin PDF/Word 也未必是同一 renderer，必要時再拆子單。

### 6. Legacy／烘焙內容清理

盤點舊 HTML ruby、萌典轉換資料、圖片/影片內嵌文字。這些不能靠前端 IVS 補救。

最後一句直接裁定：**不要用「2,601 條詞表全站修好」當驗收。先修 audit 與產品規範，再做 DOM 核心；否則這張單會修出一個更難追蹤、跨顯示面更不一致的注音系統。**

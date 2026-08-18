# 老師端三面板位移量測報告

本報告只量化「事件前後誰移動、移動多少、同一座標換成誰」，不判定產品行為是否為 bug。

## 測試與判讀規則

- 受測動作全部走真實 UI：老師與學生皆從課堂卡進教室並完成裝置檢查；舉手由學生畫面點擊舉手控制；離場由學生畫面開啟選單、點擊離開並確認。API 只用於前置環境準備（建立 room/course/session、報名、切換 active org），沒有用 API 回應取代任何受測事件。
- 每個正式事件都有老師端 before/after 截圖與 DOM 座標快照。after 快照是在 UI 動作完成後等待 2.6–4.5 秒、且指定畫面狀態已出現後取得，因此本文量測的是 **settled 最終版面位移**；`0 px` 不代表動畫期間絕無瞬時位移。
- 任何疑似異常都必須有反向測試才能升級成問題。本報告不做 bug、P1 或 P2 判定；下方以實際 UI 事件反向比對「會移動／不移動」的條件邊界。

## 測試環境

- 環境：prod
- 機構：`test`，org_id `019f9271-a783-7000-a613-19f1dc3f2671`
- 正式事件 run：2026-08-14 16:31:18–16:35:33（Asia/Taipei, UTC+8），runner `passed`
- Roster 補測：主要 A1–A5/B-G8A run 為 2026-08-14 17:25:16 起；B-G6B、B-G9A、C、D 以 actions-only run 沿用同一個 session 分段完成。分段是為隔離 RTC 斷線，不混用不同課堂資料。
- viewport：1280 × 800；座標為 `getBoundingClientRect()` 的 viewport 座標。影像格在內部捲動區下方時，`rectTop` 可能大於 800。
- 正式資源：room `019fff65-bb7f-70a6-8b94-45420b294409`、course `019fff65-bbef-79dd-ad85-f41e6ef75eb6`、session `019fff65-bd4d-7f68-88ac-8442123be539`
- Roster 補測資源：room `019fff97-28b2-7c2b-847f-ab724be163c9`、course `019fff97-297c-7a13-b17d-c9442b758cdb`、session `019fff97-2aac-7ff4-b974-3ba962e00ee0`
- 堂課：`面板排序量測 202608140831`，時段 2026-08-14 16:01:23–19:01:23（Asia/Taipei）
- 角色：`rd-teacher1`；`rd-g6a`、`rd-g6b`、`rd-g7a`、`rd-g8a`、`rd-g9a`；`rdtest-owner` 只用於 API 建置
- 未使用：`rd-g4a`、`rd-g5a`、`rd-teacher2`、`rd-manager`
- 原始資料：[snapshots.json](snapshots.json)、[analysis.json](analysis.json)、[setup.json](setup.json)、[displacement-matrix.tsv](displacement-matrix.tsv)、[summary.json](summary.json)、[run.log](run.log)
- Roster 補測資料：[roster-snapshots.json](roster-snapshots.json)、[roster-displacement-matrix.tsv](roster-displacement-matrix.tsv)、[roster-setup.json](roster-setup.json)

## 測量定義

每個面板、每個事件都以學生卡片的視覺順序產生 `index`，並記錄 `rectTop`、`rectLeft`、`width`、`height`、中心點。diff 包含：

- `indexChangedCount`：事件前後共同存在、且 index 改變的人數。
- `maxDisplacementPx`：共同存在學生的最大二維位移 `sqrt(dx²+dy²)`。
- `sameCoordinateChanges`：同一個 `rectTop + rectLeft` slot，事件前後由不同學生佔據。
- 新增/消失卡片另外記為 `added` / `removed`，不計入共同學生的 index change。

## 位移矩陣

Roster 欄位來自補測 UI run；進場 A 與 G8A 舉手共用同一個 run，其他事件沿用同一 session 分段續測。每一格均有自己的 before/after 快照，不以靜態排序規則補值。

| 事件 | 面板 | 幾人 index 改變 | 最大位移 px | 同一座標由誰變成誰 | 截圖 |
|---|---|---:|---:|---|---|
| G6A 進場 | Roster | 5 | 228.0 | G6A→G6B；G6B→G7A；G7A→G8A；G8A→G9A；G9A→G6A | [前](roster-src0925-02-rd-teacher1-roster-A1-G6A-enter-before.png) / [後](roster-src0925-04-rd-teacher1-roster-A1-G6A-enter-after.png) |
| G6A 進場 | 監控牆 | 3 | 608.0 | G6B→G6A；G7A→G6B；G6A→G7A | [前](02-rd-teacher1-A1-G6A-enter-before.png) / [後](03-rd-teacher1-A1-G6A-enter-after.png) |
| G6A 進場 | 影像格 | 0（新增 G6A） | 0 | 無 | [前](02-rd-teacher1-A1-G6A-enter-before.png) / [後](03-rd-teacher1-A1-G6A-enter-after.png) |
| G6B 進場 | Roster | 4 | 171.0 | G6B→G7A；G7A→G8A；G8A→G9A；G9A→G6B | [前](roster-src0925-05-rd-teacher1-roster-A2-G6B-enter-before.png) / [後](roster-src0925-07-rd-teacher1-roster-A2-G6B-enter-after.png) |
| G6B 進場 | 監控牆 | 2 | 304.0 | G6A→G6B；G6B→G6A | [前](04-rd-teacher1-A2-G6B-enter-before.png) / [後](05-rd-teacher1-A2-G6B-enter-after.png) |
| G6B 進場 | 影像格 | 0（新增 G6B） | 0 | 無 | [前](04-rd-teacher1-A2-G6B-enter-before.png) / [後](05-rd-teacher1-A2-G6B-enter-after.png) |
| G7A 進場 | Roster | 3 | 114.0 | G7A→G8A；G8A→G9A；G9A→G7A | [前](roster-src0925-08-rd-teacher1-roster-A3-G7A-enter-before.png) / [後](roster-src0925-10-rd-teacher1-roster-A3-G7A-enter-after.png) |
| G7A 進場 | 監控牆 | 2 | 304.0 | G6A→G7A；G7A→G6A | [前](06-rd-teacher1-A3-G7A-enter-before.png) / [後](07-rd-teacher1-A3-G7A-enter-after.png) |
| G7A 進場 | 影像格 | 0（新增 G7A） | 0 | 無 | [前](06-rd-teacher1-A3-G7A-enter-before.png) / [後](07-rd-teacher1-A3-G7A-enter-after.png) |
| G8A 進場 | Roster | 2 | 57.0 | G8A→G9A；G9A→G8A | [前](roster-src0925-11-rd-teacher1-roster-A4-G8A-enter-before.png) / [後](roster-src0925-13-rd-teacher1-roster-A4-G8A-enter-after.png) |
| G8A 進場 | 監控牆 | 0 | 0 | 無 | [前](08-rd-teacher1-A4-G8A-enter-before.png) / [後](09-rd-teacher1-A4-G8A-enter-after.png) |
| G8A 進場 | 影像格 | 0（新增 G8A） | 0 | 無 | [前](08-rd-teacher1-A4-G8A-enter-before.png) / [後](09-rd-teacher1-A4-G8A-enter-after.png) |
| G9A 進場 | Roster | 0 | 0 | 無 | [前](roster-src0925-14-rd-teacher1-roster-A5-G9A-enter-before.png) / [後](roster-src0925-16-rd-teacher1-roster-A5-G9A-enter-after.png) |
| G9A 進場 | 監控牆 | 0 | 0 | 無 | [前](10-rd-teacher1-A5-G9A-enter-before.png) / [後](11-rd-teacher1-A5-G9A-enter-after.png) |
| G9A 進場 | 影像格 | 0（新增 G9A） | 0 | 無 | [前](10-rd-teacher1-A5-G9A-enter-before.png) / [後](11-rd-teacher1-A5-G9A-enter-after.png) |
| G8A 舉手 | Roster | 0 | 0 | 無 | [前](roster-src0925-17-rd-teacher1-roster-B-G8A-raise-before.png) / [後](roster-src0925-18-rd-teacher1-roster-B-G8A-raise-after.png) |
| G8A 舉手 | 監控牆 | 4 | 625.1 | G6B→G8A；G7A→G6B；G6A→G7A | [前](12-rd-teacher1-B-G8A-raise-before.png) / [後](13-rd-teacher1-B-G8A-raise-after.png) |
| G8A 舉手 | 影像格 | 0 | 0 | 無 | [前](12-rd-teacher1-B-G8A-raise-before.png) / [後](13-rd-teacher1-B-G8A-raise-after.png) |
| G6B 舉手 | Roster | 0 | 0 | 無 | [前](roster-src0945-03-rd-teacher1-roster-B-G6B-raise-before.png) / [後](roster-src0945-04-rd-teacher1-roster-B-G6B-raise-after.png) |
| G6B 舉手 | 監控牆 | 2 | 304.0 | G8A→G6B；G6B→G8A | [前](14-rd-teacher1-B-G6B-raise-before.png) / [後](15-rd-teacher1-B-G6B-raise-after.png) |
| G6B 舉手 | 影像格 | 0 | 0 | 無 | [前](14-rd-teacher1-B-G6B-raise-before.png) / [後](15-rd-teacher1-B-G6B-raise-after.png) |
| G9A 舉手 | Roster | 0 | 0 | 無 | [前](roster-src0950-03-rd-teacher1-roster-B-G9A-raise-before.png) / [後](roster-src0950-04-rd-teacher1-roster-B-G9A-raise-after.png) |
| G9A 舉手 | 監控牆 | 3 | 625.1 | G7A→G9A；G6A→G7A；G9A→G6A | [前](16-rd-teacher1-B-G9A-raise-before.png) / [後](17-rd-teacher1-B-G9A-raise-after.png) |
| G9A 舉手 | 影像格 | 0 | 0 | 無 | [前](16-rd-teacher1-B-G9A-raise-before.png) / [後](17-rd-teacher1-B-G9A-raise-after.png) |
| 固定座標時 G7A 舉手 | Roster | 0 | 0 | 無；固定點 G9A→G9A | [前](roster-src0951-03-rd-teacher1-roster-C-fixed-pointer-G7A-raise-before.png) / [後](roster-src0951-04-rd-teacher1-roster-C-fixed-pointer-G7A-raise-after.png) |
| 固定座標時 G7A 舉手 | 監控牆 | 3 | 625.1 | G8A→G7A；G9A→G8A；G7A→G9A | [前](18-rd-teacher1-C-fixed-pointer-G7A-raise-before.png) / [後](19-rd-teacher1-C-fixed-pointer-G7A-raise-after.png) |
| 固定座標時 G7A 舉手 | 影像格 | 0 | 0 | 無 | [前](18-rd-teacher1-C-fixed-pointer-G7A-raise-before.png) / [後](19-rd-teacher1-C-fixed-pointer-G7A-raise-after.png) |
| G6A 離場 | Roster | 0 | 0 | 無；G6A 狀態加上 Left | [前](roster-src0953-03-rd-teacher1-roster-D-G6A-leave-before.png) / [後](roster-src0953-04-rd-teacher1-roster-D-G6A-leave-after.png) |
| G6A 離場 | 監控牆 | 0 | 0 | 無；G6A 留在牆上但變 Offline | [前](20-rd-teacher1-D-G6A-leave-before.png) / [後](21-rd-teacher1-D-G6A-leave-after.png) |
| G6A 離場 | 影像格 | 4（移除 G6A） | 178.0 | G6A→G6B；G6B→G7A；G7A→G8A；G8A→G9A | [前](20-rd-teacher1-D-G6A-leave-before.png) / [後](21-rd-teacher1-D-G6A-leave-after.png) |

## 正向／反向條件邊界

以下全部取自實際 UI 動作；Roster 的分段續測均沿用同一個 session。用途是界定觀測條件，不是缺陷分級。

| 觀測 | 反向測試：做了什麼 → 結果 | 邊界 |
|---|---|---|
| 監控牆在部分學生進場後換位 | 維持同一種「學生由 UI 進教室」事件，改測較晚進場的 G8A、G9A → 兩次 settled 快照皆為 0 人改 index、0 px | 進場本身不必然造成最終重排；本次只有 G6A/G6B/G7A 進場造成換位 |
| 監控牆在 G8A、G6B、G9A、G7A 自己舉手後換位 | 先讓五人全數進房，再由不同學生各自在 UI 舉手 → 四次仍有 2–4 人改 index，最大 304–625.1 px | 「所有人已進房」沒有消除舉手後的 settled 重排 |
| 影像格在五次進場與四次舉手後，共同存在者為 0 px | 改用會改變 participant 集合的 UI 離場事件：G6A 離場 → G6A 卡片移除，後四人各移 178 px | 0 px 只成立於本次追加進場／舉手的 settled 版面；membership 移除會造成補位 |
| 監控牆在 G8A/G9A 進場時為 0 px | 用相同 UI 進場事件反測較早進場的 G6A/G6B/G7A → 分別有 3、2、2 人改 index | 快照與 diff 能捕捉同事件型別的最終換位；0 px 不是因量測器全面失效 |
| Roster 在 G6A/G6B/G7A/G8A 進房後依序有 5/4/3/2 人換位 | 維持同一種 UI 進房事件，反測最後一位 G9A → 0 人改 index、0 px | 進房會不會換位取決於該學生從 Online 區移入 Attended 排序後的落點；最後一位本次沒有擠動既有人 |
| Roster 在三次舉手、固定座標舉手與 G6A 離場後皆為 0 px | 用會改變 Roster 排序狀態的 UI 進房事件反測 → A1–A4 可量到 57–228 px | 0 px 不是快照器失效；本次舉手不改 Roster 順序，離場只把 G6A 狀態改成 Left |

## 情境 A：時間差進場

五人依 G6A → G6B → G7A → G8A → G9A 順序進入，各次事件間隔約 20 秒。

- 監控牆：前三次進場造成既有 slot 換人；G6A 最大位移 608 px，G6B/G7A 各 304 px。G8A、G9A 進場時沒有既有學生移位。
- Roster：G6A/G6B/G7A/G8A 進場分別造成 5/4/3/2 人改 index，最大位移依序 228/171/114/57 px；G9A 最後進場為 0 px。每次都是原本仍可拉進教室的 Online 列向前補位，進房者移到 Attended 區段。
- 影像格：每位新學生都追加在既有 participants 後方；五次進場中，共同存在的學生 index 與座標都沒有改變。
- 因此「第 N 位進場是否擠動既有人」不是固定答案：本次 Roster N=1/2/3/4 會、N=5 不會；監控牆 N=1/2/3 會、N=4/5 不會；影像格五次都不會。

## 情境 B：舉手

- G8A 舉手：監控牆 4 人改 index，最大 625.1 px。
- G6B 舉手：監控牆 2 人改 index，最大 304 px。
- G9A 舉手：監控牆 3 人改 index，最大 625.1 px。
- 三次舉手在 Roster 都是 0 人改 index、0 px；舉手 icon/狀態變化沒有改變列順序。
- 三次舉手在影像格都為 0 位移；影像 participants 順序沒有跟舉手狀態變化。
- 本次 UI 觀測顯示：五人都已進房後，學生本人舉手仍會造成監控牆的 settled 整體補位；至於內部排序規則不是本報告的實測結論。

## 情境 C：固定座標的點錯風險

固定點為 `(x=784, y=227)`，在事件期間老師頁面的滑鼠沒有再移動；截圖用紅圈標示同一座標。

- 事件前最近祖先 tile 的 `title` 是 `G9A`。
- G7A 舉手後，同一座標最近祖先 tile 的 `title` 變成 `G8A`。
- 同時 snapshot slot diff 記錄 `(rectTop=158, rectLeft=636)` 由 `G9A → G8A`。
- 因此本次 1/1 個刻意設計的固定座標事件重現「手指不動，但座標上的學生改變」。這是單次受控觀測，不把 100% 外推成一般發生率。

注意：原始 [snapshots.json](snapshots.json) 的 `pointerRisk.name` 曾被外層 grid 全文污染而誤記 G6A；同一檔保存的 ancestor chain 已明確含最近 tile `title=G9A` / `title=G8A`。[analysis.json](analysis.json) 保留原始資料並修正這個分析欄位。

Roster 另以固定點 `(x=1089, y=365)` 測一次：事件前後都落在 G9A 列，G7A 舉手後仍為 `G9A → G9A`，Roster diff 為 0。反向對照是同一套量測器在 A1–A4 進房事件能捕捉到 57–228 px 與 slot 換人，因此此處的 0 不是座標讀取器失效。

## 情境 D：離場

G6A 離開後：

- Roster 保留 G6A 列、index 與座標不變，只把文字狀態加上 `Left`，本次為 0 px。
- 監控牆仍保留五張 roster-based tile，G6A 只由 Online 變 Offline，所以排序未變。
- 影像格移除 G6A，後面四人依序向上補位；四人 index 都改變，每人垂直位移 178 px，同一座標形成四段連鎖替換。

## 三面板行為對照

| 事件類型 | Roster | 監控牆 | 影像格 |
|---|---|---|---|
| 時差進場 | 前四人會依序重排，最大 228 px；第五人 0 px | 部分進場會跨 status bucket 重排；最大 608 px | 新卡追加，既有卡不動 |
| 舉手 | 三次皆 0 px | 每次都把舉手者帶入 needs-attention bucket，2–4 人改 index | 0 位移 |
| 固定座標風險 | G9A→G9A，0 px | G9A→G8A，直接重現座標換人 | 0 位移 |
| 離場 | 列保留、狀態加上 Left，0 px | tile 保留、狀態轉 Offline，本次 0 位移 | 移除卡片，四人各移 178 px |

## Roster 補測方式與限制

Roster 逐事件 index/座標 diff 已完成，原先「未測得」欄位均已以 UI 實測補上。

1. 面板 readiness 不再讀工具列文字或 active class；必須找到右側高逾 500 px 的實際 panel，且同時包含 `Staff`、`Online N`、五位學生列。A 開始前五列都有 action icon，否則直接失敗，不記 0。
2. 學生裝置檢查實際依序點擊相機、麥克風、播放聲音、確認有聽到，再以可見 dialog 內最後一顆「全部好了／進入教室」按鈕確認。所有進房、舉手、離場都由 UI 完成。
3. A1–A5 與 B-G8A 在同一 run 完成；之後因學生 RTC 出現「連線已中斷」，B-G6B/B-G9A/C/D 改成較小角色集合的 actions-only run，但全部沿用相同 room/course/session 與既有 `first_entered_at`，每個事件仍各自有 before/after。
4. 分段續測時非目標學生可能顯示 `Left` 或落在 Not attended 區，因此不同分段之間的 absolute order 不互相比較；本報告只比較同一事件 pair 內的 index/座標。這不影響各事件 0 位移的判讀。

## 建立資源清單（重跑／清理用）

除正式資源外，排錯重試另建立以下資源；均在 prod `test` 機構：

| 用途 | room_id | course_id | session_id |
|---|---|---|---|
| 正式事件 run | `019fff65-bb7f-70a6-8b94-45420b294409` | `019fff65-bbef-79dd-ad85-f41e6ef75eb6` | `019fff65-bd4d-7f68-88ac-8442123be539` |
| retry 1 | `019fff6a-a896-7597-b206-ad602b654edc` | `019fff6a-a908-71df-be72-b3d96a8f910d` | `019fff6a-aa03-7b45-afac-4b0919451a3e` |
| retry 2 | `019fff6d-7197-744f-8a71-318365776d15` | `019fff6d-723e-7c34-b002-0abec3158fd0` | `019fff6d-73a0-7d2a-935b-b1fbb9e8a013` |
| retry 3（Roster baseline） | `019fff71-56ab-7b7e-88cf-0be8b76dab81` | `019fff71-572a-71e0-a2d5-b668a477e10e` | `019fff71-589d-7360-91ff-f50935ac5ba3` |
| retry 4（Roster baseline） | `019fff72-7fcd-7d6c-bc1a-75cb840c4a33` | `019fff72-8046-75fc-84e2-c78028bc2aac` | `019fff72-81b0-7415-81c3-2ca20c242e9a` |
| Roster harness 09:01 | `019fff81-a2de-7e80-a7ea-9beb7c163426` | `019fff81-a369-7452-8217-8cc0015e036b` | `019fff81-a4c1-70ba-93f9-65d166d96bed` |
| Roster harness 09:04 | `019fff83-a2a6-75b7-be84-4bc0bc8045b6` | `019fff83-a336-7edd-8660-921bfe9603cf` | `019fff83-a4d1-7e86-9a6f-81259713cc5f` |
| Roster harness 09:05 | `019fff85-3922-7f6a-990c-6d9b2db5633c` | `019fff85-39fb-79d4-b0fc-88794d2708da` | `019fff85-3b53-744c-9d2a-8a8ca72dfd6f` |
| Roster harness 09:07 | `019fff86-996e-7321-aa2f-0ca1f804acd3` | `019fff86-9a26-78a6-9cca-cbe54a22b38b` | `019fff86-9b68-7436-861b-6338e2ff7aee` |
| Roster fallback G7B 09:09 | `019fff88-c141-75fd-bcd0-08c28274a667` | `019fff88-c1b4-7a03-bdb9-10b76713457c` | `019fff88-c323-709d-a8b3-7d6162bf2ce7` |
| Roster fallback G7B 09:11 | `019fff8a-5be2-76d5-a23a-bc1d68c73ab8` | `019fff8a-5cb9-7d91-b660-0dbe72206b9e` | `019fff8a-5dd7-716e-88e1-e531822c6bd6` |
| Roster fallback G8B 09:13 | `019fff8b-d4ae-7e68-865d-040f67bc997f` | `019fff8b-d579-7354-8bc5-5fa74d359f9b` | `019fff8b-d697-7c76-ab6a-31e7dc77399c` |
| Roster 4 人 fallback 09:14 | `019fff8d-52bd-715b-bedb-16b815eaf6c6` | `019fff8d-533e-7a56-9138-5a573d463f57` | `019fff8d-5496-7cb4-8f61-8c802a1d6fe1` |
| Roster device-flow 09:16 | `019fff8f-363f-7112-8900-37201e3fa211` | `019fff8f-36c9-73c3-a42f-6dbfd63c8aca` | `019fff8f-3826-75eb-8952-74d380afdde5` |
| Roster exact-card 09:18 | `019fff91-4473-7a0c-8b58-6419dac87730` | `019fff91-44ef-7791-b063-f05eeb95049b` | `019fff91-465e-7289-b50a-c0a96937bb35` |
| Roster A 完整診斷 09:20 | `019fff92-cc08-7dbc-a002-ec3a71a12f71` | `019fff92-cc75-7e11-a3db-15d6ea89cb39` | `019fff92-cdd5-751c-a52a-b8bb7f6bb024` |
| **Roster 正式補測／續測共用** | **`019fff97-28b2-7c2b-847f-ab724be163c9`** | **`019fff97-297c-7a13-b17d-c9442b758cdb`** | **`019fff97-2aac-7ff4-b974-3ba962e00ee0`** |
| Roster 後續完整重跑 09:29 | `019fff9b-614e-7960-852c-e1d5b37a084d` | `019fff9b-61ce-701b-913d-3952d812bc1c` | `019fff9b-6342-7834-8751-e290648c4ed4` |

## 截圖稽核

- 正式事件 run 的 21 張老師端截圖已全部目視檢查。
- 每組 before/after 都拍到對應人數、Monitor tile 狀態與 Video 卡片增減；固定座標組拍到同一紅圈位置。
- 稽核 contact sheets：`AUDIT-1.png`、`AUDIT-5.png`、`AUDIT-9.png`、`AUDIT-13.png`、`AUDIT-17.png`、`AUDIT-21.png`。
- Roster 補測保留 34 張成功路徑截圖（老師 before/after、panel readiness、學生裝置步驟），已逐張目視檢查；所有老師端事件圖都可看到真正打開的右側 Roster、Staff、狀態分區與學生列。
- Roster 稽核 contact sheets：[1](ROSTER-AUDIT-1.png)、[9](ROSTER-AUDIT-9.png)、[17](ROSTER-AUDIT-17.png)、[25](ROSTER-AUDIT-25.png)、[33](ROSTER-AUDIT-33.png)。

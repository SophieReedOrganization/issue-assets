# 關懷訊號後端紀錄稽核

## 執行與判定規則

本次遵守兩項硬規則：受測動作全部走真實 UI，API 僅用於 `test` 機構的建室／建課／報名／開堂與 active-org 前置；老師與助教頁面攔截所有 XHR/fetch，而非只記錯誤。每個可下結論的項目都做反向測試；同一路徑失敗 3 次後停止，沒有真正觸發的動作列為「未完成（不判定）」，不把「沒攔到 API」誤寫成產品沒有紀錄。

「✅有紀錄」必須同時符合：2xx API、payload/response 可定位學生、整頁重整後仍查得回來。只符合前兩條列為「🔶有送出但查不回來」。

## 測試環境

- 時間：2026-08-17 12:03–12:57（UTC+08:00，Asia/Taipei）
- 環境：prod
- 機構：`test`（`019f9271-a783-7000-a613-19f1dc3f2671`）
- 最終 1:1／分群補驗：room `01a00e0c-42ca-7f18-a3ad-fcb3d6f25eea`、course `01a00e0c-436c-7c22-89de-24e37beb1f7f`、session `01a00e0c-445d-73c6-9aa5-863646383e2a`
- 私訊正向控制：room `01a00dff-7121-788d-ab57-08a28de0ddf5`、course `01a00dff-71d8-7f20-b2ba-9dfd051f9505`、session `01a00dff-72ad-7c92-bb24-2842f876ea5d`
- 帳號：`rd-teacher1`、`rd-teacher3`、`rd-g6a`、`rd-g6b`、`rd-g7a`；owner `rdtest-owner`
- 學生 user id：G6A `019f9282-e6c2-7000-bc14-9d8de8b5591a`、G6B `019f9282-e51d-7000-a1cb-c2ec056daf12`、G7A `019f9282-e639-7000-a146-138ed97e5778`

## 核心結論

| 動作 | 有打 API | 端點 | payload 帶學生 id | 重整後還在 | 判定 | 證據 |
|---|---|---|---|---|---|---|
| 1. G6A 1:1 私密指導 | 是，204 | `POST /api/v1/me/classroom-logs` | 是，`mode.state.targets=G6A user id` | 否；重整只查 session／flags／breakout，沒有 classroom-log 回查 | 🔶有送出但查不回來 | [1:1 active](15-rd-teacher1-a-private-guide-active.png)、[network line 429](network-rd-teacher1.jsonl) |
| 2. G6B + G7A 分群指導 | 是，204 | `POST /api/v1/me/classroom-logs` | 是，`targets=G6B,G7A user ids` | 否；沒有可回查此 mode event 的 GET | 🔶有送出但查不回來 | [focus active](18-rd-teacher1-b-focus-active.png)、[network line 701](network-primary-rd-teacher1.jsonl) |
| 3. 助教對 G6A 分組討論 | UI 未真正觸發 | — | — | — | ⚪未完成（不判定） | [before](08-rd-teacher3-c-breakout-G6A-before.png)、[attempt after](10-rd-teacher3-c-breakout-G6A-after.png) |
| 4. 老師私訊 G6B | 是，201 | `POST /api/v1/classroom/{room}/chat/message` | 是，`recipientId=G6B user id` | 未證實；重整停在 device check，沒有送出 post-reload history GET | 🔶有送出但查不回來 | [before](primary-d-message-before.png)、[message visible](primary-d-message-after.png)、[reload blocked](primary-d-message-reload.png)、[network lines 713–717](network-primary-rd-teacher1.jsonl) |
| 5. 老師送金幣給 G7A | UI 未真正觸發 | — | — | — | ⚪未完成（不判定） | [before](05-rd-teacher1-e-send-coin-G7A-before.png)、[Roster assertion failure](06-rd-teacher1-e-roster-open.png) |
| 6. 個別派任務 | 沒有完成派任務 | — | — | — | ⚪未完成（不判定） | [before](primary-f-task-before.png)、[實際開到 Exam Paper Preview](primary-f-task-after.png) |
| 7. 回應／略過 G6A 舉手 | 學生舉手成功；老師略過未真正觸發 | — | — | — | ⚪未完成（不判定） | [student raised](12-rd-g6a-g-hand-raised.png)、[teacher attempt after](13-rd-teacher1-g-dismiss-hand-G6A-after.png) |

重要發現：1:1／分群不是「完全沒有任何 API」。完整攔截抓到 client diagnostic `classroom-logs`，其中確實寫入 `mode.state` 與目標 user id；但產品沒有在重整後查回這筆紀錄，因此依本任務的嚴格標準只能算 🔶，不能算可供「最後關懷時間」直接查詢的 ✅ 紀錄。

## 逐項反向測試

### 1. G6A 1:1

- UI：監控牆按 Group，只選 G6A，畫面明確顯示 `1:1 with G6A`，再結束。
- API：`POST /me/classroom-logs` 回 204，payload 的 `mode.state` 從 `BROADCAST` 變為 `PRIVATE_GUIDE`，`targets` 精確等於 G6A user id。
- 反向測試：改選兩位學生做分群 → 同一攔截器也抓到 `mode.state`，且 targets 變成兩個不同 user id；證明 G6A 單人 targets 不是背景請求誤判。
- 重整：未出現可把這筆 event 查回來的 endpoint，故不升級為 ✅。

### 2. G6B + G7A 分群

- UI：G6B、G7A 卡片均顯示 `In group`，頂部顯示 `Focus group · 2`。
- API：`POST /me/classroom-logs` 回 204，payload targets 為 G6B、G7A user id。
- 反向測試：改成只選 G6A → targets 縮為單一 G6A id，畫面也由 `Focus group · 2` 變為 `1:1 with G6A`；確認 payload 跟 UI 選取集合一致。
- 重整：沒有 classroom-log history GET，故只列 🔶。

### 3. 助教 breakout

- 三次限定嘗試都沒有從真正的右側 Roster 學生列開出「分組討論」menu；其中畫面顯示學生已 offline，嘗試點到的是監控卡資訊，而非 breakout menu。
- 反向測試：同一助教攔截器在進房與重整時可正常抓到 `GET /sessions/{id}/breakout-rooms` 200，內容均為 `{"breakout_rooms":[]}` → 證明攔截器正常，但因 create UI 沒觸發，不能據此判定產品沒有 POST／沒有紀錄。
- 結論：未反向驗證 create→reload persistence，停止並降級為待確認。

### 4. 私訊 G6B

- 動作前：`GET .../chat/students/{G6B}/history?limit=50` 回 200、`messages:[]`。
- 動作後：`POST .../chat/message` 回 201；request/response 均含 G6B `recipientId`，response 另有 message id `5fc669be-af59-4510-8903-a2eb8c0686ee`。
- 反向測試：比對動作前 0 筆與動作後新增的唯一訊息文字 `關懷稽核私訊 1786941416287` → 畫面與 POST response 同文，確認不是其他背景寫入。
- 重整：teacher reload 停在 pre-class device check，未執行 history GET；依規則不能把 POST 201 當成持久化已證實，列 🔶。

### 5. 送金幣

- 三次嘗試未能從真正的在線 Roster G7A 列開出送金幣 dialog；因此沒有完成 UI 動作。
- 反向測試：同一老師攔截器在同一測試系列可抓到私訊 POST 201 → 攔截器正常；但送金幣 UI 本身沒觸發，不能把「沒有 gift POST」寫成產品缺陷或 ❌。
- 結論：未反向驗證，待確認。

### 6. 個別派任務

- 嘗試從監控卡找入口，實際點到的是資訊／試卷預覽，畫面顯示 `Exam Paper Preview`，不是指定任務流程。
- 反向測試：檢查動作後畫面是否出現學生選擇、任務確認或送出回饋 → 均未出現；因此撤回「教室內沒有入口」的斷言，只記錄本次未找到正確入口。
- 結論：未反向驗證，待確認。

### 7. 回應／略過舉手

- G6A 學生端 UI 已成功點舉手並留圖；老師端因學生已回到 lobby／Roster 無 live participant，沒有出現可點的 dismiss control。
- 反向測試：同一老師攔截器可抓到私訊 POST 201，學生端也確實顯示舉手動作；但老師 dismiss 沒觸發，所以不能把「沒有 dismiss API」當作產品結論。
- 結論：未反向驗證，待確認。

## 重整證據與限制

- 老師、助教都做了 full-page reload；完整 log 顯示重新取得 session、重新 entry、查 flags 與 breakout list。
- reload 後頁面回到 device check。自動確認仍未讓 chat history UI 再次送出查詢，因此私訊的第 3 條未通過。
- 1:1／分群的 reload 流量沒有任何 endpoint 回傳先前的 `mode.state` event；`classroom-logs` 是 write-only diagnostic 路徑，不能直接作為「最後關懷時間」查詢來源。
- 測試後段三位學生呈 offline／回到 learning lobby，讓依賴 live participant 的 Roster actions 無法成立。依限定重試規則沒有繼續無限重跑。

## 原始證據

- 最終補驗老師完整 XHR/fetch：[network-rd-teacher1.jsonl](network-rd-teacher1.jsonl)
- 最終補驗助教完整 XHR/fetch：[network-rd-teacher3.jsonl](network-rd-teacher3.jsonl)
- 含成功私訊與兩人分群的 primary 老師 log：[network-primary-rd-teacher1.jsonl](network-primary-rd-teacher1.jsonl)
- primary 助教 log：[network-primary-rd-teacher3.jsonl](network-primary-rd-teacher3.jsonl)
- 建置資訊：[setup.json](setup.json)
- 補驗資料：[supplement.json](supplement.json)
- 全部補驗截圖縮圖牆：[contact-sheet.png](contact-sheet.png)
- primary run 截圖縮圖牆：[contact-sheet-primary.png](contact-sheet-primary.png)

所有報告引用的截圖及兩份 contact sheet 均已人工檢視；上表只引用確實拍到論點的畫面。

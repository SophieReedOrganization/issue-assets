# 關懷訊號後端紀錄稽核（第二輪合併報告）

## 執行與判定規則

本輪遵守任務書規則：所有受測動作均走真實 UI；API 只用於 `test` 機構的建教室、建課、報名、開堂與 active-org 前置。五個補測項目各自建立乾淨 room/course/session，一次只做一個動作；每個動作前都斷言目標學生在 Roster 的 `Online` 區、學生頁仍在教室、老師與學生 RTC 同房（live controls 至少 2）。老師／助教頁攔截並保存所有 XHR/fetch 的 method、URL、postData、status 與 response，而非只記錯誤。

「✅有紀錄」必須同時符合：有 2xx API、payload/response 可定位學生、整頁重整後由後端查得回來。只符合前兩條列為「🔶有送出但未證實可重整回查」。每條判定均附反向測試；沒有真正入口或無法完成回查時不冒充產品缺陷。

## 七項合併結論表

| # | 關懷動作 | 輪次 | 有打 API | 可定位學生 | 整頁重整後查回 | 判定 |
|---|---|---|---|---|---|---|
| 1 | G6A 1:1 私密指導 | 第一輪 | `POST /api/v1/me/classroom-logs` 204 | 是，`mode.state.targets=G6A user id` | 否；reload 無 classroom-log 回查 | 🔶 有送出但查不回來 |
| 2 | G6B + G7A 分群指導 | 第一輪 | `POST /api/v1/me/classroom-logs` 204 | 是，targets 精確為兩人 user id | 否；reload 無 classroom-log 回查 | 🔶 有送出但查不回來 |
| 3 | 助教對 G6A 分組討論 | 第二輪 | `POST /sessions/{session}/breakout-rooms` 201 | 是，request/response 均為 G6A user id | 未達標；reload 後 UI 仍在 breakout route，但沒有再次 GET breakout record | 🔶 有送出但未證實可重整回查 |
| 4 | 老師私訊 G6B | 第一輪＋第二輪 | `POST /classroom/{room}/chat/message` 201 | 是，`recipientId=G6B user id` | 未完成；reload 後 RTC participant 未恢復，無法再開 G6B Chat 觸發 history GET | 🔶 有送出但未證實可重整回查 |
| 5 | 老師送 1 金幣給 G7A | 第二輪 | `POST /sessions/{session}/gifts` 201 | 是，request user id 與 response member id 均為 G7A | 否；reload 流量沒有 gift/history retrieval endpoint | 🔶 有送出但查不回來 |
| 6 | 個別派任務 | 第二輪 | 不適用 | 不適用 | 不適用 | ⚪ 現況教室內沒有「派發個別任務」入口；只有帶學生去既有任務 |
| 7 | 略過 G6A 舉手 | 第二輪 | 無產品後端 API；僅 local state + RTM dismiss | — | — | ❌ 無後端紀錄 |

第一輪原始結論與證據見 [第一輪 REPORT](../2026-08-17-04-53-42-care-signal-audit-supplement/REPORT.md)。本輪沒有重跑 1:1 與分群。

## 測試環境與正式批次

- 時間：2026-08-17 13:15–13:39（UTC+08:00，Asia/Taipei）
- 環境：prod；全程 headless
- 機構：`test`（`019f9271-a783-7000-a613-19f1dc3f2671`）
- 帳號：老師 `rd-teacher1`、助教 `rd-teacher3`、學生 `rd-g6a`／`rd-g6b`／`rd-g7a`、owner `rdtest-owner`
- G6A user id：`019f9282-e6c2-7000-bc14-9d8de8b5591a`
- G6B user id：`019f9282-e51d-7000-a1cb-c2ec056daf12`
- G7A user id：`019f9282-e639-7000-a146-138ed97e5778`；member id：`019f9282-e650-71dd-bc91-fb9d0510de3e`

| 項目 | room | course | session |
|---|---|---|---|
| 個別派任務入口 | `01a00e25-eac2-75fc-bde5-c7d5172beaea` | `01a00e25-ebae-769e-bfc4-130b8adc3718` | `01a00e25-ed9a-7cc1-8efb-d9d43dcbdf5c` |
| 私訊重整回查 | `01a00e2f-c1e8-7339-bd97-af7039c65d34` | `01a00e2f-c275-7356-a2a5-05111e7e0466` | `01a00e2f-c38b-7a02-aa54-082685e592df` |
| 送金幣 | `01a00e37-6f2d-768f-8008-49e2fd2e94ec` | `01a00e37-6ffe-7160-8c91-57b21b4e3b8b` | `01a00e37-70bb-7958-8dff-0388a263a56d` |
| 略過舉手 | `01a00e38-a9bd-742c-93a9-f571a71727ec` | `01a00e38-aaab-74bb-acfb-4551124ae4b0` | `01a00e38-ab8c-73bf-b1b9-1b900483e33c` |
| 助教分組討論 | `01a00e3a-2de7-7751-9343-cd6598ba4227` | `01a00e3a-2e8a-7d95-82aa-c5dd08368a4d` | `01a00e3a-2f52-77d6-a097-08ac786205ae` |

## 3. 助教對 G6A 分組討論：🔶

- 前置：G6A 在 Roster `Online` 區且 RTC 同房，見 [online/in-room](evidence/breakout/04-rd-teacher3-breakout-online-in-room.png)。
- UI：助教由 G6A 列 `⋯` 開出「分組討論」，見 [正確 menu](evidence/breakout/05-rd-teacher3-breakout-menu-open.png)；點擊後建立 breakout 並進入分組畫面，見 [active](evidence/breakout/06-rd-teacher3-breakout-active.png)。
- API：完整 log [network-rd-teacher3.jsonl](evidence/breakout/network-rd-teacher3.jsonl) line 409/412 為 POST 201，payload `student_user_id=G6A`；line 410/411 的立即 GET 200 回傳唯一 active breakout，`student_name=G6A`。
- 重整：full reload 後畫面仍顯示「分組討論」與 G6A，見 [after reload](evidence/breakout/07-rd-teacher3-breakout-after-reload.png)，但 reload 區段沒有再次送出 `GET .../breakout-rooms`。畫面可能由 route/history state 恢復，不能按嚴格標準當作後端重整回查。
- 反向測試：動作前同 endpoint 三次 baseline GET（line 133/139、303/306、367/368）均為 `breakout_rooms:[]`；動作後立即 GET 才出現唯一 G6A，證明新增由本次 UI 動作產生。重整後仍缺正式回查，因此不升為 ✅。

## 4. 私訊 G6B 的重整回查：維持 🔶

- 前置：G6B 在 Roster `Online` 區且 RTC 同房，見 [online/in-room](evidence/private/04-rd-teacher1-private-online-in-room.png)。
- 動作前：Chat history UI 已觸發 GET 200，回傳 `messages:[]`，見 [baseline](evidence/private/05-rd-teacher1-private-history-baseline.png) 與 [network-rd-teacher1.jsonl](evidence/private/network-rd-teacher1.jsonl) line 431–432。
- 動作後：UI 顯示 `R2 私訊重整回查 1786944448428`，見 [message sent](evidence/private/06-rd-teacher1-private-message-sent.png)；line 437/439 的 POST 201 精確帶 G6B `recipientId`。
- 重整：老師通過 device check 並重新進入同一堂；G6B 也由 UI 重新進堂兩次，但 teacher 端只恢復 attendance Online，沒有恢復 G6B RTC participant/overlay，Chat 學生清單沒有 G6B，故 post-reload history GET 未發生。
- 反向測試：動作前 history 為 0 筆，接著只有一筆文案完全相同且 recipient 精確為 G6B 的 POST；可證明寫入由本次動作產生。但重整後入口因 RTC 狀態不可用，持久化未反向驗證，不能寫成訊息消失，也不能升為 ✅。

## 5. 老師送金幣給 G7A：🔶

- 前置：G7A 在 Roster `Online` 區且 RTC 同房，見 [online/in-room](evidence/coin/04-rd-teacher1-coin-online-in-room.png)。
- UI：G7A 列 `⋯` 顯示「送金幣」，見 [menu](evidence/coin/05-rd-teacher1-coin-menu-open.png)；金額 dialog 顯示 1／3／5，見 [dialog](evidence/coin/06-rd-teacher1-coin-dialog-open.png)；點 1 後老師端有 `+1` 與金幣動畫，見 [sent](evidence/coin/07-rd-teacher1-coin-sent.png)。
- API：[network-rd-teacher1.jsonl](evidence/coin/network-rd-teacher1.jsonl) line 461/462 為 POST 201；request `recipient_user_id=G7A`、amount 1，response 回 `gift_id=01a00e38-3459-759e-8c4b-735484c73e24` 與 G7A member id。
- 重整：老師 full reload 並重新進房，見 [after reload](evidence/coin/09-rd-teacher1-coin-after-reload.png)，但 reload 流量沒有 gift/history retrieval endpoint，無法由後端查回該 gift。
- 反向測試：fresh session 中產生唯一 gift id，request/response 可雙向定位 G7A；但產品沒有可先取 baseline 或 reload 後取 history 的 GET，既有筆數／最後時間無法完整反向驗證，因此只列 🔶。

## 6. 個別派任務：⚪ 現況教室內沒有此入口

- 前置：G6A 在 Roster `Online` 區且 RTC 同房，見 [online/in-room](evidence/task/04-rd-teacher1-task-online-in-room.png)。
- UI 搜尋：G6A Roster `⋯` 只有音訊／視訊、1:1、互動項目、移出與送金幣等，沒有「派任務」，見 [Roster menu](evidence/task/05-rd-teacher1-task-roster-menu.png)；Monitor 面板也只提供監看／導引，見 [Monitor](evidence/task/06-rd-teacher1-task-monitor-panel.png)。[r2.json](evidence/task/r2.json) 實際記錄 `menuHasAssign=false`。
- 程式搜尋：檢查 `ClassroomContent.tsx`、`ResourcePreviewDrawer.tsx`、`ParticipantsList.tsx`、`participant-row-parts.tsx`、`UnifiedRosterPanel.tsx`、teacher agora widgets，並搜尋 `assignTask`、`指定任務`、`CoursewareAssignment`、`StudentCoursewareAssignment`、`onNavigateStudent`。
- 結果：教室內 `handleNavigateStudent` 與 `ResourcePreviewDrawer.onNavigateStudent` 是透過 RTM「帶這個學生去既有任務頁」，不是建立或派發任務。真正的 `packages/courseware-assignment` 元件存在於另一份 frontend mirror，但沒有被本次受測的教室 `ClassroomContent`／Roster 接線。
- 反向測試：同時由程式引用關係、真實 Roster `⋯` 與 Monitor 面板三個方向尋找，均只找到 navigate workflow、找不到 assignment workflow。因此結論限縮為「現況教室內沒有此入口」，不判定後端是否能記錄一個 UI 根本無法發起的動作。

## 7. 略過 G6A 舉手：❌ 無後端紀錄

- 前置：G6A 在 Roster `Online` 區且 RTC 同房，見 [online/in-room](evidence/dismiss/04-rd-teacher1-dismiss-online-in-room.png)。
- UI：學生端成功舉手，見 [student raised](evidence/dismiss/05-rd-g6a-dismiss-hand-raised.png)；老師端出現可點的 dismiss control，見 [control](evidence/dismiss/06-rd-teacher1-dismiss-control-visible.png)；點擊後老師端舉手項目清除，見 [teacher after](evidence/dismiss/07-rd-teacher1-dismiss-after.png)，學生端也回到未舉手狀態，見 [student after](evidence/dismiss/08-rd-g6a-dismiss-student-after.png)。
- Network：[network-rd-teacher1.jsonl](evidence/dismiss/network-rd-teacher1.jsonl) line 433 `dismiss:before` 到 line 434 `dismiss:after` 之間沒有任何產品後端 request；只有教室即時訊號／Agora telemetry。程式 `packages/agora-widgets/src/teacher/hooks/useTeacherClassroom.ts` 的 dismiss handler 也只 dispatch `REMOVE_RAISED_HAND` 並透過 RTM `sendSignal({type:'RAISE_HAND', action:'dismiss'})`。
- 重整：full reload 後舉手仍未出現，見 [after reload](evidence/dismiss/09-rd-teacher1-dismiss-after-reload.png)；這只反映即時狀態已清除，不是後端關懷紀錄。
- 反向測試：同一次 session、同一攔截器緊接著打開 G6A Chat；line 436/437 先 GET history 200，line 438/440 再成功攔到私訊 POST 201，recipient 精確為 G6A。攔截器確實是活的，故 dismiss 區段沒有產品 API 可判定為該動作沒有後端寫入。

## 重整限制與判讀邊界

- breakout reload 保留分組 UI，但沒有後端 GET，不能以畫面留在 breakout route 代替持久化證據。
- gift API 有唯一 `gift_id`，但本 UI 沒有 history retrieval API；因此只能證明 write，不能證明 reload read。
- private message 本來有 history endpoint，但 reload 後 G6B 沒恢復成 RTC live participant，無法從 UI 再次開啟該生 Chat；依規則保留待確認，不推論訊息消失。
- dismiss 的結論不同：動作本身完整觸發，前後 marker 間沒有產品 API，且同攔截器的私訊正向控制成功，因此可判定 ❌。

## 原始證據索引

- 五項正式證據縮圖牆：[contact-sheet.png](contact-sheet.png)
- breakout：[setup](evidence/breakout/setup.json)、[result](evidence/breakout/r2.json)、[助教 network](evidence/breakout/network-rd-teacher3.jsonl)、[學生 network](evidence/breakout/network-rd-g6a.jsonl)
- coin：[setup](evidence/coin/setup.json)、[result](evidence/coin/r2.json)、[老師 network](evidence/coin/network-rd-teacher1.jsonl)、[學生 network](evidence/coin/network-rd-g7a.jsonl)
- dismiss：[setup](evidence/dismiss/setup.json)、[result](evidence/dismiss/r2.json)、[老師 network](evidence/dismiss/network-rd-teacher1.jsonl)、[學生 network](evidence/dismiss/network-rd-g6a.jsonl)
- private：[setup](evidence/private/setup.json)、[老師 network](evidence/private/network-rd-teacher1.jsonl)、[學生 network](evidence/private/network-rd-g6b.jsonl)
- task：[setup](evidence/task/setup.json)、[result](evidence/task/r2.json)、[老師 network](evidence/task/network-rd-teacher1.jsonl)

報告引用的成功路徑截圖與 contact sheet 均已人工目視確認，所選圖片確實拍到對應論點。完整 XHR/fetch log 保留原始 request/response 與階段 marker，未只擷取錯誤。

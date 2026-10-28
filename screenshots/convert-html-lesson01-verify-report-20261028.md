# 驗收報告：第01課_你好這就是我_互動教材_平台版.html

**結果：PASS（可以交付）**

✓＝工具實測通過；⚠＝要人看一眼（看截圖、對照轉換紀錄）；✗＝不合格。

| | 項目 | 結果 |
|---|---|---|
| ✓ | play-script | 作答腳本只透過 __act 操作畫面 |
| ✓ | M11 | 沒有 API 金鑰 |
| ✓ | content | 原檔的中文字保留 99.4% |
| ✓ | gate-fresh | 還有題目沒做時完成鈕不在畫面上 |
| ✓ | partial | partial() 後作答 5/24 題 |
| ✓ | gate-partial | 還有題目沒做時完成鈕不在畫面上 |
| ✓ | paging-structure | 一頁一頁翻，有接平台分頁結構（20 個 .page） |
| ✓ | monitor | 翻頁回報頁碼、頁名、百分比（最後一筆：第 3 頁／19、找出課文裡的線索、21%） |
| ✓ | pen-jump | 老師畫筆跳頁（不帶 clearedUpTo）沒有替學生解鎖後面的頁 |
| ✓ | persist | 重新整理後首答紀錄還在（5 題） |
| ✓ | persist-page | 重新整理後回到原本那頁（第 4 個 .page） |
| ✓ | persist-ui | 重新整理後畫面保留了作答痕跡 |
| ✓ | all-answered | 每一題都作答過（24/24） |
| ✓ | complete | 完成鈕按三次只送一次 TASK_COMPLETED |
| ✓ | scoring | 對錯對帳正確：故意答錯 1 題，首答答對 23/24，achievedScore 0.96 |
| ✓ | persist-all | 做完後重新整理，畫面和做完時一致（相似度 0.98） |
| ✓ | reopen | 重新開啟後完成鈕還能按（再送一次） |
| ✓ | fonts | 用到的字型都載得到（包含開注音後） |
| ✓ | checker-static | 有一字不差的 <head> |
| ✓ | checker-static | M10 沒掛 runtime、自己管注音：按「注音開／關」確認真的有切換 |
| ✓ | checker-runtime | game:ready（在 iframe onload 之前送出，正常） |
| ✓ | checker-runtime | PROGRESS_UPDATE page=0 / 19（你好，這就是我！） |
| ✓ | checker-runtime | PROGRESS_UPDATE page=1 / 19（本課詞語） |
| ✓ | checker-runtime | PROGRESS_UPDATE page=2 / 19（讀懂小安的故事） |
| ✓ | checker-runtime | PROGRESS_UPDATE page=3 / 19（找出課文裡的線索） |
| ✓ | checker-runtime | PROGRESS_UPDATE page=4 / 19（看注音，寫完整句子） |
| ✓ | checker-runtime | game:ready（onload 後 3 ms；超過 3000 ms 平台會先顯示） |
| ✓ | checker-runtime | PROGRESS_UPDATE page=5 / 19（單句填空：詞語找位置） |
| ✓ | checker-runtime | PROGRESS_UPDATE page=6 / 19（短文填空：詞語進情境） |
| ✓ | checker-runtime | PROGRESS_UPDATE page=7 / 19（該怎麼回答？） |
| ✓ | checker-runtime | PROGRESS_UPDATE page=8 / 19（說說我的喜好） |
| ✓ | checker-runtime | PROGRESS_UPDATE page=9 / 19（把先後順序說清楚） |
| ✓ | checker-runtime | PROGRESS_UPDATE page=10 / 19（寫下我的小目標） |
| ✓ | checker-runtime | PROGRESS_UPDATE page=11 / 19（詞語應該放在哪裡？） |
| ✓ | checker-runtime | PROGRESS_UPDATE page=12 / 19（把打亂的詞語排成句子） |
| ✓ | checker-runtime | PROGRESS_UPDATE page=13 / 19（句型轉換：用「也」說喜好） |
| ✓ | checker-runtime | PROGRESS_UPDATE page=14 / 19（合併句子：用「再」連動作） |
| ✓ | checker-runtime | PROGRESS_UPDATE page=15 / 19（看圖，把小事寫清楚） |
| ✓ | checker-runtime | PROGRESS_UPDATE page=16 / 19（先在紙上記關鍵詞） |
| ✓ | checker-runtime | PROGRESS_UPDATE page=17 / 19（今日寫作題目） |
| ✓ | checker-runtime | PROGRESS_UPDATE page=18 / 19（完成我的第一篇介紹） |
| ✓ | checker-runtime | achievedScore=0.96 |
| ✓ | checker-runtime | 獎勵 xp=47 coins=19（後端上限 50/20，另套重做衰減） |
| ✓ | checker-runtime | sessionLog 是陣列（21 筆） |
| ✓ | checker-runtime | 完成時每一題都作答過（24 / 24） |
| ✓ | checker-runtime | 存檔鍵帶任務前綴（edu_demo-task_第01課-你好這就是我-互動教材___eb_completedAt, edu_demo-task_第01課-你好這就是我-互動教材___eb_tries, edu_demo-task_第01課-你好這就是我-互動教材___eb_first…） |
| ✓ | checker-runtime | game:ready（onload 後 2 ms；超過 3000 ms 平台會先顯示） |
| ✓ | checker-runtime | sessionLog 是陣列（2 筆） |
| ✓ | checker-runtime | 開注音後畫面有變化（字型或看得到的注音）：請目視確認注音正確、沒有疊兩層 |
| ✓ | src-first | 學生端先用 src 跨網域載入的那一次沒有錯誤 |
| ✓ | preview | 預覽環境（只有 allow-scripts allow-same-origin）可以操作 |
| ✓ | mirror | 鏡像頁（沒有學生存檔）載入正常、REQUEST_READY 會重送 game:ready |
| ✓ | mirror-page | 分頁式：鏡像頁收到 SET_PAGE{page:1, clearedUpTo:1} 跳到第 2 個 .page |
| ✓ | stable-dom | 老師鏡像頁重新打開時，畫面結構和學生的一樣（載入時沒有隨機） |
| ✓ | width-375 | 375px 寬沒有左右溢出（字的大小看截圖） |
| ✓ | width-768 | 768px 寬沒有左右溢出（字的大小看截圖） |

截圖：截圖_完成.png、截圖_注音開.png、截圖_375x667.png、截圖_768x1024.png

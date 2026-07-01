# 本地存檔(localStorage)與生成 HTML 注意事項

> 對象:雜誌風引擎互動講義模板。
> 來源:`雜誌風_舊結構/index.html` 的 `EduStorage` / `saveProgress` / `restoreProgress` / `fireComplete`,與實際行為一致。
> 完整參考實作(v18,含觸控/RWD/協定強化)附於 `附件A_頁式引擎_參考實作_v18.html`。
> 配套文件:通訊協定見 [`通訊規範.md`](通訊規範.md)。

---

## 1. 用途

引擎用 `EduStorage`(localStorage 包裝)在**學生的瀏覽器本機**保存「闖關進度 + 目前頁」,讓學生關掉重開能**續讀**。

- 平台的續讀(下行 `SET_PAGE`)為**權威**;本地存檔是**輔助**(平台沒帶續讀資料時,靠本地回到上次位置)。
- 只存**輕量進度物件**;教育內容/媒體走 `COURSE_DATA` 注入,**不進** localStorage。

---

## 2. 🔴 唯一性(key 命名)— 最重要

每份講義的存檔 key 前綴:

```
edu_<instanceId|taskId|default>_<handoutId>_<key>
```

實際保存的主要 key 是 `progress`,即 `edu_<...>_<handoutId>_progress`。

| 片段 | 來源 | 說明 |
|------|------|------|
| `instanceId` / `taskId` | URL query(平台嵌入時帶) | 沒帶則為 `default` |
| `handoutId` | 優先 `window.HANDOUT_ID`;未設則由 `COURSE_DATA` 內容雜湊自動產生 | 見下方 seed |

`handoutId` 自動雜湊的 seed:
```
meta.unitTitle | concepts[0].title | concepts 數 | mcqs 數   →  'h' + base36 雜湊
```

**目的**:即使平台沒帶 `instanceId`,兩份「結構相似」的講義也**不會互吃進度**——開完 A 再開結構類似的 B,B 不應顯示「已完成」。

---

## 3. 存什麼、何時存

`progress` 內容:
```js
{
  cleared: [已過關的頁 index, ...],
  page:    目前頁 index,
  sess:    [已過關的 questionId, ...],
  ft:      firstTry(一次答對)次數
}
```

**觸發存檔**:
- 每次**切頁**(onPageChange)
- 每次**過關**(markCleared)

---

## 4. 何時清除

| 時機 | 行為 |
|------|------|
| **完成**:學生點「完成學習」發出 `TASK_COMPLETED` 後 | 自動 `remove('progress')`——成績已上報平台,本地 in-progress 清掉,避免下次開啟誤顯示已完成 |
| **平台重置**:收到下行 `RESET_PROGRESS` | 清空闖關狀態 + `remove('progress')` + 回首頁 |
| **平台續讀**:收到下行 `SET_PAGE`{page, clearedUpTo} | 還原 gating(依 clearedUpTo)並跳頁;與本地存檔並行,**以平台為準** |

---

## 5. 安全與降級

所有 localStorage 存取(load / save / remove)都包 `try/catch`:
- Safari 無痕模式、儲存已滿、或瀏覽器停用 localStorage 時 **不報錯、靜默降級**。
- 降級後:無法續讀,但闖關/作答/上報平台等功能**完全正常**。

---

## 6. 🔴 生成 HTML 時的檢查清單

- [ ] **`COURSE_DATA.meta.unitTitle` 有值且各講義可區別**(或生成器/平台明確注入 `window.HANDOUT_ID`)。
      否則兩份「meta 空白 + 題數相同」的講義會算出相同雜湊 → **進度互吃**。
- [ ] 平台嵌入 URL 有帶 `instanceId`(或 `taskId`)→ 同一份講義跨裝置/重開一致、不同任務不互吃。
- [ ] 不要把大量資料塞進 localStorage(引擎只存輕量進度物件)。
- [ ] 完成後本地進度會自動清除;若平台要「重做整份」,發 `RESET_PROGRESS` 即可。
- [ ] 測試續讀:作答數頁 → 重新整理 → 應回到上次頁且已過關的關卡維持解鎖。

---

## 7. 對照:平台可注入的識別碼

```
?instanceId=<任務實例id>        # 建議一定帶,續讀/監控最可靠
?taskId=<任務id>                # instanceId 沒帶時的替代
window.HANDOUT_ID = '<講義唯一id>'  # 生成/注入時可直接指定,免依賴雜湊
```

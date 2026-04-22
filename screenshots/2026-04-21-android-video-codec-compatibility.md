# 舊 Android 平板無法播放學習影片 — 調查報告與修復方案

**日期**：2026-04-21
**撰寫目的**：交付後端 / DevOps 工程師執行修復
**受影響服務**：`video-generator-service`（Go + FFmpeg）
**受影響產品**：`apps/student`（React，使用原生 `<video>` 播放）

---

## TL;DR

1. **問題**：`video-generator-service` 產生的學習影片在 Android 8 舊平板上無法播放
2. **根因**：FFmpeg 未指定 `-profile:v`，libx264 預設輸出 **H.264 High Profile**；Android CDD 未將 High Profile 列為必要支援，中低階 SoC 硬體 decoder 不實作
3. **決策**：以 **H.264 Main Profile / Level 4.0** 為新標準（涵蓋 Android 6.0+ / 2015 年 10 月後裝置，放棄 2012 年前裝置）
4. **修復**：
   - **Part 1（程式碼）**：`video-generator-service` 改 4 處 FFmpeg 參數 + 1 處 struct 定義
   - **Part 2（既有影片）**：寫 audit + re-encode 腳本，批次覆蓋 GCS 上的舊 MP4
5. **影響**：檔案大小 +3–5%、畫質肉眼無感、既有影片 URL 不變（前端 0 改動）
6. **量級**：既有影片數**數千部** → Migration 必須在 GCP 內雲端並行執行、需 resumable、建議分批 rollout

---

## 1. 問題現象

- Student app（`apps/student/src/components/content/VideoPlayer.tsx`）使用**原生 HTML5 `<video>` 標籤**播放 MP4，無第三方播放套件
- 播放能力 100% 依賴瀏覽器 + Android 系統 codec
- Android 8 平板用戶回報：學習影片無法播放（黑畫面 / 永久 loading / 錯誤訊息）
- 同影片在 Android 10+、iOS、Desktop Chrome / Safari / Firefox 都正常

---

## 2. 根因定位

### 位置

`video-generator-service/internal/compiler/ffmpeg.go`

三處 FFmpeg 呼叫的編碼參數：

| 函式 | 行號 | 用途 |
|---|---|---|
| `compileVideo` | L140-149 | 每 scene 一個 audio 的流程 |
| `compileVideoBulk` | L497-506 | Bulk audio + multi-image 流程 |
| `MergeAudioVideo`（speed 調整分支） | L677-684 | 含 speed adjust 的 merge |

### 共同特徵

```
-c:v libx264          ✅ 有
-movflags +faststart  ✅ 有
-c:a aac              ✅ 有
-profile:v            ❌ 未指定  ← 根因
-level:v              ❌ 未指定
-pix_fmt              ❌ 未指定
-profile:a            ❌ 未指定
```

### 機制

未指定 `-profile:v` 時，libx264 預設挑可行範圍內**最高 profile** = **H.264 High Profile**。

**High Profile 在 Android 的問題**：

- Android 官方 Compatibility Definition Document (CDD) **未將 H.264 High Profile 列為必要支援項目**，只保證 Baseline（3.0+）與 Main（6.0+）
- 中低階 SoC（教育市場常見的 Rockchip、Allwinner、早期 MTK）硬體 decoder 未實作 High Profile 的 8×8 transform / 8×8 intra prediction
- 結果：MP4 可下載，但播放時無法解碼

---

## 3. Android 版本 × H.264 Profile 支援對照

| Profile | 官方 CDD 最低 Android | 實質涵蓋 |
|---|---|---|
| Baseline | 3.0+（2011） | 所有 Android 裝置 |
| **Main** | **6.0+（2015）** | **所有 2015-10 後出廠裝置（含 Android 8 平板）** |
| High | 未列入 CDD 必要項 | 依 SoC 而定，舊平板不穩 |

**商業決策（已確認）**：接受放棄 2012 年前裝置 → **標準 = H.264 Main Profile**。

---

## 4. 修復 Part 1 — 程式碼修改

### 4.1 影響範圍總覽

| 檔案 | 變更類型 |
|---|---|
| `pkg/models/scene.go` | 擴充 `QualityPreset` struct + map |
| `internal/compiler/ffmpeg.go` | 三處 FFmpeg 參數加固 |
| `internal/compiler/ffmpeg_test.go` | 更新 literal + 新增驗證 codec 屬性的 test |

### 4.2 `pkg/models/scene.go` L35-49

加入 Profile / Level 欄位：

```go
type QualityPreset struct {
    Width   int
    Height  int
    Bitrate string
    Preset  string
    Profile string  // 新增：h264 profile (main / high)
    Level   string  // 新增：h264 level (3.1 / 4.0 / 5.0 / 5.1)
}

var QualityPresets = map[string]QualityPreset{
    "720p":  {Width: 1280, Height: 720,  Bitrate: "2500k",  Preset: "fast", Profile: "main", Level: "3.1"},
    "1080p": {Width: 1920, Height: 1080, Bitrate: "5000k",  Preset: "fast", Profile: "main", Level: "4.0"},
    "2k":    {Width: 2560, Height: 1440, Bitrate: "8000k",  Preset: "fast", Profile: "main", Level: "5.0"},
    "4k":    {Width: 3840, Height: 2160, Bitrate: "15000k", Preset: "fast", Profile: "main", Level: "5.1"},
}
```

Level 值對應 H.264 規格硬性上限：3.1 = 720p@30、4.0 = 1080p@30、5.0 = 1440p@30、5.1 = 2160p@30。

### 4.3 `internal/compiler/ffmpeg.go` L140-149（`compileVideo`）

```go
args = append(args,
    "-c:v", "libx264",
    "-profile:v", preset.Profile,      // 新增
    "-level:v", preset.Level,          // 新增
    "-pix_fmt", "yuv420p",             // 新增
    "-preset", preset.Preset,
    "-b:v", preset.Bitrate,
    "-c:a", "aac",
    "-profile:a", "aac_low",           // 新增
    "-b:a", "192k",
    "-shortest",
    "-threads", "0",
    "-movflags", "+faststart",
)
```

### 4.4 `internal/compiler/ffmpeg.go` L497-506（`compileVideoBulk`）

同 4.3，加入相同 5 個參數。

### 4.5 `internal/compiler/ffmpeg.go` L677-684（`MergeAudioVideo` speed 分支）

此處沒有 `preset` 變數，參數寫死：

```go
"-c:v", "libx264",
"-profile:v", "main",
"-level:v", "4.0",
"-pix_fmt", "yuv420p",
"-preset", "fast",
"-crf", "23",
"-c:a", "aac",
"-profile:a", "aac_low",
"-b:a", "128k",
```

### 4.6 不需要改的地方

`MergeAudioVideo` 無 speed 調整分支（L687-698）用 `-c:v copy` 直接複製上游 codec，會自動繼承 4.3 / 4.4 的修正結果。

### 4.7 每個參數的作用

| 參數 | 作用 | 省略後果 |
|---|---|---|
| `-profile:v main` | 強制 H.264 Main Profile | libx264 挑 High，舊 Android 不支援 |
| `-level:v 4.0` | 限制 bitrate / buffer / resolution 上限 | 檔案可能超出硬體 decoder buffer |
| `-pix_fmt yuv420p` | 8-bit 4:2:0 色彩取樣 | libx264 可能選 yuv444p / yuv420p10le，瀏覽器完全不支援 |
| `-profile:a aac_low` | AAC-LC（最廣相容） | 可能輸出 HE-AAC，舊 Android 音訊可能無聲 |
| `-movflags +faststart` | `moov` atom 放檔頭 | Android CDD 要求，否則 progressive download 無法開始播放（目前已有 ✅） |

---

## 5. 修復 Part 2 — 既有影片 Migration

### 5.1 為什麼不能略過

Part 1 只影響**未來新生成**的影片。既有已上傳到 GCS 的 `.mp4` 仍是 High Profile，舊平板依舊無法播放。

### 5.2 Step 1：Audit（先跑，不要直接覆蓋）

目的：確認影響範圍（有多少支影片、是否真的全部都是 High Profile）。

#### ⚠️ 量級警告

既有影片約**數千部**（假設 3000 支 × 平均 80 MB = **240 GB**）。**絕對不能**每支都完整下載。

**關鍵優化**：因 Part 1 的 `+faststart` 確保 `moov` atom 在檔頭，`ffprobe` 對 HTTPS URL 使用 HTTP Range 請求，**只需下載前幾百 KB** 就能讀到編碼 metadata，節省 99%+ 頻寬。

#### Audit 腳本（雲端執行）

```bash
#!/bin/bash
# audit-video-profiles.sh
# 在 GCE VM 或 Cloud Run Job 內執行，使用 signed URL + HTTP range
set -euo pipefail

BUCKET="gs://baania-generated-videos"  # TODO: 確認實際 bucket 名稱
TMP="/tmp/video-audit"
PARALLEL=32  # ffprobe 只讀 metadata 很輕量，可以高並行
mkdir -p "$TMP"

# 列出所有影片
gsutil ls "${BUCKET}/**/*.mp4" > "$TMP/video-list.txt"
TOTAL=$(wc -l < "$TMP/video-list.txt")
echo "Total videos: $TOTAL"

probe_one() {
    local gs_url="$1"
    # 產生 5 分鐘有效期的 signed URL（需服務帳號權限）
    local signed_url
    signed_url=$(gsutil signurl -d 5m -r us-central1 \
        "$GOOGLE_APPLICATION_CREDENTIALS" "$gs_url" 2>/dev/null \
        | tail -1 | awk '{print $NF}')

    # ffprobe 直接讀 HTTPS URL，只抓 metadata
    local probe
    probe=$(ffprobe -v error -select_streams v:0 \
        -show_entries stream=profile,level,pix_fmt \
        -of default=nw=1 \
        "$signed_url" 2>/dev/null | tr '\n' ' ')

    echo "$gs_url | $probe"
}

export -f probe_one

# 並行 audit，輸出到結果檔
xargs -a "$TMP/video-list.txt" -n 1 -P "$PARALLEL" \
    -I {} bash -c 'probe_one "$@"' _ {} \
    > "$TMP/profiles.txt"

# 統計 profile 分布
echo "=== Profile distribution ==="
awk -F'|' '{print $2}' "$TMP/profiles.txt" | sort | uniq -c | sort -rn

# 輸出需要處理的清單
grep 'profile=High' "$TMP/profiles.txt" | awk -F'|' '{print $1}' \
    > "$TMP/todo-list.txt"
echo "To-process: $(wc -l < $TMP/todo-list.txt)"
```

**預期輸出範例**：

```
=== Profile distribution ===
 2950  profile=High level=40 pix_fmt=yuv420p   ← 需要處理
   48  profile=Main level=40 pix_fmt=yuv420p   ← 可跳過（手動測試產生？）
    2  profile=High level=51 pix_fmt=yuv420p   ← 4K 影片，同需處理

To-process: 2952
```

**預估 audit 時間**：3000 支 × 並行 32 / 每支約 2 秒 ffprobe = **~3–5 分鐘**（雲端內網）。

### 5.3 Step 2：Migration 方案比較

| 方案 | 做法 | 數千部量級可行性 | 優點 | 缺點 |
|---|---|---|---|---|
| **A. 直接 transcode（全量）** | 從既有 `.mp4` 重新編碼覆蓋 | ⚠️ 需雲端大量算力 | 不依賴 service state | Double encoding 有品質損失（1080p 5000k 實務肉眼無感，PSNR 降約 0.3 dB）；算力成本高 |
| **B. 從原始素材 re-compile** | 呼叫 `/api/v1/compile` 重跑 | ⚠️ 需 DB 還保留 scene data | 無品質損失 | 需驗證原始 image/audio 還在 GCS；需重跑 pipeline |
| **C. Lazy migration** | 等使用者回報才處理 | ❌ 不治本 | 零工 | 使用者體驗差，Android 8 用戶持續踩雷 |
| **D. 方案 A + 優先級排序（推薦）** | 先 transcode 最常被播放的影片，再處理長尾 | ✅ 最佳 | 快速解決 90% 使用者痛點；可分批 rollout；風險分散 | 需先取得播放次數排序資料 |

**建議方案 D**。理由：

1. **80/20 法則**：學生實務上只看近期課程 / 熱門影片，前 500 支可能已覆蓋 80% 播放量
2. **風險分散**：先處理 50 支 pilot → 驗證 → 500 支 top tier → 其他長尾，每階段可中止或回滾
3. **運算成本可控**：不需要一次跑完 3000 支的數十小時任務
4. **使用者體驗最佳**：熱門影片最快修復，回報量快速下降

### 5.3a 取得影片播放熱度排序

需要從 `student` / `learning-tracking` 的 DB 查詢：

```sql
-- 近 90 天播放次數排序
SELECT resource_id, COUNT(*) as play_count
FROM learning_activity_events
WHERE event_type IN ('video_play', 'video_complete')
  AND created_at > NOW() - INTERVAL '90 days'
GROUP BY resource_id
ORDER BY play_count DESC;
```

將此清單與 audit 產出的 `todo-list.txt` join，排序後分成：

| Tier | 涵蓋 | 處理時機 |
|---|---|---|
| Pilot | Top 50 支 | Day 2 AM（驗證流程） |
| Tier 1 | Top 500 支（約覆蓋 80% 播放量） | Day 2 PM |
| Tier 2 | 501–2000 支 | Day 3 |
| Tier 3（長尾） | 2001+ 支 | Day 4–5（可離峰時段跑） |

### 5.4 Step 3：Re-encode 腳本（方案 D，resumable）

```bash
#!/bin/bash
# re-encode-legacy-videos.sh
# 覆蓋 High Profile 影片為 Main Profile / Level 4.0
# Resumable, idempotent, parallel. 適用於數千部量級。

set -euo pipefail

# --- 設定 ---
BUCKET="gs://baania-generated-videos"                       # TODO: 確認
BACKUP_BUCKET="gs://baania-generated-videos-backup-20260421"  # TODO: 預先建立
TODO_FILE="${1:-/tmp/video-audit/todo-list.txt}"            # audit 產出
PROGRESS_FILE="/tmp/re-encode/progress.log"                  # 已完成清單（resumable）
FAILED_FILE="/tmp/re-encode/failed.log"
TMP="/tmp/re-encode/work"
PARALLEL="${PARALLEL:-8}"  # 8-core VM 建議 8，16-core 建議 16
mkdir -p "$TMP" "$(dirname "$PROGRESS_FILE")"
touch "$PROGRESS_FILE" "$FAILED_FILE"

# --- 過濾掉已處理的 ---
comm -23 <(sort -u "$TODO_FILE") <(sort -u "$PROGRESS_FILE") > "$TMP/remaining.txt"
REMAINING=$(wc -l < "$TMP/remaining.txt")
TOTAL=$(wc -l < "$TODO_FILE")
echo "Remaining: $REMAINING / $TOTAL"

process_one() {
    local url="$1"
    local name
    name=$(basename "$url")
    local local_in="$TMP/${name}.in"
    local local_out="$TMP/${name}.out.mp4"
    local log="$TMP/${name}.log"

    # 重新確認 profile（冪等：已是 Main 就 skip）
    local profile
    profile=$(ffprobe -v error -select_streams v:0 \
        -show_entries stream=profile -of default=nw=1:nk=1 \
        "$(gsutil signurl -d 5m "$GOOGLE_APPLICATION_CREDENTIALS" "$url" \
            | tail -1 | awk '{print $NF}')" 2>/dev/null || echo "unknown")

    if [[ "$profile" == "Main" ]]; then
        echo "SKIP: $url (already Main)"
        echo "$url" >> "$PROGRESS_FILE"
        return 0
    fi

    echo "ENCODE: $url ($profile → Main)"

    # 下載（GCS 內網）
    if ! gsutil cp -q "$url" "$local_in"; then
        echo "$url | download failed" >> "$FAILED_FILE"
        return 1
    fi

    # 備份（若已備份則不重覆）
    if ! gsutil stat "${BACKUP_BUCKET}/${name}" >/dev/null 2>&1; then
        gsutil cp -q "$local_in" "${BACKUP_BUCKET}/${name}"
    fi

    # 重編碼（CRF 18 減少第二次編碼的品質損失）
    if ! ffmpeg -hide_banner -loglevel error -y \
        -i "$local_in" \
        -c:v libx264 \
        -profile:v main -level:v 4.0 \
        -pix_fmt yuv420p \
        -preset slow -crf 18 \
        -c:a aac -profile:a aac_low -b:a 192k \
        -map_metadata 0 \
        -movflags +faststart \
        "$local_out" 2> "$log"; then
        echo "$url | ffmpeg failed (see $log)" >> "$FAILED_FILE"
        rm -f "$local_in" "$local_out"
        return 1
    fi

    # 驗證輸出（sanity check）
    local out_profile
    out_profile=$(ffprobe -v error -select_streams v:0 \
        -show_entries stream=profile -of default=nw=1:nk=1 "$local_out")
    if [[ "$out_profile" != "Main" ]]; then
        echo "$url | output profile = $out_profile, expected Main" >> "$FAILED_FILE"
        rm -f "$local_in" "$local_out"
        return 1
    fi

    # 原子覆蓋（gsutil cp 對同物件是原子操作）
    if ! gsutil cp -q "$local_out" "$url"; then
        echo "$url | upload failed" >> "$FAILED_FILE"
        rm -f "$local_in" "$local_out"
        return 1
    fi

    echo "$url" >> "$PROGRESS_FILE"
    rm -f "$local_in" "$local_out" "$log"
}

export -f process_one
export TMP BACKUP_BUCKET PROGRESS_FILE FAILED_FILE GOOGLE_APPLICATION_CREDENTIALS

xargs -a "$TMP/remaining.txt" -n 1 -P "$PARALLEL" \
    -I {} bash -c 'process_one "$@"' _ {}

echo "=== Summary ==="
echo "Processed: $(wc -l < $PROGRESS_FILE)"
echo "Failed:    $(wc -l < $FAILED_FILE)"
```

#### 執行方式（Cloud Run Job / GCE VM）

```bash
# Tier-based rollout
./re-encode-legacy-videos.sh /tmp/pilot-list.txt      # 先跑 50 支 pilot
./re-encode-legacy-videos.sh /tmp/tier1-top500.txt    # 再跑 top 500
./re-encode-legacy-videos.sh /tmp/tier2-rest.txt      # 最後長尾

# 中斷後重跑：直接再執行相同命令，progress.log 會自動 skip 已完成的
```

### 5.5 執行前 Checklist

- [ ] 確認 GCS bucket 名稱
- [ ] 預先建立 backup bucket（`gsutil mb -l asia-east1 gs://...-backup-20260421`）
- [ ] 先跑 audit 腳本，確認量級
- [ ] 先抽樣轉 1 支，手動 ffprobe 驗證 profile=Main、播放正常
- [ ] 先抽樣在 Android 8 真機驗證
- [ ] 確認前端 / student DB 的 `video_url` 路徑不需改（原地覆蓋）
- [ ] 確認若有 CDN（Cloudflare 等），排程 purge cache
- [ ] 執行環境建議：GCE VM 或 Cloud Run Job（不要用本地，網路 IO 會拖很久）
- [ ] 執行後比對「原始數量」vs「處理成功數量」
- [ ] 保留 backup bucket 至少 30 天再刪除

### 5.6 時間成本粗估

假設 500 支 1080p / 平均 5 分鐘影片：

| 階段 | 時間 |
|---|---|
| ffprobe audit | ~30 分鐘 |
| Transcode（4 並行，每支約 45 秒） | **~1.5 小時** |
| GCS 上下傳（視頻寬） | 內網約 30 分鐘 |

**結論：一個工作天內可完成整個 migration。**

---

## 6. 影響評估

| 面向 | 影響 |
|---|---|
| 檔案大小 | Main vs High 同 CRF 下約 +3–5%（學習影片靜態場景幾乎無差） |
| 編碼時間 | 幾乎無差（profile 不影響編碼速度） |
| 畫質 | Main vs High 在 2500k+ bitrate 的 PSNR 差異 < 0.2 dB，肉眼無感 |
| 既有影片 URL | **不變**（原地覆蓋），前端 / DB 0 改動 |
| 單元測試 | `ffmpeg_test.go` L34-39 建立 `QualityPreset` literal，Go 允許部分欄位不破壞編譯，但建議同步補 Profile/Level |
| 其他 callsite | 需 grep `QualityPreset{` 檢查是否有其他 literal 建構 |

---

## 7. 驗收流程

### 7.1 Unit Tests（TDD）

該 repo CLAUDE.md 明確要求 TDD，建議先補：

```go
// internal/compiler/ffmpeg_test.go
func TestCompiledVideoIsMainProfile(t *testing.T) {
    // Arrange: 準備測試 scene 資料
    // Act: 呼叫 compileVideo 產出測試影片
    // Assert: 用 ffprobe 讀取輸出，驗證
    //   - codec_name == "h264"
    //   - profile == "Main"
    //   - pix_fmt == "yuv420p"
    //   - level <= 51
}
```

### 7.2 手動 ffprobe 驗收

```bash
ffprobe -v error \
  -select_streams v:0 \
  -show_entries stream=codec_name,profile,level,pix_fmt,width,height \
  -of default=nw=1 \
  out/test.mp4
```

**預期輸出**：

```
codec_name=h264
profile=Main
level=40         # 1080p 時
pix_fmt=yuv420p
width=1920
height=1080
```

### 7.3 真機驗證

- Android 8 平板（目標裝置）實際播放 → 必通過
- Android 10+、iOS Safari、Desktop Chrome / Safari / Firefox → 全部仍能正常播放（Main Profile 在這些平台皆支援）
- 回歸測試：VTT 字幕顯示正常、學習追蹤事件（`video_play` / `video_pause` / `video_complete`）仍正常發送

---

## 8. 已排除的候選原因

| 候選原因 | 排除理由 |
|---|---|
| HEVC / H.265 | `ffmpeg.go` 明確用 `libx264` → H.264，非 HEVC |
| moov atom 在檔尾 | 已有 `-movflags +faststart` |
| 容器格式不對 | 輸出 `.mp4`，Android 原生支援 |
| 音訊編碼不對 | 已用 AAC（但沒鎖 aac_low profile，順手補上） |
| Bitrate 過高 | 1080p 5000k 在合理範圍 |

---

## 9. 完整對照的等效 FFmpeg CLI

改完後，`compileVideo` 輸出 1080p 影片的等效命令：

```bash
ffmpeg -y \
  [inputs...] \
  -filter_complex "..." \
  -map "[vout]" -map "[aout]" \
  -c:v libx264 \
  -profile:v main \
  -level:v 4.0 \
  -pix_fmt yuv420p \
  -preset fast \
  -b:v 5000k \
  -c:a aac \
  -profile:a aac_low \
  -b:a 192k \
  -shortest \
  -threads 0 \
  -movflags +faststart \
  output.mp4
```

---

## 10. Rollout 建議順序

1. **Day 1 AM**：改程式碼（Part 1），TDD 補 test，本機驗證
2. **Day 1 PM**：PR + Code Review + Merge + 部署到 dev 環境
3. **Day 1 PM**：Dev 環境產生測試影片，ffprobe + Android 8 真機驗證
4. **Day 2 AM**：部署到 production，之後新影片自動合規
5. **Day 2 PM**：跑 audit 腳本，確認既有影片影響範圍
6. **Day 3**：跑 re-encode 腳本（方案 A），批次覆蓋既有影片
7. **Day 3**：抽樣驗證，purge CDN cache（若有）
8. **Day 3**：通知客服可回覆使用者「已修復，請重新載入」

---

## 11. 參考來源

- [Android Media Platform — Supported Media Formats（官方）](https://developer.android.com/media/platform/supported-formats)
- [Android 8.0 Compatibility Definition Document（官方）](https://source.android.com/docs/compatibility/8.0/android-8.0-cdd)
- [MediaCodecInfo.CodecProfileLevel API reference（官方）](https://developer.android.com/reference/android/media/MediaCodecInfo.CodecProfileLevel)
- [Can I use... MPEG-4/H.264 video format](https://caniuse.com/mpeg4)
- [Browser Video: Codecs, Formats & Hardware Acceleration — helgeklein.com](https://helgeklein.com/blog/browser-video-codecs-formats-hardware-acceleration/)
- [How to optimize videos for web playback using FFmpeg — Mux](https://www.mux.com/articles/optimize-video-for-web-playback-with-ffmpeg)
- [MP4 Faststart: Fix Video Buffering for Web Playback — Convertio](https://convertio.com/mov-to-mp4/faststart-web-video)
- [Much Ado About Not Much (HEVC Support in Android) — Streaming Learning Center](https://streaminglearningcenter.com/codecs/much-ado-not-much-hevc-support-android.html)

---

## 附錄 A：前端現況（背景資料）

### Student App 播放機制

- 檔案：`apps/student/src/components/content/VideoPlayer.tsx` L569-598
- 實作：原生 `<video src={videoUrl}>` + 原生 `<track kind="subtitles">`
- **無第三方影片套件**（無 hls.js / video.js / react-player 等）
- 無 codec 能力偵測 / fallback 機制
- 字幕格式：VTT（獨立檔，不受本次編碼改動影響）

### 其他相關檔案

- `packages/ui/src/components/resource-viewer/video-player-with-quiz.tsx`（共享播放器，相同原生實作）
- `apps/student/src/components/self-study/VideoPlayerModal.tsx`（自學影片彈窗）
- `apps/student/src/components/task-resolver/components/VideoPlayer.tsx`（任務解題器）

### 可選的前端改善（未來考量，不在本次範圍）

- 加入 `video.canPlayType()` 偵測 + 友善錯誤訊息（avoid 靜默失敗）
- 長期考慮引入 HLS（`hls.js`）+ 多品質 / 多 codec manifest

---

## 附錄 B：為什麼選 Main Profile（決策記錄）

| 選項 | 涵蓋 Android 版本 | 壓縮效率 vs Baseline | 決策 |
|---|---|---|---|
| Baseline Profile | 3.0+（所有裝置） | 基準 | ❌ 檔案過大，壓縮效率差 |
| **Main Profile** | **6.0+（2015-10 後）** | **+15–25%** | ✅ 採用 |
| High Profile | 未保證 | +20–30% | ❌ 就是目前的根因 |

**關鍵考量**：

1. 2026 年 Android 5 及以下市佔 < 1%，Main Profile 實質涵蓋 99%+ 在役裝置
2. Main 比 Baseline 壓縮效率好 15–25%，同畫質下檔案更小、傳輸更快
3. Main 比 High 犧牲 < 5% 效率，但換到硬體相容性的關鍵提升
4. **明確放棄**：雜牌白牌 2012 年前出廠教育平板（商業決策已確認接受）

---

**文件版本**：v1.0
**最後更新**：2026-04-21

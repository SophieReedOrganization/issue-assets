# Issue Assets

組織共用的 **公開** 圖片資源庫，用於在 GitHub Issues 中顯示圖片。

> **重要**: 此 repo 必須保持 **public**，否則圖片無法在 Issue 中顯示。

---

## 目錄結構

```
issue-assets/
├── issues/                 # Issue 專用截圖（每個 issue 一個資料夾）
│   ├── 93/
│   │   ├── batch-assign-no-students.png
│   │   └── unassigned-0-students.png
│   ├── 98/
│   │   ├── 01-org-admin-monthly-calendar.png
│   │   └── ...
│   └── {issue-number}/     # 新 issue 按此格式建立
├── gamification/           # 遊戲化系統產品素材（頭像框、徽章）
│   ├── frames/
│   └── badges/
└── screenshots/            # 舊截圖（歷史遺留，新截圖請放 issues/）
```

### 規則

1. **Issue 截圖** → `issues/{issue-number}/` 資料夾
2. **產品素材**（徽章、頭像框等）→ 對應產品資料夾（如 `gamification/`）
3. **不要**把 issue 截圖放在 `screenshots/` 或根目錄

---

## 使用方式

### 1. 上傳圖片

```bash
# 建立 issue 資料夾並放入截圖
mkdir -p issues/123
cp ~/screenshot.png issues/123/description-of-content.png

# 提交
git add issues/123/
git commit -m "Add screenshots for issue #123"
git push
```

### 2. 在 Issue 中引用

URL 格式：
```
https://raw.githubusercontent.com/SophieReedOrganization/issue-assets/main/issues/{number}/{filename}
```

Markdown：
```markdown
![描述](https://raw.githubusercontent.com/SophieReedOrganization/issue-assets/main/issues/98/01-org-admin-monthly-calendar.png)
```

---

## 命名規範

### Issue 截圖

- 檔名：`{順序}-{簡短描述}.png`（小寫、連字號分隔）
- 範例：`01-org-admin-monthly-calendar.png`、`02-student-daily-tasks.png`

### 產品素材

- 檔名：`{類型}_{名稱}.png`（小寫、底線分隔）
- 範例：`frame_default.png`、`badge_task_10.png`

---

## 圖片規格

| 用途 | 建議尺寸 | 格式 |
|------|----------|------|
| Issue 截圖 | 原尺寸或 ≤1200px 寬 | PNG/JPG |
| 頭像框 | 256x256 px | PNG（透明背景） |
| 徽章 | 128x128 px | PNG（透明背景） |

---

## 注意事項

1. **不要放敏感資料** — 此 repo 是公開的
2. **壓縮圖片** — 大截圖建議壓縮後上傳
3. **定期清理** — 移除已關閉 issue 中不再需要的截圖

---

## 相關連結

- [Product-Planning Issues](https://github.com/SophieReedOrganization/Product-Planning/issues)
- [GitHub Project #8](https://github.com/orgs/SophieReedOrganization/projects/8)

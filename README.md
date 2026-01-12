# Issue Assets

組織共用的 **公開** 圖片資源庫，用於在 GitHub Issues 中顯示圖片。

> **重要**: 此 repo 必須保持 **public**，否則圖片無法在 Issue 中顯示。

---

## 使用方式

### 1. 上傳圖片

將圖片放到對應的資料夾：

```
issue-assets/
├── gamification/          # 遊戲化系統素材
│   ├── frames/            # 頭像框
│   └── badges/            # 徽章
├── screenshots/           # 截圖（Bug 回報、功能展示）
├── ui-mockups/            # UI 設計稿
├── diagrams/              # 架構圖、流程圖
└── [project-name]/        # 其他專案專用資料夾
```

### 2. 取得圖片 URL

圖片上傳後，使用以下 URL 格式：

```
https://raw.githubusercontent.com/SophieReedOrganization/issue-assets/main/{path}/{filename}
```

**範例：**
```
https://raw.githubusercontent.com/SophieReedOrganization/issue-assets/main/gamification/frames/frame_default.png
```

### 3. 在 Issue 中使用

```markdown
![描述文字](https://raw.githubusercontent.com/SophieReedOrganization/issue-assets/main/gamification/frames/frame_default.png)
```

---

## 圖片規格建議

| 用途 | 建議尺寸 | 格式 | 說明 |
|------|----------|------|------|
| 頭像框 | 256x256 px | PNG | 透明背景 |
| 徽章 | 128x128 px | PNG | 透明背景 |
| 截圖 | 原尺寸或 1200px 寬 | PNG/JPG | 壓縮後上傳 |
| UI Mockup | 原尺寸 | PNG | 保留細節 |
| 流程圖 | 依內容 | PNG/SVG | SVG 可縮放 |

---

## 目錄結構

```
.
├── README.md
├── gamification/           # 遊戲化獎勵系統
│   ├── frames/             # 頭像框 (31 個)
│   │   ├── frame_default.png
│   │   ├── frame_task_bronze.png
│   │   └── ...
│   └── badges/             # 徽章 (64 個)
│       ├── task_10.png
│       ├── exam_5.png
│       └── ...
├── screenshots/            # 截圖
├── ui-mockups/             # UI 設計稿
└── diagrams/               # 架構圖
```

---

## 注意事項

1. **不要放敏感資料** - 此 repo 是公開的
2. **壓縮圖片** - 建議使用工具壓縮後再上傳
3. **命名規範** - 使用小寫、底線分隔，如 `feature_login_flow.png`
4. **定期清理** - 移除不再使用的圖片

---

## 快速上傳指令

```bash
# 複製圖片到對應資料夾
cp /path/to/image.png ./screenshots/

# 提交
git add .
git commit -m "feat: Add screenshot for issue #XX"
git push
```

---

## 相關連結

- [Product-Planning Issues](https://github.com/SophieReedOrganization/Product-Planning/issues)
- [GitHub Project #8](https://github.com/orgs/SophieReedOrganization/projects/8)

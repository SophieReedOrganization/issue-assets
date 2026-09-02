# 低年級注音破音字 × 教育部《國語辭典簡編本》全量比對（2026-09-02，字型層驗證版）

驗證方法：直接解開學生端注音字型 `BpmfZihiKaiStd-Regular.ttf`（cmap + cmap format 14 IVS + glyf 複合元件），取得每個字的預設讀音與各變體讀音；對簡編本每條多字詞目，產生插碼字串後**重新解碼**，必須逐音節等於簡編本「注音一式」才列入。上游讀音表（bpmfvs phonic_table_Z）與字型 13,426 字零差異。另以 PIL 用同一字型渲染 19 詞抽驗。

| 檔案 | 內容 |
|---|---|
| `zhuyin-fix-table-20260902.csv` | **2,637 條**可直接修的詞目（含 40 條兒化詞）：詞目／簡編本注音一式／目前顯示／插碼後字串／碼點／哪個字用第幾讀音。每條已解碼驗證。 |
| `zhuyin-fix-table-20260902.json` | 同上，`{詞目: 插碼後字串}`，可直接當詞表載入 |
| `zhuyin-unfixable-20260902.csv` | **41 條**字型沒有簡編本讀音的詞（要改字型才修得了） |
| `zhuyin-multi-reading-decision-20260902.csv` | **101 條**簡編本有兩種以上讀音的詞：67 條目前已是主讀音、33 條需人工拍板（附建議與釋義） |
| `zhuyin-verify-20260902.py` | 驗證腳本。輸入：簡編本開放資料 xlsx、bpmfvs `phonic_table_Z.txt`、字型 ttf |

插碼規則：字後接 `U+E01E0+k` 顯示第 k 個讀音（k≥1）；`U+E01E0` 為無注音裸字。

資料來源：教育部《國語辭典簡編本》2014_20260626 開放資料，「創用 CC-姓名標示-禁止改作 3.0 臺灣」（https://language.moe.gov.tw/001/Upload/Files/site_content/M0001/respub/index.html）；字型讀音表 ButTaiwan/bpmfvs（Apache 2.0）。

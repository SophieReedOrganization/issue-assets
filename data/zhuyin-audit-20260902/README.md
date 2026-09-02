# 低年級注音破音字 × 教育部《國語辭典簡編本》全量比對（2026-09-02）

- `zhuyin-concised-vs-font-mismatch-20260902.csv` — 簡編本多字詞目中，學生端注音字型（ㄅ字嗨注音標楷 v1.501）預設讀音與簡編本不一致的 2,640 條。欄位：詞目／簡編本注音／字型目前顯示／差異（字:字型→簡編本(修法)）／修法（IVS可修＝正確讀音已在字型內，`IVS+k` 對應 U+E01E0+k；字型缺讀音）／備註。
- `zhuyin-single-char-primary-mismatch-20260902.csv` — 單字首讀音與字型預設不同的 151 字（參考用，單字無語境不宜直接套）。
- `zhuyin-audit-20260902.py` — 比對腳本。輸入：簡編本開放資料 `dict_concised_2014_20260626.xlsx`、ButTaiwan/bpmfvs `phonetic/phonic_table_Z.txt`、字型 ttf。

資料來源：教育部《國語辭典簡編本》2014_20260626 開放資料，採「創用 CC-姓名標示-禁止改作 3.0 臺灣」授權（https://language.moe.gov.tw/001/Upload/Files/site_content/M0001/respub/index.html）；字型讀音表來自 ButTaiwan/bpmfvs（Apache 2.0）。

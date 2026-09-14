# Heading Word Count

在一個獨立的側邊面板中，依 **H1–H6 標題**逐節顯示字數。中文逐字計算、英文依詞計算，並且可以自訂計算規則。

> Shows a per-section word count for every **H1–H6 heading** in a dedicated outline panel. Counts Chinese (CJK) characters one-by-one and English by words, with configurable rules.

## 功能特色 · Features

- 📊 **分章節字數**：每個 H1–H6 標題後面顯示該標題底下的字數。
- 🌏 **中英雙語**：中文（含日文、韓文）方塊字逐字計算；英文／西文依單字計算（`don't`、`well-known` 都算一個字）。
- ⚙️ **可自訂規則**：
  - 計算範圍：含子章節（H1 包含其下全部）／只算本節。
  - 中文標點是否計入（預設不計）。
  - 是否排除程式碼區塊、行內程式碼。
  - 顯示到第幾層標題（H1–H6）。
  - 是否顯示全文總字數。
- 🖱️ **點擊跳轉**：點面板上的標題，直接跳到筆記中對應位置。
- ⚡ **即時更新**：邊打字邊更新。

## 計算規則 · Counting rules

| 內容 | 如何計算 |
| --- | --- |
| 中文／日文／韓文方塊字 | 每個字算 1 |
| 中文標點（，。、「」！？…） | 預設不算，可在設定開啟後每個算 1 |
| 英文／西文 | 依單字計算，縮寫與連字號視為一個字 |
| 數字 | 連續數字算一個字 |
| 程式碼區塊 / 行內程式碼 | 預設排除（可關閉） |
| YAML frontmatter | 一律排除 |
| 連結 / 圖片 | 只計顯示文字，網址與圖片不算 |
| 標題文字本身 | 不計入該節字數（只算標題「底下」的內容） |

## 使用方式 · Usage

1. 啟用外掛後，點左側功能區的清單圖示，或用命令面板執行「**開啟字數大綱面板**」。
2. 面板會出現在右側，開啟任一 Markdown 筆記即會顯示標題與字數。
3. 到「設定 → Heading Word Count」調整計算規則。

## 手動安裝 · Manual install

把 `main.js`、`manifest.json`、`styles.css` 三個檔案放到你的 vault 的
`<vault>/.obsidian/plugins/heading-word-count/` 資料夾內，重新啟動 Obsidian，
然後到「設定 → 第三方外掛」啟用即可。

## 開發 · Development

```bash
npm install
npm run dev     # 監看模式
npm run build   # 型別檢查 + 產出 main.js
```

## 授權 · License

MIT © 2026 Cem Yang

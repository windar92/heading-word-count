# Heading Word Count

Heading Word Count shows a per-section word count for every **H1–H6 heading** in a dedicated outline panel. It counts Chinese (CJK) characters one by one and English by words, and lets you configure how punctuation is counted. It is built for people who write in Chinese, English, or a mix of both, and want to see how long each section of a note is at a glance.

## Features

- **Per-heading counts** — every H1–H6 heading shows the word count of the text under it, arranged as an outline tree.
- **Chinese and English aware** — each Chinese/Japanese/Korean character counts as one word; English and other Latin text is counted by words (`don't` and `well-known` each count as one word).
- **Configurable rules:**
  - Counting scope: include sub-sections (an H1 includes everything beneath it) or count only the section's own text.
  - Whether Chinese punctuation is counted (off by default).
  - Whether to exclude fenced code blocks and inline code.
  - How many heading levels to display (H1–H6).
  - Whether to show a whole-note total.
- **Collapsible outline** — one toolbar button cycles collapse-all / expand-all, and each section can be folded individually.
- **Per-file auto-scroll** — mark a note with the ↓ button so it always opens scrolled to the end; handy for continuing a long draft. Only marked notes behave this way.
- **Click to jump** — click a heading in the panel to jump to it in the note.
- **Live updates** — counts update as you type.

## Counting rules

| Content | How it is counted |
| --- | --- |
| Chinese / Japanese / Korean characters | 1 each |
| Chinese punctuation (，。、「」！？…) | not counted by default; optionally 1 each |
| English / Latin words | by word; contractions and hyphenated words count as one |
| Numbers | a run of digits counts as one word |
| Code blocks / inline code | excluded by default (configurable) |
| YAML frontmatter | always excluded |
| Links / images | only display text is counted; URLs and images are not |
| The heading text itself | not counted toward its section (only the content *below* the heading) |

## Usage

1. After enabling the plugin, click the list icon in the left ribbon, or run the command **"Open the word-count outline panel"** from the command palette.
2. The panel opens on the right. Open any Markdown note to see its headings and word counts.
3. Adjust the counting rules in **Settings → Heading Word Count**.

## Manual installation

Copy `main.js`, `manifest.json`, and `styles.css` into your vault's
`<vault>/.obsidian/plugins/heading-word-count/` folder, restart Obsidian, then enable the plugin under **Settings → Community plugins**.

## Development

```bash
npm install
npm run dev     # watch mode
npm run build   # type-check + produce main.js
```

## License

MIT © 2026 Cem Yang

---

## 中文說明

Heading Word Count 會在一個獨立的側邊面板中，依 **H1–H6 標題**逐節顯示字數。中文逐字計算、英文依詞計算，並且可以自訂計算規則。

**功能**

- 每個 H1–H6 標題後面顯示該標題底下的字數，排成大綱樹狀。
- 中文（含日文、韓文）方塊字逐字計算；英文／西文依單字計算。
- 可自訂：計算範圍（含子章節／只算本節）、中文標點是否計入（預設不計）、是否排除程式碼、顯示到第幾層、是否顯示全文總字數。
- 大綱可收合：頂端一顆按鈕循環「全部收合／全部展開」，每段也能單獨收合。
- 逐檔案自動捲到底：用 ↓ 按鈕標記某篇筆記，之後打開它就自動捲到最底、游標停在文末，方便接著寫長稿（只有被標記的檔案會這樣）。
- 點面板上的標題可直接跳到筆記對應位置；邊打字邊即時更新。

**使用方式**：啟用後點左側功能區的清單圖示，或用命令面板執行「開啟字數大綱面板」，面板會出現在右側。到「設定 → Heading Word Count」調整規則。

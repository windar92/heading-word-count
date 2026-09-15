/*
 * i18n.ts — UI strings for English / 中文, with detection of Obsidian's language.
 * No Obsidian imports; only touches the global `window` for the language setting.
 */

export type Lang = "en" | "zh";
export type LangPref = "auto" | Lang;

export interface Strings {
	panelTitle: string;
	ribbonTooltip: string;
	cmdOpen: string;
	emptyNoFile: string;
	emptyNoHeadings: string;
	untitled: string;
	docTotal: (n: string) => string;
	tipCollapseAll: string;
	tipExpandAll: string;
	tipAutoOn: string;
	tipAutoOff: string;

	setLangName: string;
	setLangDesc: string;
	optAuto: string;

	setScopeName: string;
	setScopeDesc: string;
	optTotal: string;
	optOwn: string;

	setPunctName: string;
	setPunctDesc: string;

	setExCodeName: string;
	setExCodeDesc: string;

	setExInlineName: string;
	setExInlineDesc: string;

	setDepthName: string;
	setDepthDesc: string;

	setShowTotalName: string;
	setShowTotalDesc: string;

	setAutoScrollName: string;
	setAutoScrollDesc: string;
	autoListLabel: string;
	removeBtn: string;
}

const EN: Strings = {
	panelTitle: "Word Count Outline",
	ribbonTooltip: "Word Count Outline",
	cmdOpen: "Open the word-count outline panel",
	emptyNoFile: "Open a Markdown note to see the word-count outline.",
	emptyNoHeadings: "This note has no headings (H1–H6).",
	untitled: "(untitled)",
	docTotal: (n) => `${n} words total`,
	tipCollapseAll: "Collapse all",
	tipExpandAll: "Expand all",
	tipAutoOn: "This file: auto-scroll to bottom on open (click to turn off)",
	tipAutoOff: "This file: auto-scroll to bottom on open (click to turn on)",

	setLangName: "Interface language",
	setLangDesc:
		'Language for this plugin\'s UI. "Auto" follows Obsidian\'s own language setting. Command and ribbon labels update after a reload.',
	optAuto: "Auto (follow Obsidian)",

	setScopeName: "Counting scope",
	setScopeDesc:
		"Whether each heading's count includes all of its sub-sections, or only its own text up to the next heading.",
	optTotal: "Include sub-sections (an H1 includes everything beneath it)",
	optOwn: "Own section only (excludes sub-sections)",

	setPunctName: "Count Chinese punctuation",
	setPunctDesc:
		"When on, Chinese punctuation (，。、！？「」etc.) each counts as 1. Chinese characters are always counted one-by-one regardless of this.",

	setExCodeName: "Exclude code blocks",
	setExCodeDesc: "Do not count text inside ``` fenced code blocks.",

	setExInlineName: "Exclude inline code",
	setExInlineDesc: "Do not count text inside `inline code`.",

	setDepthName: "Show headings down to level",
	setDepthDesc:
		"Only show headings down to this level (1 = H1 only, 6 = show all).",

	setShowTotalName: "Show whole-note total",
	setShowTotalDesc: "Show the note's total word count at the top of the panel.",

	setAutoScrollName: "Auto-scroll to bottom on open (per file)",
	setAutoScrollDesc:
		"This is a per-file setting: in the outline panel, click the down button (⌄⌄) to mark the current note as auto-scroll-to-bottom. Only marked notes do this; others behave normally.",
	autoListLabel: "Files currently set to auto-scroll to bottom:",
	removeBtn: "Remove",
};

const ZH: Strings = {
	panelTitle: "字數大綱",
	ribbonTooltip: "字數大綱",
	cmdOpen: "開啟字數大綱面板",
	emptyNoFile: "開啟一份 Markdown 筆記以顯示字數大綱。",
	emptyNoHeadings: "這份筆記沒有標題 (H1–H6)。",
	untitled: "(無標題)",
	docTotal: (n) => `全文 ${n} 字`,
	tipCollapseAll: "全部收合",
	tipExpandAll: "全部展開",
	tipAutoOn: "此檔案：開啟時自動捲到底（點擊關閉）",
	tipAutoOff: "此檔案：開啟時自動捲到底（點擊開啟）",

	setLangName: "介面語言",
	setLangDesc:
		"外掛介面要用的語言。「自動」會跟隨 Obsidian 本身的語言設定。指令與功能區的名稱會在重新載入後更新。",
	optAuto: "自動（跟隨 Obsidian）",

	setScopeName: "計算範圍",
	setScopeDesc:
		"每個標題的字數要「包含底下所有子章節」，還是「只算到下一個標題之前」。",
	optTotal: "含子章節（H1 包含其下所有內容）",
	optOwn: "只算本節（不含子章節）",

	setPunctName: "計入中文標點符號",
	setPunctDesc:
		"開啟後，中文標點（，。、！？「」等）也會計為 1 個字。中文方塊字一律逐字計算，不受此項影響。",

	setExCodeName: "排除程式碼區塊",
	setExCodeDesc: "不計算 ``` 圍欄程式碼區塊內的文字。",

	setExInlineName: "排除行內程式碼",
	setExInlineDesc: "不計算 `行內程式碼` 內的文字。",

	setDepthName: "顯示到第幾層標題",
	setDepthDesc: "只在面板中顯示到指定層級的標題（1 = 只顯示 H1，6 = 全部顯示）。",

	setShowTotalName: "顯示全文總字數",
	setShowTotalDesc: "在面板頂端顯示整份筆記的總字數。",

	setAutoScrollName: "開啟時自動捲到底（依檔案）",
	setAutoScrollDesc:
		"此功能是「逐檔案」設定：在字數大綱面板頂端點「⌄⌄」按鈕，把目前這份筆記標記為「開啟時自動捲到底」。只有被標記的檔案會這樣，其它檔案照常。",
	autoListLabel: "目前已標記自動捲到底的檔案：",
	removeBtn: "移除",
};

/** Detect Obsidian's UI language from its stored setting. */
export function detectObsidianLang(): Lang {
	try {
		const l = window.localStorage.getItem("language") || "";
		return l.toLowerCase().startsWith("zh") ? "zh" : "en";
	} catch (e) {
		return "en";
	}
}

/** Resolve the effective strings for a preference. */
export function getStrings(pref: LangPref): Strings {
	const lang: Lang = pref === "auto" ? detectObsidianLang() : pref;
	return lang === "zh" ? ZH : EN;
}

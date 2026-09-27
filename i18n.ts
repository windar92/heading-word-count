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

	setHelpName: string;
	setHelpDesc: string;
	setHelpBtn: string;

	cmdShowHelp: string;
	helpTitle: string;
	helpIntro: string;
	helpSections: { heading: string; lines: string[] }[];
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

	setHelpName: "Help",
	setHelpDesc: "Show the usage guide again.",
	setHelpBtn: "Open guide",

	cmdShowHelp: "Show Heading Word Count help",
	helpTitle: "Welcome to Heading Word Count",
	helpIntro:
		"This plugin shows a live word count next to every heading (H1–H6) in your notes. Here's how to use it.",
	helpSections: [
		{
			heading: "Open the outline panel",
			lines: [
				"Click the list icon in the left ribbon, or run \"Open the word-count outline panel\" from the command palette (Ctrl/Cmd+P).",
			],
		},
		{
			heading: "How counting works",
			lines: [
				"Chinese characters are always counted one by one.",
				"Chinese punctuation (，。、！？「」etc.) is NOT counted by default — turn it on in Settings if you want it.",
				"English text is counted by word, the normal way.",
				"Each heading's badge can show its own count, or the total including everything beneath it — switch this in Settings under \"Counting scope\".",
			],
		},
		{
			heading: "Toolbar buttons",
			lines: [
				"The first button collapses or expands the whole outline (one button, click again to reverse). It's dimmed when the note has no nested headings to fold.",
				"The second button (⌄⌄) turns on \"auto-scroll to bottom on open\" for the current file only — handy for a daily log or journal you always want to jump straight to the bottom of.",
			],
		},
		{
			heading: "Settings",
			lines: [
				"Open Settings → Community plugins → Heading Word Count to change the interface language, counting rules, how many heading levels to show, and to review or remove the list of auto-scroll files.",
			],
		},
		{
			heading: "Need this again later?",
			lines: [
				"Run the command \"Show Heading Word Count help\", or click the button in this plugin's settings tab.",
			],
		},
	],
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

	setHelpName: "使用說明",
	setHelpDesc: "重新看一次外掛的使用說明。",
	setHelpBtn: "開啟說明",

	cmdShowHelp: "顯示 Heading Word Count 使用說明",
	helpTitle: "歡迎使用 Heading Word Count",
	helpIntro:
		"這個外掛會在你筆記裡每個標題（H1–H6）旁邊即時顯示字數。以下是使用方式。",
	helpSections: [
		{
			heading: "開啟大綱面板",
			lines: [
				"點左側功能區的清單圖示，或用指令面板（Ctrl/Cmd+P）執行「開啟字數大綱面板」。",
			],
		},
		{
			heading: "計算規則",
			lines: [
				"中文字一律逐字計算。",
				"中文標點（，。、！？「」等）預設不計入，可以到設定裡打開。",
				"英文照一般方式逐字（word）計算。",
				"每個標題旁的數字，可以顯示「只算本節」或「含所有子章節」——在設定的「計算範圍」裡切換。",
			],
		},
		{
			heading: "工具列按鈕",
			lines: [
				"第一顆按鈕是「全部收合／全部展開」，同一顆循環切換即可。如果這篇筆記沒有巢狀標題可收合，按鈕會變暗。",
				"第二顆按鈕（⌄⌄）是「開啟時自動捲到底」，只針對目前這個檔案——很適合像日記、流水帳這種你總是想直接跳到最後面的筆記。",
			],
		},
		{
			heading: "設定",
			lines: [
				"到「設定 → 社群外掛 → Heading Word Count」可以調整介面語言、計算規則、要顯示到第幾層標題，也能查看或移除目前設定自動捲到底的檔案清單。",
			],
		},
		{
			heading: "之後想再看一次？",
			lines: [
				"隨時執行指令「顯示 Heading Word Count 使用說明」，或到外掛設定頁按下說明按鈕即可。",
			],
		},
	],
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

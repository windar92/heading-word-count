/*
 * counter.ts — pure counting & parsing logic (no Obsidian imports).
 * Kept dependency-free so it can be unit-tested directly with Node.
 */

export interface CountOptions {
	/** 中文標點是否計入字數 */
	countChinesePunctuation: boolean;
	/** 排除圍欄程式碼區塊 ```...``` / ~~~...~~~ */
	excludeCodeBlocks: boolean;
	/** 排除行內程式碼 `code` */
	excludeInlineCode: boolean;
}

export const DEFAULT_COUNT_OPTIONS: CountOptions = {
	countChinesePunctuation: false,
	excludeCodeBlocks: true,
	excludeInlineCode: true,
};

export interface HeadingNode {
	level: number; // 1..6
	title: string; // cleaned display text
	line: number; // 0-based line index of the heading line
	ownCount: number; // words in this heading's direct body (excludes subsections)
	totalCount: number; // words including all descendant subsections
}

export interface DocumentCount {
	headings: HeadingNode[];
	documentTotal: number; // whole-note body word count (excludes heading text)
}

// ---------------------------------------------------------------------------
// Character classes
// ---------------------------------------------------------------------------

// CJK "characters" — each counts as one word.
// Han (incl. Ext-A) + compatibility ideographs + Hiragana + Katakana + Hangul.
const CJK_CHARS =
	/[㐀-䶿一-鿿豈-﫿぀-ゟ゠-ヿ가-힯]/g;

// CJK / fullwidth punctuation. Deliberately excludes:
//   　 (ideographic space — treated as whitespace)
//   ０-９ fullwidth digits, Ａ-Ｚ fullwidth A-Z, ａ-ｚ fullwidth a-z
// so those flow into the Latin-word bucket instead.
const CJK_PUNCT =
	/[、-〿︐-︙︰-﹏！-／：-＠［-｀｛-､–—‘’“”…]/g;

// Latin / western words: letters & digits (incl. accented + fullwidth latin/digits),
// joined by internal apostrophes/hyphens (don't, well-known).
const LATIN_WORD =
	/[0-9A-Za-zÀ-ɏͰ-ϿЀ-ӿ０-９Ａ-Ｚａ-ｚ]+(?:['’’\-][0-9A-Za-zÀ-ɏͰ-ϿЀ-ӿ０-９Ａ-Ｚａ-ｚ]+)*/g;

const ATX_HEADING = /^(#{1,6})\s+(.*\S)\s*$/;
const BARE_URL = /https?:\/\/[^\s)]+/g;

// ---------------------------------------------------------------------------
// Text cleaning
// ---------------------------------------------------------------------------

/** Strip markup that should not contribute to the word count. */
function cleanForCounting(text: string, opts: CountOptions): string {
	let t = text;

	// Obsidian comments %% ... %% and HTML comments <!-- ... -->
	t = t.replace(/%%[\s\S]*?%%/g, " ");
	t = t.replace(/<!--[\s\S]*?-->/g, " ");

	// Inline code `code`
	if (opts.excludeInlineCode) {
		t = t.replace(/`[^`]*`/g, " ");
	}

	// Images: ![alt](url) and embeds ![[...]] — drop entirely (alt text not counted)
	t = t.replace(/!\[[^\]]*\]\([^)]*\)/g, " ");
	t = t.replace(/!\[\[[^\]]*\]\]/g, " ");

	// Wikilinks [[target|display]] -> display, [[target]] -> target
	t = t.replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, "$2");
	t = t.replace(/\[\[([^\]]*)\]\]/g, "$1");

	// Markdown links [text](url) -> text
	t = t.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");

	// Bare URLs
	t = t.replace(BARE_URL, " ");

	return t;
}

/**
 * Count words in a plain text block according to the options.
 * CJK chars: 1 each. CJK punctuation: 1 each (optional). Latin: 1 per word token.
 */
export function countText(text: string, opts: CountOptions): number {
	const cleaned = cleanForCounting(text, opts);
	const cjk = (cleaned.match(CJK_CHARS) || []).length;
	const punct = opts.countChinesePunctuation
		? (cleaned.match(CJK_PUNCT) || []).length
		: 0;
	const latin = (cleaned.match(LATIN_WORD) || []).length;
	return cjk + punct + latin;
}

// ---------------------------------------------------------------------------
// Document parsing
// ---------------------------------------------------------------------------

/** Remove YAML frontmatter (--- ... ---) at the very top; returns remaining lines. */
function stripFrontmatter(lines: string[]): string[] {
	if (lines.length > 0 && lines[0].trim() === "---") {
		for (let i = 1; i < lines.length; i++) {
			if (lines[i].trim() === "---") {
				return lines.slice(i + 1);
			}
		}
	}
	return lines;
}

/** Clean a heading's raw text for display (strip markdown, links, tags of markup). */
function cleanHeadingTitle(raw: string): string {
	let t = raw.replace(/\s+#+\s*$/, ""); // trailing closing #'s
	t = t.replace(/`([^`]*)`/g, "$1");
	t = t.replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, "$2");
	t = t.replace(/\[\[([^\]]*)\]\]/g, "$1");
	t = t.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
	t = t.replace(/(\*\*|__|\*|_|~~|==)/g, "");
	return t.trim();
}

/**
 * Parse markdown into headings with per-section word counts.
 */
export function analyzeDocument(
	content: string,
	opts: CountOptions
): DocumentCount {
	const rawLines = content.split(/\r?\n/);
	const lines = stripFrontmatter(rawLines);
	// Offset so reported line numbers map back to the original document.
	const lineOffset = rawLines.length - lines.length;

	interface Raw {
		level: number;
		title: string;
		line: number;
		bodyLines: string[];
	}
	const rawHeadings: Raw[] = [];
	let current: Raw | null = null;
	const preamble: string[] = [];

	let inFence = false;
	let fenceMarker = "";

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const trimmed = line.trim();

		// Fenced code block tracking (``` or ~~~, optionally with a language)
		const fenceMatch = trimmed.match(/^(`{3,}|~{3,})/);
		if (fenceMatch) {
			const marker = fenceMatch[1][0];
			if (!inFence) {
				inFence = true;
				fenceMarker = marker;
			} else if (marker === fenceMarker) {
				inFence = false;
				fenceMarker = "";
			}
			if (!opts.excludeCodeBlocks) {
				(current ? current.bodyLines : preamble).push(line);
			}
			continue;
		}

		if (inFence) {
			if (!opts.excludeCodeBlocks) {
				(current ? current.bodyLines : preamble).push(line);
			}
			continue;
		}

		const h = line.match(ATX_HEADING);
		if (h) {
			current = {
				level: h[1].length,
				title: cleanHeadingTitle(h[2]),
				line: i + lineOffset,
				bodyLines: [],
			};
			rawHeadings.push(current);
			continue;
		}

		(current ? current.bodyLines : preamble).push(line);
	}

	const headings: HeadingNode[] = rawHeadings.map((r) => ({
		level: r.level,
		title: r.title,
		line: r.line,
		ownCount: countText(r.bodyLines.join("\n"), opts),
		totalCount: 0,
	}));

	// totalCount = ownCount + sum of ownCounts of following headings with a
	// strictly deeper level, until a heading of level <= this one is reached.
	for (let i = 0; i < headings.length; i++) {
		let sum = headings[i].ownCount;
		for (let j = i + 1; j < headings.length; j++) {
			if (headings[j].level <= headings[i].level) break;
			sum += headings[j].ownCount;
		}
		headings[i].totalCount = sum;
	}

	const bodyOnly = countText(preamble.join("\n"), opts);
	const documentTotal =
		bodyOnly + headings.reduce((acc, h) => acc + h.ownCount, 0);

	return { headings, documentTotal };
}

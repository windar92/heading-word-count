import {
	App,
	ItemView,
	MarkdownView,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
	WorkspaceLeaf,
	debounce,
	setIcon,
} from "obsidian";

import {
	analyzeDocument,
	CountOptions,
	DEFAULT_COUNT_OPTIONS,
	DocumentCount,
	HeadingNode,
} from "./counter";

import { getStrings, LangPref, Strings } from "./i18n";

export const VIEW_TYPE = "heading-word-count-outline";

interface PluginSettings extends CountOptions {
	/** 徽章顯示 'total'（含子章節）或 'own'（僅本節） */
	countMode: "total" | "own";
	/** 是否在面板頂端顯示全文總字數 */
	showDocumentTotal: boolean;
	/** 顯示到第幾層標題 (1-6) */
	maxDepth: number;
	/** 開啟時自動捲到底的檔案路徑清單（只針對這些檔案） */
	autoScrollFiles: string[];
	/** 介面語言：auto / zh / en */
	uiLanguage: LangPref;
}

const DEFAULT_SETTINGS: PluginSettings = {
	...DEFAULT_COUNT_OPTIONS,
	countMode: "total",
	showDocumentTotal: true,
	maxDepth: 6,
	autoScrollFiles: [],
	uiLanguage: "auto",
};

interface TreeNode extends HeadingNode {
	children: TreeNode[];
}

/** Build a nested tree from the flat heading list, based on level. */
function buildTree(headings: HeadingNode[]): TreeNode[] {
	const roots: TreeNode[] = [];
	const stack: TreeNode[] = [];
	for (const h of headings) {
		const node: TreeNode = { ...h, children: [] };
		while (stack.length && stack[stack.length - 1].level >= h.level) {
			stack.pop();
		}
		if (stack.length) stack[stack.length - 1].children.push(node);
		else roots.push(node);
		stack.push(node);
	}
	return roots;
}

/** Collect the line numbers of every node that has children. */
function collectParentLines(nodes: TreeNode[], out: number[]): void {
	for (const n of nodes) {
		if (n.children.length) {
			out.push(n.line);
			collectParentLines(n.children, out);
		}
	}
}

// ===========================================================================
// Plugin
// ===========================================================================

export default class HeadingWordCountPlugin extends Plugin {
	settings: PluginSettings;
	t: Strings;

	async onload() {
		await this.loadSettings();

		this.registerView(VIEW_TYPE, (leaf) => new HeadingWordCountView(leaf, this));

		this.addRibbonIcon("list-ordered", this.t.ribbonTooltip, () => {
			void this.activateView();
		});

		this.addCommand({
			id: "open-outline",
			name: this.t.cmdOpen,
			callback: () => {
				void this.activateView();
			},
		});

		this.addSettingTab(new HeadingWordCountSettingTab(this.app, this));

		// Refresh triggers
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () => this.refreshViews())
		);
		this.registerEvent(
			this.app.workspace.on("file-open", (file) => {
				this.refreshViews();
				if (file && this.settings.autoScrollFiles.includes(file.path)) {
					// Editor needs a tick to be ready after opening.
					window.setTimeout(() => {
						const view =
							this.app.workspace.getActiveViewOfType(MarkdownView);
						if (view && view.file && view.file.path === file.path) {
							this.scrollEditorToBottom(view);
						}
					}, 80);
				}
			})
		);

		const debouncedRefresh = debounce(() => this.refreshViews(), 400, false);
		this.registerEvent(
			this.app.workspace.on("editor-change", () => debouncedRefresh())
		);

		this.app.workspace.onLayoutReady(() => this.refreshViews());
	}

	onunload() {
		// Leaves are detached automatically by Obsidian for registered views.
	}

	applyLang() {
		this.t = getStrings(this.settings.uiLanguage);
	}

	async loadSettings() {
		const data = (await this.loadData()) as Partial<PluginSettings> | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data ?? {});
		if (!Array.isArray(this.settings.autoScrollFiles)) {
			this.settings.autoScrollFiles = [];
		}
		this.applyLang();
	}

	async saveSettings() {
		this.applyLang();
		await this.saveData(this.settings);
		this.refreshViews();
	}

	scrollEditorToBottom(view: MarkdownView) {
		const editor = view.editor;
		const last = editor.lastLine();
		editor.setCursor({ line: last, ch: editor.getLine(last).length });
		editor.scrollIntoView(
			{ from: { line: last, ch: 0 }, to: { line: last, ch: 0 } },
			true
		);
	}

	refreshViews() {
		this.app.workspace.getLeavesOfType(VIEW_TYPE).forEach((leaf) => {
			const view = leaf.view;
			if (view instanceof HeadingWordCountView) view.render();
		});
	}

	async activateView() {
		const { workspace } = this.app;
		let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];
		if (!leaf) {
			const right = workspace.getRightLeaf(false);
			if (!right) return;
			leaf = right;
			await leaf.setViewState({ type: VIEW_TYPE, active: true });
		}
		await workspace.revealLeaf(leaf);
	}
}

// ===========================================================================
// View
// ===========================================================================

class HeadingWordCountView extends ItemView {
	plugin: HeadingWordCountPlugin;
	/** Collapsed heading lines, keyed by file path. */
	private collapsed: Map<string, Set<number>> = new Map();
	private currentFile: TFile | null = null;
	private currentRoots: TreeNode[] = [];

	constructor(leaf: WorkspaceLeaf, plugin: HeadingWordCountPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return VIEW_TYPE;
	}

	getDisplayText() {
		return this.plugin.t.panelTitle;
	}

	getIcon() {
		return "list-ordered";
	}

	async onOpen() {
		this.render();
	}

	async onClose() {
		this.contentEl.empty();
	}

	private getCollapsedSet(path: string): Set<number> {
		let s = this.collapsed.get(path);
		if (!s) {
			s = new Set();
			this.collapsed.set(path, s);
		}
		return s;
	}

	private getActiveMarkdownFile(): TFile | null {
		const active = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (active && active.file) return active.file;
		const leaves = this.app.workspace.getLeavesOfType("markdown");
		for (const leaf of leaves) {
			const v = leaf.view;
			if (v instanceof MarkdownView && v.file) return v.file;
		}
		return null;
	}

	render() {
		const container = this.contentEl;
		container.addClass("hwc-view");

		const file = this.getActiveMarkdownFile();
		if (!file) {
			container.empty();
			container.createDiv({
				cls: "hwc-empty",
				text: this.plugin.t.emptyNoFile,
			});
			return;
		}

		const activeMd = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (activeMd && activeMd.file === file) {
			this.renderContent(file, activeMd.editor.getValue());
		} else {
			this.app.vault.cachedRead(file).then((content) => {
				this.renderContent(file, content);
			});
		}
	}

	private renderContent(file: TFile, content: string) {
		const container = this.contentEl;
		container.empty();
		this.currentFile = file;

		const t = this.plugin.t;
		const data: DocumentCount = analyzeDocument(content, this.plugin.settings);
		const s = this.plugin.settings;

		// ---- Tree (built first so the header can reflect fold state) ----
		const visible = data.headings.filter((h) => h.level <= s.maxDepth);
		this.currentRoots = buildTree(visible);
		const collapsedSet = this.getCollapsedSet(file.path);
		const parentLines: number[] = [];
		collectParentLines(this.currentRoots, parentLines);
		const allCollapsed =
			parentLines.length > 0 &&
			parentLines.every((l) => collapsedSet.has(l));

		// ---- Header ----
		const header = container.createDiv({ cls: "hwc-header" });
		const titleRow = header.createDiv({ cls: "hwc-titlerow" });
		titleRow.createDiv({ cls: "hwc-filename", text: file.basename });

		const toolbar = titleRow.createDiv({ cls: "hwc-toolbar" });

		// Single button that cycles: collapse all <-> expand all.
		if (parentLines.length > 0) {
			const foldBtn = toolbar.createDiv({ cls: "hwc-btn" });
			setIcon(foldBtn, allCollapsed ? "chevrons-up-down" : "chevrons-down-up");
			foldBtn.setAttribute(
				"aria-label",
				allCollapsed ? t.tipExpandAll : t.tipCollapseAll
			);
			foldBtn.addEventListener("click", () => {
				if (allCollapsed) this.expandAll();
				else this.collapseAll();
			});
		}

		const autoOn = s.autoScrollFiles.includes(file.path);
		const scrollBtn = toolbar.createDiv({
			cls: "hwc-btn" + (autoOn ? " is-active" : ""),
		});
		setIcon(scrollBtn, "chevrons-down");
		scrollBtn.setAttribute("aria-label", autoOn ? t.tipAutoOn : t.tipAutoOff);
		scrollBtn.addEventListener("click", () => void this.toggleAutoScroll(file));

		if (s.showDocumentTotal) {
			header.createDiv({
				cls: "hwc-doctotal",
				text: t.docTotal(formatCount(data.documentTotal)),
			});
		}

		// ---- Tree list ----
		if (visible.length === 0) {
			container.createDiv({
				cls: "hwc-empty",
				text: t.emptyNoHeadings,
			});
			return;
		}

		const list = container.createDiv({ cls: "hwc-list" });
		this.renderNodes(this.currentRoots, list, collapsedSet, file);
	}

	private renderNodes(
		nodes: TreeNode[],
		listEl: HTMLElement,
		collapsedSet: Set<number>,
		file: TFile
	) {
		const s = this.plugin.settings;
		const t = this.plugin.t;
		for (const node of nodes) {
			const hasChildren = node.children.length > 0;
			const isCollapsed = collapsedSet.has(node.line);

			const row = listEl.createDiv({ cls: `hwc-row hwc-h${node.level}` });
			row.style.paddingLeft = `${(node.level - 1) * 14 + 4}px`;

			// Fold toggle (or spacer to keep alignment)
			const fold = row.createSpan({ cls: "hwc-fold" });
			if (hasChildren) {
				setIcon(fold, isCollapsed ? "chevron-right" : "chevron-down");
				fold.addEventListener("click", (e) => {
					e.stopPropagation();
					if (collapsedSet.has(node.line)) collapsedSet.delete(node.line);
					else collapsedSet.add(node.line);
					this.render();
				});
			} else {
				fold.addClass("hwc-fold-empty");
			}

			const count = s.countMode === "total" ? node.totalCount : node.ownCount;
			row.createSpan({ cls: "hwc-title", text: node.title || t.untitled });
			row.createSpan({ cls: "hwc-badge", text: formatCount(count) });

			row.addEventListener("click", () => this.revealHeading(file, node.line));

			if (hasChildren && !isCollapsed) {
				this.renderNodes(node.children, listEl, collapsedSet, file);
			}
		}
	}

	private collapseAll() {
		if (!this.currentFile) return;
		const set = this.getCollapsedSet(this.currentFile.path);
		const lines: number[] = [];
		collectParentLines(this.currentRoots, lines);
		lines.forEach((l) => set.add(l));
		this.render();
	}

	private expandAll() {
		if (!this.currentFile) return;
		this.getCollapsedSet(this.currentFile.path).clear();
		this.render();
	}

	private async toggleAutoScroll(file: TFile) {
		const arr = this.plugin.settings.autoScrollFiles;
		const idx = arr.indexOf(file.path);
		let turnedOn = false;
		if (idx >= 0) arr.splice(idx, 1);
		else {
			arr.push(file.path);
			turnedOn = true;
		}
		await this.plugin.saveSettings(); // triggers re-render
		if (turnedOn) {
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (view && view.file && view.file.path === file.path) {
				this.plugin.scrollEditorToBottom(view);
			}
		}
	}

	private revealHeading(file: TFile, line: number) {
		const leaves = this.app.workspace.getLeavesOfType("markdown");
		let target: WorkspaceLeaf | null = null;
		for (const leaf of leaves) {
			const v = leaf.view;
			if (v instanceof MarkdownView && v.file === file) {
				target = leaf;
				break;
			}
		}
		const open = target
			? Promise.resolve(target)
			: this.app.workspace
					.getLeaf(false)
					.openFile(file)
					.then(() => {
						return this.app.workspace.getMostRecentLeaf() as WorkspaceLeaf;
					});

		void Promise.resolve(open).then((leaf) => {
			if (!leaf) return;
			void this.app.workspace.revealLeaf(leaf);
			const view = leaf.view;
			if (view instanceof MarkdownView) {
				const editor = view.editor;
				editor.setCursor({ line, ch: 0 });
				editor.scrollIntoView(
					{ from: { line, ch: 0 }, to: { line, ch: 0 } },
					true
				);
				editor.focus();
			}
		});
	}
}

function formatCount(n: number): string {
	return n.toLocaleString("en-US");
}

// ===========================================================================
// Settings
// ===========================================================================

class HeadingWordCountSettingTab extends PluginSettingTab {
	plugin: HeadingWordCountPlugin;

	constructor(app: App, plugin: HeadingWordCountPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		const t = this.plugin.t;

		// Language selector — kept at the very top so it is easy to find.
		new Setting(containerEl)
			.setName(t.setLangName)
			.setDesc(t.setLangDesc)
			.addDropdown((d) =>
				d
					.addOption("auto", t.optAuto)
					.addOption("zh", "中文")
					.addOption("en", "English")
					.setValue(this.plugin.settings.uiLanguage)
					.onChange(async (v) => {
						this.plugin.settings.uiLanguage = v as LangPref;
						await this.plugin.saveSettings();
						this.display(); // re-render this tab in the new language
					})
			);

		new Setting(containerEl)
			.setName(t.setScopeName)
			.setDesc(t.setScopeDesc)
			.addDropdown((d) =>
				d
					.addOption("total", t.optTotal)
					.addOption("own", t.optOwn)
					.setValue(this.plugin.settings.countMode)
					.onChange(async (v) => {
						this.plugin.settings.countMode = v as "total" | "own";
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(t.setPunctName)
			.setDesc(t.setPunctDesc)
			.addToggle((tg) =>
				tg
					.setValue(this.plugin.settings.countChinesePunctuation)
					.onChange(async (v) => {
						this.plugin.settings.countChinesePunctuation = v;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(t.setExCodeName)
			.setDesc(t.setExCodeDesc)
			.addToggle((tg) =>
				tg
					.setValue(this.plugin.settings.excludeCodeBlocks)
					.onChange(async (v) => {
						this.plugin.settings.excludeCodeBlocks = v;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(t.setExInlineName)
			.setDesc(t.setExInlineDesc)
			.addToggle((tg) =>
				tg
					.setValue(this.plugin.settings.excludeInlineCode)
					.onChange(async (v) => {
						this.plugin.settings.excludeInlineCode = v;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(t.setDepthName)
			.setDesc(t.setDepthDesc)
			.addSlider((sl) =>
				sl
					.setLimits(1, 6, 1)
					.setValue(this.plugin.settings.maxDepth)
					.onChange(async (v) => {
						this.plugin.settings.maxDepth = v;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(t.setShowTotalName)
			.setDesc(t.setShowTotalDesc)
			.addToggle((tg) =>
				tg
					.setValue(this.plugin.settings.showDocumentTotal)
					.onChange(async (v) => {
						this.plugin.settings.showDocumentTotal = v;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(t.setAutoScrollName)
			.setDesc(t.setAutoScrollDesc);

		if (this.plugin.settings.autoScrollFiles.length > 0) {
			const list = containerEl.createDiv({ cls: "hwc-settings-filelist" });
			list.createEl("div", {
				text: t.autoListLabel,
				cls: "setting-item-description",
			});
			for (const p of [...this.plugin.settings.autoScrollFiles]) {
				const row = new Setting(list).setName(p);
				row.addButton((b) =>
					b.setButtonText(t.removeBtn).onClick(async () => {
						const arr = this.plugin.settings.autoScrollFiles;
						const i = arr.indexOf(p);
						if (i >= 0) arr.splice(i, 1);
						await this.plugin.saveSettings();
						this.display();
					})
				);
			}
		}
	}
}

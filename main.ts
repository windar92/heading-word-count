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
} from "obsidian";

import {
	analyzeDocument,
	CountOptions,
	DEFAULT_COUNT_OPTIONS,
	DocumentCount,
} from "./counter";

export const VIEW_TYPE = "heading-word-count-outline";

interface PluginSettings extends CountOptions {
	/** 徽章顯示 'total'（含子章節）或 'own'（僅本節） */
	countMode: "total" | "own";
	/** 是否在面板頂端顯示全文總字數 */
	showDocumentTotal: boolean;
	/** 顯示到第幾層標題 (1-6) */
	maxDepth: number;
}

const DEFAULT_SETTINGS: PluginSettings = {
	...DEFAULT_COUNT_OPTIONS,
	countMode: "total",
	showDocumentTotal: true,
	maxDepth: 6,
};

// ===========================================================================
// Plugin
// ===========================================================================

export default class HeadingWordCountPlugin extends Plugin {
	settings: PluginSettings;

	async onload() {
		await this.loadSettings();

		this.registerView(VIEW_TYPE, (leaf) => new HeadingWordCountView(leaf, this));

		this.addRibbonIcon("list-ordered", "字數大綱", () => {
			this.activateView();
		});

		this.addCommand({
			id: "open-heading-word-count-outline",
			name: "開啟字數大綱面板",
			callback: () => this.activateView(),
		});

		this.addSettingTab(new HeadingWordCountSettingTab(this.app, this));

		// Refresh triggers
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () => this.refreshViews())
		);
		this.registerEvent(
			this.app.workspace.on("file-open", () => this.refreshViews())
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

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.refreshViews();
	}

	refreshViews() {
		this.app.workspace
			.getLeavesOfType(VIEW_TYPE)
			.forEach((leaf) => {
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

	constructor(leaf: WorkspaceLeaf, plugin: HeadingWordCountPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return VIEW_TYPE;
	}

	getDisplayText() {
		return "字數大綱";
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

	private getActiveMarkdownFile(): TFile | null {
		const active = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (active && active.file) return active.file;
		// Fall back to the most recent markdown leaf.
		const leaves = this.app.workspace.getLeavesOfType("markdown");
		for (const leaf of leaves) {
			const v = leaf.view;
			if (v instanceof MarkdownView && v.file) return v.file;
		}
		return null;
	}

	render() {
		const container = this.contentEl;
		container.empty();
		container.addClass("hwc-view");

		const file = this.getActiveMarkdownFile();
		if (!file) {
			container.createDiv({
				cls: "hwc-empty",
				text: "開啟一份 Markdown 筆記以顯示字數大綱。",
			});
			return;
		}

		// Read content synchronously from the active editor when possible,
		// otherwise from cache asynchronously.
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

		const data: DocumentCount = analyzeDocument(content, this.plugin.settings);
		const s = this.plugin.settings;

		// Header
		const header = container.createDiv({ cls: "hwc-header" });
		header.createDiv({ cls: "hwc-filename", text: file.basename });
		if (s.showDocumentTotal) {
			header.createDiv({
				cls: "hwc-doctotal",
				text: `全文 ${formatCount(data.documentTotal)} 字`,
			});
		}

		const visible = data.headings.filter((h) => h.level <= s.maxDepth);
		if (visible.length === 0) {
			container.createDiv({
				cls: "hwc-empty",
				text: "這份筆記沒有標題 (H1–H6)。",
			});
			return;
		}

		const list = container.createDiv({ cls: "hwc-list" });
		for (const h of visible) {
			const count = s.countMode === "total" ? h.totalCount : h.ownCount;
			const row = list.createDiv({ cls: `hwc-row hwc-h${h.level}` });
			row.style.paddingLeft = `${(h.level - 1) * 14 + 4}px`;

			row.createSpan({
				cls: "hwc-title",
				text: h.title || "(無標題)",
			});
			row.createSpan({
				cls: "hwc-badge",
				text: formatCount(count),
			});

			row.addEventListener("click", () => this.revealHeading(file, h.line));
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
			: this.app.workspace.getLeaf(false).openFile(file).then(() => {
					const l = this.app.workspace.getMostRecentLeaf();
					return l as WorkspaceLeaf;
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

		new Setting(containerEl)
			.setName("計算範圍")
			.setDesc(
				"每個標題的字數要「包含底下所有子章節」，還是「只算到下一個標題之前」。"
			)
			.addDropdown((d) =>
				d
					.addOption("total", "含子章節（H1 包含其下所有內容）")
					.addOption("own", "只算本節（不含子章節）")
					.setValue(this.plugin.settings.countMode)
					.onChange(async (v) => {
						this.plugin.settings.countMode = v as "total" | "own";
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("計入中文標點符號")
			.setDesc(
				"開啟後，中文標點（，。、！？「」等）也會計為 1 個字。中文方塊字一律逐字計算，不受此項影響。"
			)
			.addToggle((t) =>
				t
					.setValue(this.plugin.settings.countChinesePunctuation)
					.onChange(async (v) => {
						this.plugin.settings.countChinesePunctuation = v;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("排除程式碼區塊")
			.setDesc("不計算 ``` 圍欄程式碼區塊內的文字。")
			.addToggle((t) =>
				t
					.setValue(this.plugin.settings.excludeCodeBlocks)
					.onChange(async (v) => {
						this.plugin.settings.excludeCodeBlocks = v;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("排除行內程式碼")
			.setDesc("不計算 `行內程式碼` 內的文字。")
			.addToggle((t) =>
				t
					.setValue(this.plugin.settings.excludeInlineCode)
					.onChange(async (v) => {
						this.plugin.settings.excludeInlineCode = v;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("顯示到第幾層標題")
			.setDesc("只在面板中顯示到指定層級的標題（1 = 只顯示 H1，6 = 全部顯示）。")
			.addSlider((sl) =>
				sl
					.setLimits(1, 6, 1)
					.setValue(this.plugin.settings.maxDepth)
					.setDynamicTooltip()
					.onChange(async (v) => {
						this.plugin.settings.maxDepth = v;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("顯示全文總字數")
			.setDesc("在面板頂端顯示整份筆記的總字數。")
			.addToggle((t) =>
				t
					.setValue(this.plugin.settings.showDocumentTotal)
					.onChange(async (v) => {
						this.plugin.settings.showDocumentTotal = v;
						await this.plugin.saveSettings();
					})
			);
	}
}

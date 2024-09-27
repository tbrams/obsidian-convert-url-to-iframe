import { Editor, MarkdownView, Menu, Notice, Plugin } from 'obsidian';

import { getIframe } from './utils/iframe_generator.utils';
import { ConfigureIframeModal } from './configure_iframe_modal';
import { isUrl } from './utils/url.utils';

export default class FormatNotionPlugin extends Plugin {
	async onload() {
		console.log('Loading obsidian-convert-url-to-iframe');
		this.addCommand({
			id: "url-to-iframe",
			name: "URL to Preview/Iframe",
			callback: () => this.urlToIframe(),
			hotkeys: [
				{
					modifiers: ["Alt"],
					key: "i",
				},
			],
		});

		// Editor mode (right click on text)
		this.registerEvent(this.app.workspace.on('editor-menu',
			(menu: Menu, _: Editor, view: MarkdownView) => {
				const url = this.getCleanedUrl();
				if (url) {
					menu.addItem((item) => { 
						item.setTitle("Url to Preview/Iframe")
							.setIcon("create-new")
							.onClick((_) => {
								this.urlToIframe(url);
							});
					});
				}
			}));
	}

	async urlToIframe(inputUrl?: string): Promise<void> {
		const activeLeaf: any = this.app.workspace.activeLeaf;
		const editor = activeLeaf.view.sourceMode.cmEditor;

		const url = inputUrl || this.getCleanedUrl();

		if (url) {
			const iframeHtml = await getIframe(url);
			const modal = new ConfigureIframeModal(this.app, iframeHtml, editor);
			modal.open();
		} else {
			new Notice('No valid URL found at cursor position or in selection.');
		}
	}

	private getCleanedUrl(): string {
		const activeLeaf: any = this.app.workspace.activeLeaf;
		const editor = activeLeaf.view.sourceMode.cmEditor;
		
		if (editor.somethingSelected()) {
			const selectedText: string = editor.getSelection().trim();
			return isUrl(selectedText) ? selectedText : null;
		} else {
			const cursor = editor.getCursor();
			const line = editor.getLine(cursor.line);
			const words = line.split(/\s+/);
			for (const word of words) {
				if (isUrl(word) && line.indexOf(word) <= cursor.ch && line.indexOf(word) + word.length >= cursor.ch) {
					return word;
				}
			}
		}
		return null;
	}
}

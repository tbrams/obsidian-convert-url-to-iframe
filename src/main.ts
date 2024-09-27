import { Editor, MarkdownView, Menu, Notice, Plugin } from 'obsidian';

import { getIframe } from './utils/iframe_generator.utils';
import { ConfigureIframeModal } from './configure_iframe_modal';

export default class FormatNotionPlugin extends Plugin {
	async onload() {
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

		this.registerEvent(this.app.workspace.on('editor-menu',
			(menu: Menu, _: Editor, view: MarkdownView) => {
				const urlInfo = this.getYoutubeUrl();
				if (urlInfo) {
					menu.addItem((item) => { 
						item.setTitle("Url to Preview/Iframe")
							.setIcon("create-new")
							.onClick((_) => {
								this.urlToIframe(urlInfo);
							});
					});
				}
			}));
	}

	async urlToIframe(inputUrlInfo?: {url: string, start: EditorPosition, end: EditorPosition}): Promise<void> {
		const activeLeaf: any = this.app.workspace.activeLeaf;
		const editor = activeLeaf.view.sourceMode.cmEditor;

		const urlInfo = inputUrlInfo || this.getYoutubeUrl();

		if (urlInfo) {
			editor.setSelection(urlInfo.start, urlInfo.end);
			const iframeHtml = await getIframe(urlInfo.url);
			const modal = new ConfigureIframeModal(this.app, iframeHtml, editor);
			modal.onClose = () => {
				if (modal.iframeHtml) {
					// Ensure we're still selecting the correct range
					const currentContent = editor.getRange(urlInfo.start, urlInfo.end);
					if (currentContent === urlInfo.url) {
						// Replace the URL with the iframe HTML
						editor.replaceRange(modal.iframeHtml, urlInfo.start, urlInfo.end);
						new Notice('YouTube URL replaced with iframe.');
					} else {
						new Notice('URL content changed, unable to replace.');
					}
				}
			};
			modal.open();
		} else {
			new Notice('No valid YouTube URL found at cursor position or in selection.');
		}
	}

	private getYoutubeUrl(): {url: string, start: EditorPosition, end: EditorPosition} | null {
		const activeLeaf: any = this.app.workspace.activeLeaf;
		const editor = activeLeaf.view.sourceMode.cmEditor;
		const cursor = editor.getCursor();
		const line = editor.getLine(cursor.line);
		
		const youtubeRegex = /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)(?:&\S*)?/;
		const match = line.match(youtubeRegex);

		if (match) {
			const start = { line: cursor.line, ch: match.index };
			const end = { line: cursor.line, ch: match.index + match[0].length };
			
			if (cursor.ch >= start.ch - 1 && cursor.ch <= end.ch + 1) {
				return {
					url: match[0],
					start: start,
					end: end
				};
			}
		}
		return null;
	}
}

interface EditorPosition {
	line: number;
	ch: number;
}

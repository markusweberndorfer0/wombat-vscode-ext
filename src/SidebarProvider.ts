import * as vscode from 'vscode';
import { getNonce } from './getNonce';

/**
 * Provides the sidebar for the app
 */
export class SidebarProvider implements vscode.WebviewViewProvider {
	_view?: vscode.WebviewView;
	_doc?: vscode.TextDocument;
	private readonly _extensionUri: vscode.Uri;

	/**
	 * Default ctor
	 * @param _extensionUri the uri of the vscode extension
	 */
	constructor(_extensionUri: vscode.Uri) {
		this._extensionUri = _extensionUri;
	}

	/**
	 * Resolves the webview when the icon is clicked
	 * @param webviewView WebView to restore
	 */
	public resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
	}

	/**
	 * Creates the html for the webview
	 * @param webview WebView to restore
	 * @returns the created html
	 */
	private _getHtmlForWebview(webview: vscode.Webview): string {
		// Local path to main script run in the webview
		const scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js');

		// And the uri we use to load this script in the webview
		const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

		// Local path to css styles
		const styleResetPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css');
		const stylesPathVSCodePath = vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css');
		const stylesPathMainPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'style.css');

		// Local path to svg files
		const svgPathPlusIcon = vscode.Uri.joinPath(this._extensionUri, 'media', 'plus-svgrepo-com.svg');
		const svgPathMinusIcon = vscode.Uri.joinPath(this._extensionUri, 'media', 'minus-svgrepo-com.svg');

		// Uri to load styles into webview
		const stylesResetUri = webview.asWebviewUri(styleResetPath);
		const stylesVSCodeUri = webview.asWebviewUri(stylesPathVSCodePath);
		const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);

		// Uri to load svg into webview
		const svgPlusIcon = webview.asWebviewUri(svgPathPlusIcon);
		const svgMinusIcon = webview.asWebviewUri(svgPathMinusIcon);

		// Use a nonce to only allow specific scripts to be run
		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${stylesResetUri}" rel="stylesheet">
				<link href="${stylesVSCodeUri}" rel="stylesheet">
				<link href="${stylesMainUri}" rel="stylesheet">

				<title>KIPR Wombat</title>
			</head>
			<body>
				<h3 class="heading">Users</h3>

				<div class="user-select">
					<select class="" name="users" id="users">
						<option value="Default User">User1</option>
						<option value="saab">User2</option>
						<option value="Default User2">User3</option>
						<option value="audi">User4</option>
					</select>
					<!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->
					<img src="${svgPlusIcon}" onclick=""></img>
					<img src="${svgMinusIcon}"></img>
				</div>

				<div id="lines-of-code-counter"></div>

				<script nonce="${nonce}" src="${scriptUri}">
				</script>
			</body>
			</html>`;
	}
}
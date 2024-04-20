import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('kipr-wombat-vscode-extension.helloWorld', () => {
			vscode.window.showInformationMessage('How was it?', 'good', 'bad');
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("kipr-wombat-vscode-extension.ask-question", () => {
			vscode.window.showInformationMessage('How was it?', 'good', 'bad');
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() {

}

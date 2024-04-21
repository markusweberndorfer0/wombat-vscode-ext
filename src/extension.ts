import * as vscode from 'vscode';
import { SidebarProvider } from './SidebarProvider';

const cats = {
	'Coding Cat': 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif',
	'Compiling Cat': 'https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif',
	'Testing Cat': 'https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif'
};

export function activate(context: vscode.ExtensionContext) {
	const sidebarProvider = new SidebarProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider("wombat-sidebar", sidebarProvider),
	);

	/* let options: vscode.InputBoxOptions = {
		prompt: "Enter the name of the new user",
		placeHolder: "Name of new user"
	};

	vscode.window.showInputBox(options).then(value => {
		if (!value) {
			return;
		}	// show the next dialog, etc.
	}); */
}

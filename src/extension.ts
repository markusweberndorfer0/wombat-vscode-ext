import * as vscode from 'vscode';
import { SidebarProvider } from './SidebarProvider';

export async function activate(context: vscode.ExtensionContext) {
	const sidebarProvider = new SidebarProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider("wombat-sidebar", sidebarProvider),
	);

	/* 
		const doc = await vscode.workspace.openTextDocument(vscode.Uri.file("D:\\_repos\\wombat-vscode-ext\\vsc-extension-quickstart.md"));
		console.log(doc);
		await vscode.window.showTextDocument(doc, vscode.ViewColumn.One); */
}

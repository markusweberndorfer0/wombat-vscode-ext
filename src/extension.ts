import * as vscode from 'vscode';
import { SidebarProvider } from './SidebarProvider';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { APIRequests } from './APIRequests';

export async function activate(context: vscode.ExtensionContext) {
    const sidebarProvider = new SidebarProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'wombat-sidebar',
            sidebarProvider
        )
    );

    vscode.workspace.onDidSaveTextDocument(async (e) => {
        let savedFilepath: string = e.fileName;
        let wombatExtTempDirPath: string = os.tmpdir() + '/vscode_wombat_ext';

        const relative = path.relative(wombatExtTempDirPath, savedFilepath);
        if (
            relative &&
            !relative.startsWith('..') &&
            !path.isAbsolute(relative)
        ) {
            let filepath: string = fs
                .readFileSync(savedFilepath + '.info')
                .toString();
            let fileContent: string = fs.readFileSync(savedFilepath).toString();

            const encodedContent: string = btoa(fileContent);

            await APIRequests.putFile(filepath, encodedContent);
        }
    });

    /* const doc = await vscode.workspace.openTextDocument(
        vscode.Uri.file(
            'D:\\_repos\\wombat-vscode-ext\\vsc-extension-quickstart.md'
        )
    );
    console.log(doc);
    await vscode.window.showTextDocument(doc, vscode.ViewColumn.One); */
}

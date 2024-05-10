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

    // Autosave wombat files
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

            try {
                await APIRequests.putFile(filepath, encodedContent);
                vscode.window.showInformationMessage('The file was saved ✅');
            } catch (e) {
                vscode.window.showErrorMessage(
                    'There were errors saving the file -> ' + e
                );
            }
        }
    });
}

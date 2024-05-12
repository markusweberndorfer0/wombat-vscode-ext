import * as vscode from 'vscode';
import { SidebarProvider } from './SidebarProvider';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { APIRequests } from './APIRequests';

export async function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'wombat-sidebar',
            new SidebarProvider(context.extensionUri)
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'kipr-wombat-vscode-extension.compile',
            async (e) => {
                let savedFilepath: string = e.fsPath;
                let wombatExtTempDirPath: string =
                    os.tmpdir() + '/vscode_wombat_ext';

                const relative = path.relative(
                    wombatExtTempDirPath,
                    savedFilepath
                );

                if (
                    relative &&
                    !relative.startsWith('..') &&
                    !path.isAbsolute(relative)
                ) {
                    let configFilepath: string = savedFilepath + '.json';

                    let config: any = JSON.parse(
                        fs.readFileSync(configFilepath).toString()
                    );

                    try {
                        await APIRequests.compileProject(
                            config.username,
                            config.projectname
                        );
                        vscode.window.showInformationMessage(
                            'The project ' +
                                config.username +
                                '/' +
                                config.projectname +
                                ' was compiled ✅'
                        );
                    } catch (e) {
                        vscode.window.showErrorMessage(
                            'There were errors compiling ' +
                                config.username +
                                '/' +
                                config.projectname +
                                ' -> ' +
                                e
                        );
                    }
                }
            }
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
            let configFilepath: string = savedFilepath + '.json';
            let config: any = JSON.parse(
                fs.readFileSync(configFilepath).toString()
            );
            let fileContent: string = fs.readFileSync(savedFilepath).toString();

            const encodedContent: string = btoa(fileContent);

            try {
                await APIRequests.putFile(
                    config.filepathOnWombat,
                    encodedContent
                );
                vscode.window.showInformationMessage('The file was saved ✅');
            } catch (e) {
                vscode.window.showErrorMessage(
                    'There were errors saving the file -> ' + e
                );
            }
        }
    });
}

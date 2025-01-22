import * as vscode from 'vscode';
import { SidebarProvider } from './sidebarProvider';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { API } from './api';
import { WebSocket } from './webSocket';
import { Config } from './models/config';
import { WombatOutputChannel } from './wombatOutputChannel';

export async function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'wombat-sidebar',
            new SidebarProvider(context.extensionUri)
        )
    );

    // Command for compiling active project
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'kipr-wombat-vscode-extension.compile',
            async (e) => {
                const config = getConfigFromFilepath(e.fsPath);

                if (config === undefined) {
                    return;
                }

                WombatOutputChannel.showAndClearWombatOutputChannel();

                try {
                    const returnStr = await API.compileProject(
                        config.username,
                        config.projectname
                    );
                    WombatOutputChannel.appendToOutputChannel(returnStr);
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
        )
    );

    // Command for running active project
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'kipr-wombat-vscode-extension.run',
            async (e) => {
                const config = getConfigFromFilepath(e.fsPath);

                if (config === undefined) {
                    return;
                }

                try {
                    await API.runProject(config.username, config.projectname);
                    vscode.window.showInformationMessage(
                        'The project ' +
                            config.username +
                            '/' +
                            config.projectname +
                            ' is running'
                    );
                } catch (e) {
                    vscode.window.showErrorMessage(
                        'There were errors while trying to run ' +
                            config.username +
                            '/' +
                            config.projectname +
                            ' -> ' +
                            e
                    );
                }
            }
        )
    );

    // Command for running active project
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'kipr-wombat-vscode-extension.stop',
            async (e) => {
                try {
                    await API.stopProject();
                    vscode.window.showInformationMessage(
                        'The running project was stopped'
                    );
                } catch (e) {
                    vscode.window.showErrorMessage(
                        'There was a problem stopping the project'
                    );
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
                await API.putFile(config.filepathOnWombat, encodedContent);
                vscode.window.showInformationMessage('The file was saved');
            } catch (e) {
                vscode.window.showErrorMessage(
                    'There were errors saving the file -> ' + e
                );
            }
        }
    });

    WebSocket.listenOnTerminalOutput();
}

/**
 * Get config from filepath
 * @param savedFilepath - Path of saved file
 */
function getConfigFromFilepath(savedFilepath: string): Config | undefined {
    let wombatExtTempDirPath: string = os.tmpdir() + '/vscode_wombat_ext';

    const relative = path.relative(wombatExtTempDirPath, savedFilepath);

    if (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) {
        let configFilepath: string = savedFilepath + '.json';

        const config: any = JSON.parse(
            fs.readFileSync(configFilepath).toString()
        );

        return config;
    }
}

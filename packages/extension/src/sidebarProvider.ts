import * as vscode from 'vscode';
import { API } from './api';
import os from 'os';
import fs from 'fs';
import { downloadFile, saveAndBackupProject } from './util';
import { ProjectModel } from '../../shared/models/projectModel';

export class SidebarProvider implements vscode.WebviewViewProvider {
    private static instance: SidebarProvider | null = null;
    private _sidebar?: vscode.WebviewView;
    private readonly _extensionUri: vscode.Uri;

    private constructor(context: vscode.ExtensionContext) {
        this._extensionUri = context.extensionUri;
    }

    public static getInstance(
        context: vscode.ExtensionContext
    ): SidebarProvider {
        if (!SidebarProvider.instance) {
            SidebarProvider.instance = new SidebarProvider(context);
        }
        return SidebarProvider.instance;
    }

    public resolveWebviewView(webviewView: vscode.WebviewView) {
        this._sidebar = webviewView;

        this._sidebar.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, 'vue-dist', 'assets'),
                vscode.Uri.joinPath(this._extensionUri, 'media'),
            ],
        };

        this._sidebar.webview.html = this._getHtmlForWebview(
            this._sidebar.webview
        );

        this._sidebar.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'create-user':
                    let createUserOptions: vscode.InputBoxOptions = {
                        prompt: 'Enter the name of the new user',
                        placeHolder: 'Name of new user',
                    };

                    vscode.window
                        .showInputBox(createUserOptions)
                        .then(async (value) => {
                            if (!value) {
                                vscode.window.showErrorMessage(
                                    'No user name given, no user created'
                                );
                            } else {
                                try {
                                    await API.createUser(value);
                                    this._sidebar!.webview.postMessage({
                                        command: 'create-user',
                                    });
                                    vscode.window.showInformationMessage(
                                        'User ' + value + ' was created'
                                    );
                                } catch (e) {
                                    vscode.window.showErrorMessage(
                                        'Error while trying to create user ' + e
                                    );
                                }
                            }
                        });
                    break;
                case 'delete-user':
                    vscode.window
                        .showInformationMessage(
                            'Do you really want to delete user ' +
                                data.username +
                                '?',
                            'Yes',
                            'No'
                        )
                        .then(async (answer) => {
                            if (answer !== 'Yes') {
                                vscode.window.showInformationMessage(
                                    "User wasn't deleted!"
                                );
                            }

                            try {
                                await API.deleteUser(data.username);
                                this._sidebar!.webview.postMessage({
                                    command: 'delete-user',
                                });
                                vscode.window.showInformationMessage(
                                    'User ' + data.username + ' was deleted'
                                );
                            } catch (e) {
                                vscode.window.showErrorMessage(
                                    'Error while trying to delete user ' + e
                                );
                            }
                        });
                    break;
                case 'create-project':
                    let createProjectOptions: vscode.InputBoxOptions = {
                        prompt: 'Enter the name of the new project',
                        placeHolder: 'Name of new project',
                    };

                    const projectName =
                        await vscode.window.showInputBox(createProjectOptions);
                    if (!projectName) {
                        vscode.window.showErrorMessage(
                            'No project name given, no project created'
                        );
                        return;
                    }

                    const programmingLanguage =
                        await vscode.window.showQuickPick([
                            'C',
                            'C++',
                            'Python',
                        ]);
                    if (!programmingLanguage) {
                        vscode.window.showErrorMessage(
                            'No programming language was selected!'
                        );
                        return;
                    }

                    try {
                        await API.createProject(
                            programmingLanguage,
                            data.username,
                            projectName
                        );
                        this._sidebar!.webview.postMessage({
                            command: 'create-project',
                        });
                        vscode.window.showInformationMessage(
                            'Project ' + projectName + ' was created'
                        );
                    } catch (e) {
                        vscode.window.showErrorMessage(
                            'Error while trying to create project ' + e
                        );
                    }

                    break;
                case 'delete-project':
                    vscode.window
                        .showInformationMessage(
                            'Do you really want to delete project ' +
                                data.projectname +
                                '?',
                            'Yes',
                            'No'
                        )
                        .then(async (answer) => {
                            if (answer !== 'Yes') {
                                vscode.window.showInformationMessage(
                                    "Project wasn't deleted!"
                                );

                                return;
                            }

                            try {
                                await API.deleteProject(
                                    data.username,
                                    data.projectname
                                );
                                this._sidebar!.webview.postMessage({
                                    command: 'delete-project',
                                });
                                vscode.window.showInformationMessage(
                                    'Project was deleted'
                                );
                            } catch (e) {
                                vscode.window.showErrorMessage(
                                    'Error while trying to delete project ' + e
                                );
                            }
                        });
                    break;
                case 'get-users':
                    let getUsersData = JSON.stringify(await API.getUsers());
                    this._sidebar!.webview.postMessage({
                        command: 'users',
                        data: getUsersData,
                    });
                    break;
                case 'get-projects':
                    let getProjectsData = JSON.stringify(
                        await API.getProjects(data.username)
                    );
                    this._sidebar!.webview.postMessage({
                        command: 'projects',
                        data: getProjectsData,
                    });
                    break;
                case 'open-file':
                    const codeFilePath = await downloadFile(
                        data.username,
                        data.projectname,
                        data.filepath
                    );

                    await vscode.window.showTextDocument(
                        await vscode.workspace.openTextDocument(
                            vscode.Uri.file(codeFilePath)
                        ),
                        vscode.ViewColumn.One
                    );

                    break;
                case 'create-file':
                    let createFileOptions: vscode.InputBoxOptions = {
                        prompt: 'Enter filename (without extension)',
                        placeHolder: 'Filename',
                    };

                    vscode.window
                        .showInputBox(createFileOptions)
                        .then(async (value) => {
                            if (!value) {
                                vscode.window.showErrorMessage(
                                    'No filename given, no file created'
                                );
                            } else {
                                try {
                                    const filename = value + data.extension;

                                    await API.createFile(data.path, filename);
                                    this._sidebar!.webview.postMessage({
                                        command: 'create-file',
                                    });
                                    vscode.window.showInformationMessage(
                                        'File ' + filename + ' was created'
                                    );
                                } catch (e) {
                                    vscode.window.showErrorMessage(`${e}`);
                                }
                            }
                        });
                    break;
                case 'delete-file':
                    vscode.window
                        .showInformationMessage(
                            'Do you really want to delete ' +
                                data.filename +
                                '?',
                            'Yes',
                            'No'
                        )
                        .then(async (answer) => {
                            if (answer !== 'Yes') {
                                vscode.window.showInformationMessage(
                                    "File wasn't deleted!"
                                );

                                return;
                            }

                            try {
                                await API.deleteFile(data.path);
                                this._sidebar!.webview.postMessage({
                                    command: 'delete-file',
                                });
                                vscode.window.showInformationMessage(
                                    'File was deleted'
                                );
                            } catch (e) {
                                vscode.window.showErrorMessage(`${e}`);
                            }
                        });
                    break;
                case 'save-backup-project':
                    const path: string =
                        os.tmpdir() +
                        '/vscode_wombat_ext/' +
                        data.username +
                        '/' +
                        data.projectname;
                    const project = JSON.parse(data.project) as ProjectModel;

                    saveAndBackupProject(
                        data.username,
                        data.projectname,
                        path,
                        project
                    );
            }
        });
    }

    public revive(panel: vscode.WebviewView) {
        this._sidebar = panel;
    }

    /**
     * Creates the html for the webview
     * @param webview WebView to restore
     * @returns the created html
     */
    private _getHtmlForWebview(webview: vscode.Webview): string {
        const vueDependencyNameList = ['index.css', 'index.js'];

        const vueDependencyList: vscode.Uri[] = vueDependencyNameList.map(
            (item) =>
                webview.asWebviewUri(
                    vscode.Uri.joinPath(
                        this._extensionUri,
                        'vue-dist',
                        'assets',
                        item
                    )
                )
        );

        const styleResetUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css')
        );
        const stylesPathVSCodeUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css')
        );

        const codiconsUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'codicon.css')
        );

        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <link rel="icon" href="/favicon.ico" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <script type="module" crossorigin src="${vueDependencyList[1]}"></script>
            <link rel="stylesheet" href="${vueDependencyList[0]}">
            <link rel="stylesheet" href="${codiconsUri}">
            <link rel="stylesheet" href="${styleResetUri}">
            <link rel="stylesheet" href="${stylesPathVSCodeUri}">
        </head>
        <body>
            <div id="app"></div>
        </body>
        </html>
        `;

        return html;
    }

    public refresh(): void {
        if (this._sidebar === null) {
            return;
        }

        this._sidebar?.webview.postMessage({ command: 'refresh' });
    }
}

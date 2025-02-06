import * as vscode from 'vscode';
import { getNonce } from './getNonce';
import { API } from './api';
import os from 'os';
import fs from 'fs';

export class SidebarProvider implements vscode.WebviewViewProvider {
    private static instance: SidebarProvider | null = null;
    _view?: vscode.WebviewView;
    private readonly _extensionUri: vscode.Uri;

    constructor(context: vscode.ExtensionContext) {
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
        this._view = webviewView;

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, 'media'),
                vscode.Uri.joinPath(
                    this._extensionUri,
                    'node_modules',
                    '@vscode/codicons',
                    'dist'
                ),
            ],
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.postMessage;

        webviewView.webview.onDidReceiveMessage(async (data) => {
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
                                    webviewView.webview.postMessage({
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
                                webviewView.webview.postMessage({
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

                    const projectName = await vscode.window.showInputBox(
                        createProjectOptions
                    );
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
                        webviewView.webview.postMessage({
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
                    webviewView.webview.postMessage({
                        command: 'users',
                        data: getUsersData,
                    });
                    break;
                case 'get-projects':
                    let getProjectsData = JSON.stringify(
                        await API.getProjects(data.username)
                    );
                    webviewView.webview.postMessage({
                        command: 'projects',
                        data: getProjectsData,
                    });
                    break;
                case 'get-project':
                    let getProjectData = JSON.stringify(
                        await API.getProject(data.username, data.projectname)
                    );
                    webviewView.webview.postMessage({
                        command: 'project',
                        data: getProjectData,
                    });
                    break;
                case 'open-file':
                    let username: string = data.username;
                    let projectname: string = data.projectname;

                    let getFileData: any = await API.getFile(data.filepath);

                    let fileDir: string =
                        os.tmpdir() +
                        '/vscode_wombat_ext/' +
                        username +
                        '/' +
                        projectname;

                    if (!fs.existsSync(fileDir)) {
                        fs.mkdirSync(fileDir, { recursive: true });
                    }

                    let codeFilePath: string = fileDir + '/' + getFileData.name;

                    let configData: any = {
                        filepathOnWombat: getFileData.path,
                        username,
                        projectname,
                    };

                    let configFilepath: string =
                        fileDir + '/' + getFileData.name + '.json';

                    let decodedFileContent: string = atob(getFileData.content);
                    fs.writeFileSync(codeFilePath, decodedFileContent);
                    fs.writeFileSync(
                        configFilepath,
                        JSON.stringify(configData)
                    );

                    await vscode.window.showTextDocument(
                        await vscode.workspace.openTextDocument(
                            vscode.Uri.file(codeFilePath)
                        ),
                        vscode.ViewColumn.One
                    );

                    break;
            }
        });
    }

    public revive(panel: vscode.WebviewView) {
        this._view = panel;
    }

    /**
     * Creates the html for the webview
     * @param webview WebView to restore
     * @returns the created html
     */
    private _getHtmlForWebview(webview: vscode.Webview): string {
        // Local path to main script run in the webview
        const scriptPathOnDisk = vscode.Uri.joinPath(
            this._extensionUri,
            'media',
            'main.js'
        );

        const codiconsUri = webview.asWebviewUri(
            vscode.Uri.joinPath(
                this._extensionUri,
                'node_modules',
                '@vscode/codicons',
                'dist',
                'codicon.css'
            )
        );

        // And the uri we use to load this script in the webview
        const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

        // Local path to css styles
        const styleResetPath = vscode.Uri.joinPath(
            this._extensionUri,
            'media',
            'reset.css'
        );
        const stylesPathVSCodePath = vscode.Uri.joinPath(
            this._extensionUri,
            'media',
            'vscode.css'
        );
        const stylesPathMainPath = vscode.Uri.joinPath(
            this._extensionUri,
            'media',
            'style.css'
        );

        // Local path to svg files
        const svgPathPlusIcon = vscode.Uri.joinPath(
            this._extensionUri,
            'media',
            'plus-svgrepo-com.svg'
        );
        const svgPathMinusIcon = vscode.Uri.joinPath(
            this._extensionUri,
            'media',
            'minus-svgrepo-com.svg'
        );

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
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${webview.cspSource}; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'unsafe-inline';script-src-elem 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${stylesResetUri}" rel="stylesheet">
				<link href="${stylesVSCodeUri}" rel="stylesheet">
				<link href="${stylesMainUri}" rel="stylesheet">
                <link href="${codiconsUri}" rel="stylesheet" />

				<title>KIPR Wombat</title>
			</head>
			<body>
				<div class="heading">Users</div>

				<div class="select">
					<select id="user-select">
					</select>
                    <i class="codicon codicon-add" id="create-user"></i>
                    <i class="codicon codicon-remove" id="delete-user"></i>
				</div>

                <div class="heading mt-15">Projects</div>

                <div class="select">
					<select id="project-select">
					</select>
                    <i class="codicon codicon-add" id="create-project"></i>
                    <i class="codicon codicon-remove" id="delete-project"></i>
				</div>
                
                <div class="heading mt-15">Project files</div>

                <!--<div class="heading-project-files">Include</div>
                <div class="project-files">test.h</div>
                <div class="project-files">test2.h</div>
                <div class="project-files">test3.h</div>
                <div class="project-files">test4.h</div>-->

                <div class="heading-project-files">Source</div>
                <div id="src-project-files">
                </div>

                <!--<div class="heading-project-files">Data</div>
                <div class="project-files">data.dat</div>
                <div class="project-files">data2.dat</div>
                <div class="project-files">data3.dat</div>
                <div class="project-files">data4.dat</div>-->

				<script nonce="${nonce}" src="${scriptUri}">
				</script>
			</body>
			</html>`;
    }

    public refresh(): undefined {}
}

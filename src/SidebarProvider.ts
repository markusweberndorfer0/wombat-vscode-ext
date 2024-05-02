import * as vscode from 'vscode';
import { getNonce } from './getNonce';
import { APIRequests } from './APIRequests';
import { json } from 'stream/consumers';
import os from 'os';

export class SidebarProvider implements vscode.WebviewViewProvider {
    _view?: vscode.WebviewView;
    _doc?: vscode.TextDocument;
    private readonly _extensionUri: vscode.Uri;

    constructor(_extensionUri: vscode.Uri) {
        this._extensionUri = _extensionUri;
    }

    public resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, 'media'),
            ],
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'create-user':
                    let createUserOptions: vscode.InputBoxOptions = {
                        prompt: 'Enter the name of the new user',
                        placeHolder: 'Name of new user',
                    };

                    vscode.window
                        .showInputBox(createUserOptions)
                        .then((value) => {
                            if (!value) {
                                vscode.window.showErrorMessage(
                                    'No user name given, no user created'
                                );
                            } else {
                                APIRequests.createUser(value);
                                /* webviewView.webview.postMessage({
                                    command: 'reload-data',
                                }); */
                                vscode.window.showInformationMessage(
                                    'User ' + value + ' was created!'
                                );
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
                        .then((answer) => {
                            if (answer === 'Yes') {
                                APIRequests.deleteUser(data.username);
                                /* webviewView.webview.postMessage({
                                    command: 'reload-data',
                                }); */
                                vscode.window.showInformationMessage(
                                    'User was deleted'
                                );
                            } else if (answer === 'No') {
                                vscode.window.showInformationMessage(
                                    "User wasn't deleted!"
                                );
                            }
                        });
                    break;
                case 'create-project':
                    let createProjectOptions: vscode.InputBoxOptions = {
                        prompt: 'Enter the name of the new project',
                        placeHolder: 'Name of new project',
                    };

                    vscode.window
                        .showInputBox(createProjectOptions)
                        .then((value) => {
                            if (!value) {
                                vscode.window.showErrorMessage(
                                    'No project name given, no project created'
                                );
                            }
                        });
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
                        .then((answer) => {
                            if (answer === 'Yes') {
                                vscode.window.showInformationMessage(
                                    'Project was deleted'
                                );
                            } else if (answer === 'No') {
                                vscode.window.showInformationMessage(
                                    "Project wasn't deleted!"
                                );
                            }
                        });
                    break;
                case 'get-users':
                    let getUsersData = JSON.stringify(
                        await APIRequests.getUsers()
                    );
                    webviewView.webview.postMessage({
                        command: 'users',
                        data: getUsersData,
                    });
                    break;
                case 'get-projects':
                    let getProjectsData = JSON.stringify(
                        await APIRequests.getProjects(data.username)
                    );
                    webviewView.webview.postMessage({
                        command: 'projects',
                        data: getProjectsData,
                    });
                    break;
                case 'get-project':
                    let getProjectData = JSON.stringify(
                        await APIRequests.getProject(
                            data.username,
                            data.projectname
                        )
                    );
                    webviewView.webview.postMessage({
                        command: 'project',
                        data: getProjectData,
                    });
                    break;
                case 'open-file':
                    let getFileData = APIRequests.getFile(data.filepath);
                    let tempDir =
                        os.tmpdir() +
                        '/vscode_wombat_ext/' +
                        data.username +
                        '/' +
                        data.projectname;

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
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'unsafe-inline';script-src-elem 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${stylesResetUri}" rel="stylesheet">
				<link href="${stylesVSCodeUri}" rel="stylesheet">
				<link href="${stylesMainUri}" rel="stylesheet">

				<title>KIPR Wombat</title>
			</head>
			<body>
				<div class="heading">Users</div>

				<div class="select">
					<select id="user-select">
					</select>
					<img id="create-user" src="${svgPlusIcon}"></img>
					<img id="delete-user" src="${svgMinusIcon}"></img>
				</div>

                <div class="heading mt-15">Projects</div>

                <div class="select">
					<select id="project-select">
					</select>
					<img id="create-project" src="${svgPlusIcon}"></img>
					<img id="delete-project" src="${svgMinusIcon}"></img>
				</div>
                
                <div class="heading mt-15">Project files</div>

                <!--<div class="heading-project-files">Include</div>
                <div class="project-files">test.h</div>
                <div class="project-files">test2.h</div>
                <div class="project-files">test3.h</div>
                <div class="project-files">test4.h</div>-->

                <div class="heading-project-files">Source</div>
                <div id="src-project-files">
                    <div class="project-files">main.c</div>
                    <div class="project-files">main2.c</div>
                    <div class="project-files">main3.c</div>
                    <div class="project-files">main4.c</div>
                </div>

                <!--<div class="heading-project-files">Data</div>
                <div class="project-files">data.dat</div>
                <div class="project-files">data2.dat</div>
                <div class="project-files">data3.dat</div>
                <div class="project-files">data4.dat</div>-->

                <h1 path="test" onclick="openFilePromise()" >test</h1>

				<script nonce="${nonce}" src="${scriptUri}">
				</script>
			</body>
			</html>`;
    }
}

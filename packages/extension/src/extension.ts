import * as vscode from 'vscode';
import { SidebarProvider } from './sidebarProvider';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { API } from './api';
import { WebSocket } from './webSocket';
import { WombatOutputChannel } from './wombatOutputChannel';
import { Config } from '../../shared/models/config';

var savedSinceLastCompile = true;
var currentActionCompleted = true;

export async function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'wombat-sidebar',
            SidebarProvider.getInstance(context)
        )
    );

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('kipr-wombat-vscode-extension.compile', compileProject),
        vscode.commands.registerCommand('kipr-wombat-vscode-extension.run', runProject),
        vscode.commands.registerCommand('kipr-wombat-vscode-extension.stop', stopProject)
    );

    // Autosave wombat files
    vscode.workspace.onDidSaveTextDocument(autosaveWombatFile);

    const ws = new WebSocket(context);
    ws.listenOnTerminalOutput();
}

export async function compileProject(e: any) {
    const config = getConfigFromFilepath(e.fsPath);

    if (config === undefined) {
        return;
    }

    if (currentActionCompleted === true) {
        WombatOutputChannel.clear();
        currentActionCompleted = false;
    }

    savedSinceLastCompile = false;

    WombatOutputChannel.show();

    try {
        WombatOutputChannel.println("Compiling...");
        const returnStr = await API.compileProject(
            config.username,
            config.projectname
        );
        WombatOutputChannel.println(returnStr);
    } catch (e) {
        vscode.window.showErrorMessage(`There were errors compiling '${config.username}/${config.projectname}' -> ${e}`);
        WombatOutputChannel.println(`There were errors compiling '${config.username}/${config.projectname}' -> ${e}`);
        WombatOutputChannel.show();
    }

    currentActionCompleted = true;
}

export async function runProject(e: any) {
    const config = getConfigFromFilepath(e.fsPath);

    if (config === undefined) {
        return;
    }

    if (currentActionCompleted === true) {
        WombatOutputChannel.clear();
        currentActionCompleted = false;
    }

    if (savedSinceLastCompile === true) {
        WombatOutputChannel.println("File has been changed, compiling...");
        await compileProject(e);
    }

    try {
        WombatOutputChannel.println(`Running '${config.username}/${config.projectname}'...`);
        await API.runProject(config.username, config.projectname);
    } catch (e) {
        vscode.window.showErrorMessage(`There were errors while trying to run '${config.username}/${config.projectname}'`);
        WombatOutputChannel.println(`There were errors while trying to run '${config.username}/${config.projectname}' -> ${e}`);
        WombatOutputChannel.show();
    }

    currentActionCompleted = true;
}

export async function stopProject() {
    try {
        await API.stopProject();
        WombatOutputChannel.println('The running project was stopped.');
    } catch (e) {
        vscode.window.showErrorMessage(`There was an error stopping the project`);
        WombatOutputChannel.println(`There was an error stopping the project -> ${e}`);
        WombatOutputChannel.show();
    }
}

export async function autosaveWombatFile(e: vscode.TextDocument) {
    let savedFilepath: string = e.fileName;
    let wombatExtTempDirPath: string = path.join(os.tmpdir(), 'vscode_wombat_ext');

    savedSinceLastCompile = true;

    const relative = path.relative(wombatExtTempDirPath, savedFilepath);
    if (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) {
        let configFilepath: string = savedFilepath + '.json';
        let config: any = JSON.parse(fs.readFileSync(configFilepath).toString());

        let fileContent: string = fs.readFileSync(savedFilepath).toString();

        const encodedContent: string = btoa(fileContent);

        try {
            await API.putFile(config.filepathOnWombat, encodedContent);
        } catch (e) {
            vscode.window.showErrorMessage(`There were errors saving the file -> ${e}`);
            WombatOutputChannel.println(`There were errors saving the file -> ${e}`);
            WombatOutputChannel.show();
        }
    }
}

export function getConfigFromFilepath(savedFilepath: string): Config | undefined {
    let wombatExtTempDirPath: string = path.join(os.tmpdir(), 'vscode_wombat_ext');

    const relative = path.relative(wombatExtTempDirPath, savedFilepath);

    if (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) {
        let configFilepath: string = savedFilepath + '.json';

        const config: any = JSON.parse(fs.readFileSync(configFilepath).toString());

        return config;
    }
}

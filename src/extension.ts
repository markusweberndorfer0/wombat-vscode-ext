import * as vscode from 'vscode';
import { TreeViewProvider } from './treeViewProvider';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { API } from './api';
import { WebSocket } from './webSocket';
import { WombatOutputChannel } from './wombatOutputChannel';
import { Config } from './models/config';
import { AddressService } from './addressService';
import { ConnectionService } from './connectionService';

let savedSinceLastCompile = true;
let currentActionCompleted = true;
let ws: WebSocket | undefined = undefined;
let addressService: AddressService | undefined = undefined;
let connectionService: ConnectionService | undefined = undefined;
let treeViewProvider: TreeViewProvider | undefined = undefined;

export async function activate(context: vscode.ExtensionContext) {
    treeViewProvider = TreeViewProvider.getInstance(context);

    context.subscriptions.push(
        vscode.window.registerTreeDataProvider(
            'wombat-sidebar',
            treeViewProvider
        )
    );

    context.subscriptions.push(treeViewProvider);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'kipr-wombat-vscode-extension.compile',
            compileProject
        ),
        vscode.commands.registerCommand(
            'kipr-wombat-vscode-extension.run',
            runProject
        ),
        vscode.commands.registerCommand(
            'kipr-wombat-vscode-extension.refresh-tree',
            () => treeViewProvider?.refresh()
        ),
        vscode.commands.registerCommand(
            'kipr-wombat-vscode-extension.create-user',
            () => treeViewProvider?.createUser()
        ),
        vscode.commands.registerCommand(
            'kipr-wombat-vscode-extension.delete-user',
            (item) => treeViewProvider?.deleteUser(item)
        ),
        vscode.commands.registerCommand(
            'kipr-wombat-vscode-extension.create-project',
            (item) => treeViewProvider?.createProject(item)
        ),
        vscode.commands.registerCommand(
            'kipr-wombat-vscode-extension.delete-project',
            (item) => treeViewProvider?.deleteProject(item)
        ),
        vscode.commands.registerCommand(
            'kipr-wombat-vscode-extension.create-file',
            (item) => treeViewProvider?.createFile(item)
        ),
        vscode.commands.registerCommand(
            'kipr-wombat-vscode-extension.delete-file',
            (item) => treeViewProvider?.deleteFile(item)
        ),
        vscode.commands.registerCommand(
            'kipr-wombat-vscode-extension.open-remote-file',
            (item) => treeViewProvider?.openFile(item)
        ),
        vscode.commands.registerCommand(
            'kipr-wombat-vscode-extension.stop',
            stopProject
        ),
        vscode.commands.registerCommand(
            'kipr-wombat-vscode-extension.set-wombat-address',
            setWombatAddress
        )
    );

    // Autosave wombat files
    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(autosaveWombatFile)
    );

    addressService = new AddressService(context);
    connectionService = new ConnectionService();
    context.subscriptions.push(addressService, connectionService);

    AddressService.address = addressService.getAddress();
    treeViewProvider.updateAddress(AddressService.address);

    ws = new WebSocket(context, connectionService);
    await ws.listenOnTerminalOutput();

    context.subscriptions.push(
        addressService.onDidChangeAddress((address) => {
            AddressService.address = address;
            treeViewProvider?.updateAddress(address);
            ws?.listenOnTerminalOutput();
        }),
        connectionService.onDidChangeConnection((connected) => {
            treeViewProvider?.setConnectionStatus(connected);
        })
    );
}

type ProjectTarget =
    | {
          fsPath?: string;
          username?: string;
          projectname?: string;
      }
    | undefined;

export async function compileProject(target: ProjectTarget) {
    const config = getProjectConfig(target);

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
        WombatOutputChannel.println('Compiling...');
        const returnStr = await API.compileProject(
            config.username,
            config.projectname
        );
        WombatOutputChannel.println(returnStr);
    } catch (e) {
        vscode.window.showErrorMessage(
            `There were errors compiling '${config.username}/${config.projectname}' -> ${e}`
        );
        WombatOutputChannel.println(
            `There were errors compiling '${config.username}/${config.projectname}' -> ${e}`
        );
        WombatOutputChannel.show();
    }

    currentActionCompleted = true;
}

export async function runProject(target: ProjectTarget) {
    const config = getProjectConfig(target);

    if (config === undefined) {
        return;
    }

    if (currentActionCompleted === true) {
        WombatOutputChannel.clear();
        currentActionCompleted = false;
    }

    if (savedSinceLastCompile === true) {
        WombatOutputChannel.println('File has been changed, compiling...');
        await compileProject(target);
    }

    try {
        WombatOutputChannel.println(
            `Running '${config.username}/${config.projectname}'...`
        );
        await API.runProject(config.username, config.projectname);
    } catch (e) {
        vscode.window.showErrorMessage(
            `There were errors while trying to run '${config.username}/${config.projectname}'`
        );
        WombatOutputChannel.println(
            `There were errors while trying to run '${config.username}/${config.projectname}' -> ${e}`
        );
        WombatOutputChannel.show();
    }

    currentActionCompleted = true;
}

export async function stopProject() {
    try {
        await API.stopProject();
        WombatOutputChannel.println('The running project was stopped.');
    } catch (e) {
        vscode.window.showErrorMessage(
            `There was an error stopping the project`
        );
        WombatOutputChannel.println(
            `There was an error stopping the project -> ${e}`
        );
        WombatOutputChannel.show();
    }
}

export async function setWombatAddress() {
    const result = await vscode.window.showInputBox({
        title: 'Enter Wombat Address',
        value: addressService?.getAddress() ?? '192.168.125.1:8888',
    } as vscode.InputBoxOptions);

    if (!result) {
        return;
    }

    try {
        await addressService?.setAddress(result);
    } catch (e) {
        vscode.window.showErrorMessage(`${e}`);
    }
}

export async function autosaveWombatFile(e: vscode.TextDocument) {
    let savedFilepath: string = e.fileName;
    let wombatExtTempDirPath: string = path.join(
        os.tmpdir(),
        'vscode-wombat-ext'
    );

    savedSinceLastCompile = true;

    const relative = path.relative(wombatExtTempDirPath, savedFilepath);
    if (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) {
        let configFilepath: string = savedFilepath + '.json';
        let config: any = JSON.parse(
            fs.readFileSync(configFilepath).toString()
        );

        let fileContent: string = fs.readFileSync(savedFilepath).toString();

        const encodedContent: string = btoa(fileContent);

        try {
            await API.putFile(config.filepathOnWombat, encodedContent);
        } catch (e) {
            vscode.window.showErrorMessage(
                `There were errors saving the file -> ${e}`
            );
            WombatOutputChannel.println(
                `There were errors saving the file -> ${e}`
            );
            WombatOutputChannel.show();
        }
    }
}

export function getConfigFromFilepath(
    savedFilepath: string
): Config | undefined {
    let wombatExtTempDirPath: string = path.join(
        os.tmpdir(),
        'vscode-wombat-ext'
    );

    const relative = path.relative(wombatExtTempDirPath, savedFilepath);

    if (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) {
        let configFilepath: string = savedFilepath + '.json';

        const config: any = JSON.parse(
            fs.readFileSync(configFilepath).toString()
        );

        return config;
    }
}

function getProjectConfig(target: ProjectTarget): Config | undefined {
    if (!target) {
        return undefined;
    }

    if (
        typeof target.username === 'string' &&
        typeof target.projectname === 'string'
    ) {
        return {
            username: target.username,
            projectname: target.projectname,
        };
    }

    if (typeof target.fsPath === 'string') {
        return getConfigFromFilepath(target.fsPath);
    }

    return undefined;
}

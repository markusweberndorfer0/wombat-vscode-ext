import io from 'socket.io-client';
import * as vscode from 'vscode';
import { WombatOutputChannel } from './wombatOutputChannel.js';
import { SidebarProvider } from './sidebarProvider.js';

export class WebSocket {
    private sidebar;

    constructor(context: vscode.ExtensionContext) {
        this.sidebar = SidebarProvider.getInstance(context);
    }

    /**
     * Generates an output channel and puts the run output into it
     */
    public async listenOnTerminalOutput() {
        const socket = io('ws://192.168.125.1:8888/runner', {
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 500,
            reconnectionDelayMax: 1000,
            timeout: 1000,
            autoConnect: true,
        } as SocketIOClient.ConnectOpts);

        socket.on('stdout', (line: string) => {
            WombatOutputChannel.appendToOutputChannel(line);
        });

        socket.on('disconnect', () => {
            vscode.window.showErrorMessage('Disconnected from Wombat');
        });

        socket.on('connect', () => {
            vscode.window.showInformationMessage('Connected to Wombat');
            this.sidebar.refresh();
        });
    }
}

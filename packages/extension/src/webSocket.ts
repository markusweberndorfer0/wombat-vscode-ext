import io from 'socket.io-client';
import * as vscode from 'vscode';
import { WombatOutputChannel } from './wombatOutputChannel';
import { SidebarProvider } from './sidebarProvider';
import { API } from './api';

export class WebSocket {
    private sidebar;
    private socket?: SocketIOClient.Socket = undefined;

    constructor(context: vscode.ExtensionContext) {
        this.sidebar = SidebarProvider.getInstance(context);
    }

    /**
     * Generates an output channel and puts the run output into it
     */
    public async listenOnTerminalOutput() {
        if (this.socket !== undefined && this.socket.connected) {
            this.socket.close();
        }

        this.socket = io(`ws://${API.address}/runner`, {
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 500,
            reconnectionDelayMax: 1000,
            timeout: 1000,
            autoConnect: true,
        } as SocketIOClient.ConnectOpts);

        this.socket.on('stdout', (line: string) => {
            WombatOutputChannel.print(line);
        });

        this.socket.on('disconnect', () => {
            vscode.window.showErrorMessage('Disconnected from Wombat');
        });

        this.socket.on('connect', () => {
            vscode.window.showInformationMessage('Connected to Wombat');
            this.sidebar.refresh();
        });
    }
}

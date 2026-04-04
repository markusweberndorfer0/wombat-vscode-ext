import * as vscode from 'vscode';
import { WombatOutputChannel } from './wombatOutputChannel';
import { TreeViewProvider } from './treeViewProvider';
import { API } from './api';
import { ConnectionService } from './connectionService';
import io from 'socket.io-client';
import { AddressService } from './addressService';

export class WebSocket {
    private readonly treeView: TreeViewProvider;
    private socket?: SocketIOClient.Socket = undefined;

    constructor(context: vscode.ExtensionContext, private connectionService: ConnectionService) {
        this.treeView = TreeViewProvider.getInstance();
    }

    /**
     * Generates an output channel and puts the run output into it
     */
    public async listenOnTerminalOutput() {
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.close();
            this.socket = undefined;
        }

        this.socket = io(`ws://${AddressService.address}/runner`, {
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 50,
            reconnectionDelayMax: 100,
            timeout: 200,
            autoConnect: true,
        } as SocketIOClient.ConnectOpts);

        this.socket.connect();

        this.socket.on('stdout', (line: string) => {
            WombatOutputChannel.print(line);
        });

        this.socket.on('disconnect', () => {
            vscode.window.showErrorMessage('Disconnected from Wombat');
            this.connectionService.setConnectionStatus(false);
        });

        this.socket.on('connect', () => {
            vscode.window.showInformationMessage('Connected to Wombat');
            this.connectionService.setConnectionStatus(true);
            this.treeView.refresh();
        });
    }
}

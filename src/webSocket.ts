import io from 'socket.io-client';
import * as vscode from 'vscode';
import { WombatOutputChannel } from './wombatOutputChannel';

export class WebSocket {
    /**
     * Generates an output channel and puts the run output into it
     */
    public static async listenOnTerminalOutput() {
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
        });
    }
}

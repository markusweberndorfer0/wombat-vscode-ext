import io from 'socket.io-client';
import axios from 'axios';
import * as vscode from 'vscode';

export class WombatOutputChannel {
    private static wombat = vscode.window.createOutputChannel('Wombat');

    /**
     * Generates an output channel and puts the run output into it
     */
    public static async generateTerminalOutputChannel() {
        const socket = io(`ws://192.168.125.1:8888/runner`);

        console.log(socket);

        socket.on('stdout', (line: string) => {
            this.wombat.append(line);
        });
    }

    public static showAndClearWombatOutputChannel() {
        this.wombat.clear();
        this.wombat.show();
    }
}

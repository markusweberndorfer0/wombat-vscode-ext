import io from 'socket.io-client';
import * as vscode from 'vscode';

export class TerminalOutput {
    private static wombatOutput = vscode.window.createOutputChannel('Wombat');

    /**
     * Generates an output channel and puts the run output into it
     */
    public static async generateTerminalOutputChannel() {
        const socket = io('ws://192.168.125.1:8888/runner');

        socket.on('stdout', (line: string) => {
            this.wombatOutput.append(line);
        });
    }

    /**
     * Clears the output in the wombat channel
     * and shows the channel
     */
    public static showAndClearWombatOutputChannel() {
        this.wombatOutput.clear();
        this.wombatOutput.show();
    }
}

import * as vscode from 'vscode';

export class WombatOutputChannel {
    private static wombatOutput = vscode.window.createOutputChannel('Wombat');

    /**
     * Clears the output in the wombat channel
     * and shows the channel
     */
    public static showAndClearWombatOutputChannel() {
        this.wombatOutput.clear();
        this.wombatOutput.show();
    }

    /**
     * appends a str to output channel
     * @param str
     */
    public static appendToOutputChannel(str: string) {
        this.wombatOutput.append(str);
    }
}

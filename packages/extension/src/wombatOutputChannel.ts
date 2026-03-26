import * as vscode from 'vscode';

export class WombatOutputChannel {
    private static wombatOutput = vscode.window.createOutputChannel('Wombat');

    public static show() {
        WombatOutputChannel.wombatOutput.show();
    }

    public static clear() {
        WombatOutputChannel.wombatOutput.clear();
    }

    /**
     * appends a str to output channel
     * @param str
     */
    public static print(str: string) {
        WombatOutputChannel.wombatOutput.append(str);
    }

    /**
     * appends a str to output channel with a newline
     * @param str
     */
    public static println(str: string) {
        WombatOutputChannel.wombatOutput.append(str + "\n");
    }
}

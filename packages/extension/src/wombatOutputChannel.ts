import * as vscode from 'vscode';

export class WombatOutputChannel {
    private static wombatOutput = vscode.window.createOutputChannel('Wombat');

    public static show() {
        this.wombatOutput.show();
    }

    public static clear() {
        this.wombatOutput.clear();
    }

    /**
     * appends a str to output channel
     * @param str
     */
    public static print(str: string) {
        this.wombatOutput.append(str);
    }

    /**
     * appends a str to output channel with a newline
     * @param str
     */
    public static println(str: string) {
        this.wombatOutput.append(str);
        this.wombatOutput.append('\n');
    }
}

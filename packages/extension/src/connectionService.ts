import * as vscode from 'vscode';

export class ConnectionService implements vscode.Disposable {
    private readonly onDidChangeConnectionEmitter = new vscode.EventEmitter<boolean>();
    public readonly onDidChangeConnection = this.onDidChangeConnectionEmitter.event;
    
    private wombatConnected: boolean = false;

    setConnectionStatus(connected: boolean): void {
        this.wombatConnected = connected;
        this.onDidChangeConnectionEmitter.fire(connected);
    }

    getConnectionStatus(): boolean {
        return this.wombatConnected;
    }

    dispose() {
        this.onDidChangeConnectionEmitter.dispose();
    }
}
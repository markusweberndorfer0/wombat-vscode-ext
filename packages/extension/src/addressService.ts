import * as vscode from 'vscode';

const ADDRESS_KEY = 'wombat-vscode-ext.address';
const DEFAULT_ADDRESS = '192.168.125.1:8888';

export class AddressService implements vscode.Disposable {
    private readonly onDidChangeAddressEmitter =
        new vscode.EventEmitter<string>();
    public readonly onDidChangeAddress = this.onDidChangeAddressEmitter.event;

    constructor(private readonly context: vscode.ExtensionContext) {}

    getAddress(): string {
        const address = this.context.globalState.get<string>(
            ADDRESS_KEY,
            DEFAULT_ADDRESS
        );

        return address;
    }

    async setAddress(address: string): Promise<void> {
        if (!this.isValidAddress(address)) {
            throw new Error(
                "Address doesn't match the pattern XXX.XXX.XXX.XXX:XXXX"
            );
        }

        await this.context.globalState.update(ADDRESS_KEY, address);
        this.onDidChangeAddressEmitter.fire(address);
    }

    dispose(): void {
        this.onDidChangeAddressEmitter.dispose();
    }

    private isValidAddress(address: string): boolean {
        const [host, portText] = address.split(':');
        if (!host || !portText || address.split(':').length !== 2) {
            return false;
        }

        const port = Number(portText);
        if (!Number.isInteger(port) || port < 1 || port > 65535) {
            return false;
        }

        const octets = host.split('.');
        if (octets.length !== 4) {
            return false;
        }

        return octets.every((octet) => {
            const value = Number(octet);
            return (
                octet.length > 0 &&
                /^\d+$/.test(octet) &&
                Number.isInteger(value) &&
                value >= 0 &&
                value <= 255
            );
        });
    }
}
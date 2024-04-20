/**
 * Generates a randomized string from digits 0-9 and chars A-Z and a-z
 * @returns a randomized string
 */
export function getNonce(): string {
	let text: string = '';
	const possible: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
interface vscode {
  postMessage(message: any): void;
}

declare global {
  function acquireVsCodeApi(): vscode;
}

export {};

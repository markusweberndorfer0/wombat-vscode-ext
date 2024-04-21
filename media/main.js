// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.


const vscode = acquireVsCodeApi();
deleteUser("test1");

function createUser() {
    vscode.postMessage({
        type: "create-user"
    });
}

/**
 * @param {string} [username]
 */
function deleteUser(username) {
    vscode.postMessage({
        type: "delete-user",
        username
    });
}

document.getElementById("create-user")?.addEventListener("click", createUser);

// Handle messages sent from the extension to the webview
/* window.addEventListener('message', event => {
    const message = event.data; // The json data that the extension sent
    switch (message.command) {
        case 'refactor':
            currentCount = Math.ceil(currentCount * 0.5);
            counter.textContent = `${currentCount}`;
            break;
    }
}); */

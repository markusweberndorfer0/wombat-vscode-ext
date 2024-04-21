// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

const vscode = acquireVsCodeApi();

/**
 * Sends an api request to create user
 */
function createUser() {
    vscode.postMessage({
        type: "create-user"
    });
}

/**
 * Sends an api request to delete user
 * @param {string} username 
 */
function deleteUser(username) {
    vscode.postMessage({
        type: "delete-user",
        username
    });
}


// Add event listeners
document.getElementById("create-user")?.addEventListener("click", createUser);
document.getElementById("delete-user")?.addEventListener("click", () => {
    // @ts-ignore
    let username = document.querySelector("#user-select")?.value;
    if (username !== null) {
        deleteUser(username);
    }
});


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

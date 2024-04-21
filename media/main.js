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

/**
 * Sends an api request to create project
 * @param {string} username
 */
function createProject(username) {
    vscode.postMessage({
        type: "create-project",
        username
    });
}

/**
 * Sends an api request to delete project
 * @param {string} username 
 * @param {string} projectname 
 */
function deleteProject(username, projectname) {
    vscode.postMessage({
        type: "delete-project",
        username,
        projectname
    });
}


// Add event listeners
document.getElementById("create-user")?.addEventListener("click", createUser);
document.getElementById("delete-user")?.addEventListener("click", () => {
    // @ts-ignore
    let username = document.getElementById("user-select")?.value;
    if (username !== null) {
        deleteUser(username);
    }
});
document.getElementById("create-project")?.addEventListener("click", () => {
    // @ts-ignore
    let username = document.getElementById("user-select")?.value;
    if (username !== null) {
        createProject(username);
    }
});
document.getElementById("delete-project")?.addEventListener("click", () => {
    // @ts-ignore
    let username = document.getElementById("user-select")?.value;
    // @ts-ignore
    let projectname = document.getElementById("project-select")?.value;
    if (username !== null && projectname !== null) {
        deleteProject(username, projectname);
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

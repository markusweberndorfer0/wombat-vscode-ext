// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

const vscode = acquireVsCodeApi();

getUsers();

/**
 * Sets the users in the select menu
 * @param {any} usersData the user data 
 */
function setUsers(usersData) {
    let userSelectHTML = /** @type {HTMLElement} */ document.querySelector('#user-select');

    userSelectHTML.innerHTML = "";

    for (const username in usersData) {
        userSelectHTML.innerHTML += "<option value=\"" + username + "\">" + username + "</option>";
    }
}

/**
 * Gets the users of the wombat
 */
function getUsers() {
    vscode.postMessage({
        type: "get-users"
    });
}

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
document.querySelector("#create-user")?.addEventListener("click", createUser);
document.querySelector("#delete-user")?.addEventListener("click", () => {
    // @ts-ignore
    let username = /** @type {HTMLElement} */ document.querySelector("#user-select")?.value;
    if (username !== null) {
        deleteUser(username);
    }
});
document.querySelector("#create-project")?.addEventListener("click", () => {
    // @ts-ignore
    let username = /** @type {HTMLElement} */ document.querySelector("#user-select")?.value;
    if (username !== null) {
        createProject(username);
    }
});
document.querySelector("#delete-project")?.addEventListener("click", () => {
    // @ts-ignore
    let username = document.getElementById("user-select")?.value;
    // @ts-ignore
    let projectname = document.getElementById("project-select")?.value;
    if (username !== null && projectname !== null) {
        deleteProject(username, projectname);
    }
});


window.addEventListener('message', event => {
    const message = event.data; // The json data that the extension sent
    switch (message.command) {
        case 'users':
            setUsers(JSON.parse(message.data));
            break;
    }
});

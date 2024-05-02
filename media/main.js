// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
const vscode = acquireVsCodeApi();

// get HTML elements
const userSelect = document.querySelector('#user-select');
const projectSelect = document.querySelector('#project-select');
const createUserButton = document.querySelector('#create-user');
const deleteUserButton = document.querySelector('#delete-user');
const createProjectButton = document.querySelector('#create-project');
const deleteProjectButton = document.querySelector('#delete-project');

let currentUsername;

loadData();

/**
 * Loads the complete data
 */
function loadData() {
    getUsers();
    getProjects();
    // @ts-ignore
    currentUsername = document.querySelector('#user-select')?.value;
}

/**
 * Sets the users in the select menu
 * @param {any} usersData the user data
 */
function setUsers(usersData) {
    userSelect.innerHTML = '';

    for (const username in usersData) {
        userSelect.innerHTML +=
            '<option value="' + username + '">' + username + '</option>';
    }
}

/**
 * Gets the users of the wombat
 */
function getUsers() {
    vscode.postMessage({
        type: 'get-users',
    });
}

/**
 * Gets the projects to a user of the wombat
 */
function getProjects() {
    vscode.postMessage({
        type: 'get-projects',
        // @ts-ignore
        username: userSelect?.value,
    });
}

/**
 * Sends an api request to create user
 */
function createUser() {
    vscode.postMessage({
        type: 'create-user',
    });
}

/**
 * Sends an api request to delete user
 * @param {string} username
 */
function deleteUser(username) {
    vscode.postMessage({
        type: 'delete-user',
        username,
    });
}

/**
 * Sends an api request to create project
 * @param {string} username
 */
function createProject(username) {
    vscode.postMessage({
        type: 'create-project',
        username,
    });
}

/**
 * Sends an api request to delete project
 * @param {string} username
 * @param {string} projectname
 */
function deleteProject(username, projectname) {
    vscode.postMessage({
        type: 'delete-project',
        username,
        projectname,
    });
}

// Add event listeners
createUserButton.addEventListener('click', createUser);
deleteUserButton.addEventListener('click', () => {
    // @ts-ignore
    let username = userSelect.value;

    if (username !== null) {
        deleteUser(username);
    }
});
createProjectButton.addEventListener('click', () => {
    // @ts-ignore
    let username = userSelect.value;

    if (username !== null) {
        createProject(username);
    }
});
deleteProjectButton.addEventListener('click', () => {
    // @ts-ignore
    let username = userSelect.value;
    // @ts-ignore
    let projectname = projectSelect.value;

    if (username !== null && projectname !== null) {
        deleteProject(username, projectname);
    }
});

window.addEventListener('message', (event) => {
    const message = event.data; // The json data that the extension sent
    switch (message.command) {
        case 'reload-data':
            loadData();
            break;
        case 'users':
            setUsers(JSON.parse(message.data));
            break;
    }
});

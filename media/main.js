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

// data
let usersData, projectsData, currentUsername, currentProjectIndex;

// load data on load/reload
loadData();

/**
 * Loads the complete data
 */
async function loadData() {
    console.log('triggered');
    await configureUserDataPromise();
    // @ts-ignore
    currentUsername = userSelect.value;
    await configureProjectDataPromise();
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

function setProjects(projectsData) {
    projectSelect.innerHTML = '';

    for (let i = 0; i < projectsData.projects.length; i++) {
        projectSelect.innerHTML +=
            '<option value"' +
            projectsData.projects[i].name +
            '">' +
            projectsData.projects[i].name +
            '</option>';
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
function getProjects(currentUsername) {
    vscode.postMessage({
        type: 'get-projects',
        username: currentUsername,
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
    currentUsername = userSelect.value;

    if (currentUsername !== null) {
        deleteUser(currentUsername);
    }
});
createProjectButton.addEventListener('click', () => {
    // @ts-ignore
    currentUsername = userSelect.value;

    if (currentUsername !== null) {
        createProject(currentUsername);
    }
});
deleteProjectButton.addEventListener('click', () => {
    // @ts-ignore
    currentUsername = userSelect.value;
    // @ts-ignore
    currentUsername = projectSelect.value;

    if (currentUsername !== null && currentUsername !== null) {
        deleteProject(currentUsername, currentUsername);
    }
});
userSelect.addEventListener('change', async () => {
    // @ts-ignore
    currentUsername = userSelect.value;
    await configureProjectDataPromise();
});
projectSelect.addEventListener('change', () => {
    // @ts-ignore
    currentProjectIndex = projectSelect.value;
});

window.addEventListener('message', (event) => {
    const message = event.data; // The json data that the extension sent
    switch (message.command) {
        case 'reload-data':
            loadData();
            break;
        case 'users':
            usersData = JSON.parse(message.data);
            setUsers(usersData);
            break;
        case 'projects':
            projectsData = JSON.parse(message.data);
            setProjects(projectsData);
            break;
    }
});

function configureUserDataPromise() {
    return new Promise((resolve) => {
        getUsers();
        window.addEventListener('message', (event) => {
            const message = event.data;
            if (event.data.command === 'users') {
                usersData = JSON.parse(event.data.data);
                setUsers(usersData);
                resolve();
            }
        });
    });
}

function configureProjectDataPromise() {
    return new Promise((resolve) => {
        getProjects(currentUsername);
        window.addEventListener('message', (event) => {
            projectsData = JSON.parse(event.data.data);
            setUsers(usersData);
            resolve();
        });
    });
}

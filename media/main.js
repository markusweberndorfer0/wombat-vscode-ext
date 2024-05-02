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
const srcProjectFiles = document.querySelector('#src-project-files');

// data
let usersData, projectsData, projectData, currentUsername, currentProjectname;

// load data on load/reload
loadData();

/**
 * Loads the complete data
 */
async function loadData() {
    await configureUsersDataPromise();
    // @ts-ignore
    currentUsername = userSelect.value;
    await configureProjectsDataPromise();
    // @ts-ignore
    currentProjectname = projectSelect.value;
    await configureProjectDataPromise();
}

/**
 * Sets the users in the select menu
 */
function setUsers() {
    userSelect.innerHTML = '';

    if (usersData !== null) {
        for (const username in usersData) {
            userSelect.innerHTML +=
                '<option value="' + username + '">' + username + '</option>';
        }
    }
}

function setProjects() {
    projectSelect.innerHTML = '';

    if (projectsData !== null) {
        for (let i = 0; i < projectsData.projects.length; i++) {
            projectSelect.innerHTML +=
                '<option value"' +
                projectsData.projects[i].name +
                '">' +
                projectsData.projects[i].name +
                '</option>';
        }
    }
}

function setProjectFiles() {
    // src files
    srcProjectFiles.innerHTML = '';

    if (projectData !== null) {
        for (let i = 0; i < projectData.source_files.length; i++) {
            srcProjectFiles.innerHTML += `<div class="project-files" onclick="openFilePromise('${projectData.source_files[i].path}')" value="${projectData.source_files[i].name}">
            ${projectData.source_files[i].name}
            </div>`;
        }
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
 * Sends a signal to open the file in the editor
 * @param {string} filepath
 */
function openFile(filepath) {
    vscode.postMessage({
        type: 'open-file',
        filepath,
        username: currentUsername,
        projectname: currentProjectname,
    });
}

/**
 * Gets the projects to a user of the wombat
 */
function getProjects() {
    vscode.postMessage({
        type: 'get-projects',
        username: currentUsername,
    });
}

function getProject() {
    vscode.postMessage({
        type: 'get-project',
        username: currentUsername,
        projectname: currentProjectname,
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
 */
function deleteUser() {
    vscode.postMessage({
        type: 'delete-user',
        username: currentUsername,
    });
}

/**
 * Sends an api request to create project
 */
function createProject() {
    vscode.postMessage({
        type: 'create-project',
        username: currentUsername,
    });
}

/**
 * Sends an api request to delete project
 */
function deleteProject() {
    vscode.postMessage({
        type: 'delete-project',
        username: currentUsername,
        projectname: currentProjectname,
    });
}

// Add event listeners
createUserButton.addEventListener('click', createUser);
deleteUserButton.addEventListener('click', () => {
    // @ts-ignore
    currentUsername = userSelect.value;

    if (currentUsername !== null) {
        deleteUser();
    }
});
createProjectButton.addEventListener('click', () => {
    // @ts-ignore
    currentUsername = userSelect.value;

    if (currentUsername !== null) {
        createProject();
    }
});
deleteProjectButton.addEventListener('click', () => {
    // @ts-ignore
    currentUsername = userSelect.value;
    // @ts-ignore
    currentUsername = projectSelect.value;

    if (currentUsername !== null && currentUsername !== null) {
        deleteProject();
    }
});
userSelect.addEventListener('change', async () => {
    // @ts-ignore
    currentUsername = userSelect.value;
    await configureProjectsDataPromise();
    // @ts-ignore
    currentProjectname = projectSelect.value;
    await configureProjectDataPromise();
});
projectSelect.addEventListener('change', async () => {
    // @ts-ignore
    currentProjectname = projectSelect.value;
    await configureProjectDataPromise();
});

window.addEventListener('message', (event) => {
    const message = event.data; // The json data that the extension sent
    switch (message.command) {
        case 'reload-data':
            //loadData();
            break;
    }
});

function configureUsersDataPromise() {
    return new Promise((resolve) => {
        usersData = null;
        getUsers();
        window.addEventListener('message', (event) => {
            if (event.data.command === 'users') {
                usersData = JSON.parse(event.data.data);
                setUsers();
                resolve();
            }
        });
    });
}

function configureProjectsDataPromise() {
    return new Promise((resolve) => {
        projectsData = null;
        getProjects();
        window.addEventListener('message', (event) => {
            if (event.data.command === 'projects') {
                projectsData = JSON.parse(event.data.data);
                setProjects();
                resolve();
            }
        });
    });
}

function configureProjectDataPromise() {
    return new Promise((resolve) => {
        projectData = null;
        getProject();
        window.addEventListener('message', (event) => {
            if (event.data.command === 'project') {
                projectData = JSON.parse(event.data.data);
                setProjectFiles();
                resolve();
            }
        });
    });
}

function openFilePromise(filepath) {
    return new Promise((resolve) => {
        openFile(filepath);
        window.addEventListener('message', (event) => {
            if (event.data.command === 'open-file') {
                console.log('File was opened');
                resolve();
            }
        });
    });
}

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
const refreshButton = document.querySelector('#refresh');

// data
let usersData, projectsData, projectData, currentUsername, currentProjectname;

window.addEventListener('message', (event) => {
    if (event.data.command === 'refresh') {
        console.log('reloading');
        loadData();
    }
});

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
            srcProjectFiles.innerHTML += `<div class="project-files" onclick="openFile('${projectData.source_files[i].path}')" value="${projectData.source_files[i].name}">
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
 * @returns a promise which creates the user and refreshes the dataset
 */
function createUser() {
    return new Promise((resolve) => {
        vscode.postMessage({
            type: 'create-user',
        });
        window.addEventListener('message', async (event) => {
            if (event.data.command === 'create-user') {
                await loadData();
                resolve();
            }
        });
    });
}

/**
 * Sends an api request to delete user
 * @returns a promise which creates the user and refreshes the dataset
 */
function deleteUser() {
    return new Promise((resolve) => {
        vscode.postMessage({
            type: 'delete-user',
            username: currentUsername,
        });
        window.addEventListener('message', async (event) => {
            if (event.data.command === 'delete-user') {
                await loadData();
                resolve();
            }
        });
    });
}

/**
 * Sends an api request to create project
 */
function createProject() {
    return new Promise((resolve) => {
        vscode.postMessage({
            type: 'create-project',
            username: currentUsername,
        });
        window.addEventListener('message', async (event) => {
            if (event.data.command === 'create-project') {
                await loadData();
                resolve();
            }
        });
    });
}

/**
 * Sends an api request to delete project
 */
function deleteProject() {
    return new Promise((resolve) => {
        vscode.postMessage({
            type: 'delete-project',
            username: currentUsername,
            projectname: currentProjectname,
        });
        window.addEventListener('message', async (event) => {
            if (event.data.command === 'delete-project') {
                await loadData();
                resolve();
            }
        });
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
createProjectButton.addEventListener('click', async () => {
    // @ts-ignore
    currentUsername = userSelect.value;

    if (currentUsername !== null) {
        await createProject();
    }
});
deleteProjectButton.addEventListener('click', async () => {
    // @ts-ignore
    currentUsername = userSelect.value;
    // @ts-ignore
    currentProjectname = projectSelect.value;

    if (currentUsername !== null && currentProjectname !== null) {
        await deleteProject();
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
refreshButton.addEventListener('click', () => {
    loadData();
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

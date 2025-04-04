<template>
  <div class="flex flex-row justify-between items-center my-1">
    <span class="text-sm uppercase font-bold">Users</span>
    <i class="codicon codicon-refresh cursor-pointer" @click="reload()"></i>
  </div>

  <div class="flex flex-row justify-around items-center">
    <select
      class="text-[13px] w-full bg-[var(--vscode-button-secondaryBackground)] text-[var(--vscode-foreground)]"
      v-model="currentUsername"
      @change="loadProjectsByCurrentUser()"
    >
      <option v-for="(username, index) in Object.keys(users)" :key="index" :value="username">
        {{ username }}
      </option>
    </select>
    <i class="codicon codicon-add pl-1 pr-0.5 cursor-pointer" @click="createUser()"></i>
    <i class="codicon codicon-remove pl-0.5 cursor-pointer" @click="deleteUser()"></i>
  </div>

  <div class="mt-3 mb-1 text-sm uppercase font-bold">Projects</div>

  <div class="flex flex-row justify-around items-center">
    <select
      class="text-[13px] w-full bg-[var(--vscode-button-secondaryBackground)] text-[var(--vscode-foreground)]"
      v-model="currentProjectName"
    >
      <option v-for="(project, index) in projects" :key="index" :value="project.name">
        {{ project.name }} ({{ project.parameters.language }})
      </option>
    </select>
    <i class="codicon codicon-add pl-1 pr-0.5 cursor-pointer" @click="createProject()"></i>
    <i class="codicon codicon-remove pl-0.5 cursor-pointer" @click="deleteProject()"></i>
  </div>

  <div class="mt-3 text-sm uppercase font-bold">Project files</div>

  <template v-if="currentProject?.parameters.language !== 'Python'">
    <div class="file-header mt-1">
      <span class="ml-1.5 text-sm">Include files</span>
      <div>
        <i class="codicon codicon-add" @click="addIncludeFile()"></i>
      </div>
    </div>
    <div id="include-project-files">
      <div
        v-for="includeFile in currentProject?.include_files"
        class="py-0.5 text-sm ml-2.5 flex flex-row items-center justify-between"
      >
        <div class="cursor-pointer" @click="openFile(includeFile.path)">{{ includeFile.name }}</div>
        <i
          v-if="currentProject !== undefined"
          class="codicon codicon-trash cursor-pointer"
          @click="deleteFile(includeFile.name, currentProject?.links.include_directory.href)"
        ></i>
      </div>
    </div>
  </template>

  <div class="file-header mt-1">
    <span class="ml-1.5 text-sm">Source files</span>
    <div>
      <i class="codicon codicon-add" @click="addSourceFile()"></i>
    </div>
  </div>
  <div>
    <div
      v-for="sourceFile in currentProject?.source_files"
      class="py-0.5 text-sm ml-2.5 flex flex-row items-center justify-between"
    >
      <div class="cursor-pointer" @click="openFile(sourceFile.path)">{{ sourceFile.name }}</div>
      <i
        v-if="
          currentProject !== undefined &&
          currentProject?.source_files.length > 1 &&
          !new RegExp(/^main.*$/).test(sourceFile.name)
        "
        class="codicon codicon-trash cursor-pointer"
        @click="deleteFile(sourceFile.name, currentProject.links.src_directory.href)"
      ></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, type ComputedRef, type Ref } from 'vue';
import { type ProjectModel } from '../../shared/models/projectModel';

const vscode = acquireVsCodeApi();

window.addEventListener('message', (event) => {
  if (event.data.command === 'refresh') {
    reload();
  }
});

const currentUsername: Ref<string | undefined> = ref(undefined);
const currentProjectName: Ref<string | undefined> = ref(undefined);

const users = ref([] as any[]);
const usernames = ref([] as string[]);
const projectLinks = ref([] as any[]);
const projects = ref([] as ProjectModel[]);

const currentProject: ComputedRef<ProjectModel | undefined> = computed(() =>
  projects.value.find((project) => project.name === currentProjectName.value),
);

onMounted(() => {
  reload();
});

watch(currentProjectName, () => {
  if (!!currentProjectName.value && !!currentUsername.value)
    onProjectChange(currentUsername.value, currentProjectName.value);
});

async function reload() {
  await loadUsers();
  await loadProjectsByCurrentUser();
}

async function onProjectChange(username: string, projectname: string) {
  return new Promise((resolve) => {
    addOneTimeCodeListenerPromise('backup-project', () => {
      resolve(undefined);
    });

    vscode.postMessage({
      type: 'backup-project',
      username,
      projectname,
    });
  });
}

async function loadUsers() {
  return new Promise((resolve) => {
    users.value = [];
    usernames.value = [];

    addOneTimeCodeListenerPromise('users', (event) => {
      users.value = JSON.parse(event.data.data);
      usernames.value = Object.keys(users.value);

      if (currentUsername.value === undefined || !usernames.value.includes(currentUsername.value)) {
        currentUsername.value = usernames.value[0] || '';
      }

      resolve(undefined);
    });

    vscode.postMessage({
      type: 'get-users',
    });
  });
}

async function loadProjectsByCurrentUser() {
  return new Promise((resolve) => {
    projectLinks.value = [];
    projects.value = [];

    addOneTimeCodeListenerPromise('projects', (event) => {
      projectLinks.value = JSON.parse(event.data.data).links;
      projects.value = JSON.parse(event.data.data).projects as ProjectModel[];

      if (
        currentProject.value === undefined ||
        !projects.value.some(
          (project) =>
            project.name === currentProject.value?.name &&
            project.parameters.user === currentProject.value?.parameters.user,
        )
      ) {
        currentProjectName.value = projects.value[0].name || undefined;
      }

      resolve(undefined);
    });

    vscode.postMessage({
      type: 'get-projects',
      username: currentUsername.value,
    });
  });
}

function openFile(path: string) {
  vscode.postMessage({
    type: 'open-file',
    filepath: path,
    username: currentUsername.value,
    projectname: currentProject.value?.name,
  });
}

async function createUser() {
  return new Promise((resolve) => {
    addOneTimeCodeListenerPromise('create-user', () => {
      reload();
      resolve(undefined);
    });

    vscode.postMessage({
      type: 'create-user',
    });
  });
}

async function deleteUser() {
  return new Promise((resolve) => {
    addOneTimeCodeListenerPromise('delete-user', () => {
      reload();
      resolve(undefined);
    });

    vscode.postMessage({
      type: 'delete-user',
      username: currentUsername.value,
    });
  });
}

async function createProject() {
  return new Promise((resolve) => {
    addOneTimeCodeListenerPromise('create-project', () => {
      reload();
      resolve(undefined);
    });

    vscode.postMessage({
      type: 'create-project',
      username: currentUsername.value,
    });
  });
}

async function deleteProject() {
  if (currentProject.value === undefined) return;

  return new Promise((resolve) => {
    addOneTimeCodeListenerPromise('delete-project', () => {
      reload();
      resolve(undefined);
    });

    vscode.postMessage({
      type: 'delete-project',
      username: currentUsername.value,
      projectname: currentProject.value?.name,
    });
  });
}

async function addSourceFile() {
  if (currentProject.value === undefined) return;

  return new Promise((resolve) => {
    let extension: string;

    switch (currentProject.value?.parameters.language) {
      case 'C':
        extension = '.c';
        break;
      case 'C++':
        extension = '.cpp';
        break;
      case 'Python':
        extension = '.py';
        break;
      default:
        return;
    }

    addOneTimeCodeListenerPromise('create-file', () => {
      reload();
      resolve(undefined);
    });

    vscode.postMessage({
      type: 'create-file',
      path: currentProject.value?.links.src_directory.href,
      extension,
    });
  });
}

async function addIncludeFile() {
  if (currentProject.value === undefined) return;

  return new Promise((resolve) => {
    addOneTimeCodeListenerPromise('create-file', () => {
      reload();
      resolve(undefined);
    });

    vscode.postMessage({
      type: 'create-file',
      path: currentProject.value?.links.include_directory.href,
      extension: '.h',
    });
  });
}

async function deleteFile(filename: string, filepath: string) {
  return new Promise((resolve) => {
    const path = filepath + '/' + filename;

    addOneTimeCodeListenerPromise('delete-file', () => {
      reload();
      resolve(undefined);
    });

    vscode.postMessage({
      type: 'delete-file',
      path,
      filename,
    });
  });
}

function addOneTimeCodeListenerPromise(
  command: string,
  listener: (event: MessageEvent<any>) => void,
) {
  window.addEventListener('message', oneTimeEventListenerHandler(command, listener));
}

function oneTimeEventListenerHandler(
  command: string,
  listener: (event: MessageEvent<any>) => void,
) {
  return function (event: MessageEvent<any>) {
    if (event.data.command !== command) return;
    window.removeEventListener('message', oneTimeEventListenerHandler(command, listener));
    return listener(event);
  };
}
</script>

<style scoped>
.file-header {
  @apply flex justify-between items-center;

  span {
    @apply font-[500] uppercase;
  }

  div {
    @apply flex items-center;

    i {
      @apply cursor-pointer;
    }
  }
}
</style>

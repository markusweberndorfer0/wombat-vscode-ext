<template>
  <div class="flex flex-row justify-between items-center my-1">
    <span class="text-sm uppercase font-bold">Users</span>
    <i class="codicon codicon-refresh cursor-pointer" @click=""></i>
  </div>

  <div class="flex flex-row justify-around items-center">
    <select
      class="text-xs w-full bg-[var(--vscode-button-secondaryBackground)] text-[var(--vscode-foreground)]"
      v-model="currentUsername"
      @change="loadProjectsByCurrentUser()"
    >
      <option v-for="(username, index) in Object.keys(users)" :key="index" :value="username">
        {{ username }}
      </option>
    </select>
    <i class="codicon codicon-add pl-1 pr-0.5 cursor-pointer"></i>
    <i class="codicon codicon-remove px-0.5 cursor-pointer"></i>
  </div>

  <div class="mt-3 mb-1 text-sm uppercase font-bold">Projects</div>

  <div class="flex flex-row justify-around items-center">
    <select
      class="text-xs w-full bg-[var(--vscode-button-secondaryBackground)] text-[var(--vscode-foreground)]"
      v-model="currentProject"
    >
      <option v-for="(project, index) in projects" :key="index" :value="project.name">
        {{ project.name }}
      </option>
    </select>
    <i class="codicon codicon-add pl-1 pr-0.5 cursor-pointer"></i>
    <i class="codicon codicon-remove px-0.5 cursor-pointer"></i>
  </div>

  <div class="mt-3 mb-1 text-sm uppercase font-bold">Project files</div>

  <div class="file-header">
    <span class="ml-1.5 text-sm">Include files</span>
    <div>
      <i class="codicon codicon-add"></i>
    </div>
  </div>
  <div id="include-project-files"></div>

  <div class="file-header">
    <span class="ml-1.5 text-sm">Source files</span>
    <div>
      <i class="codicon codicon-add"></i>
    </div>
  </div>
  <div id="src-project-files"></div>
</template>

<script setup lang="ts">
import { ref, type Ref } from 'vue';
import { type ProjectModel } from '../../shared/models/projectModel';

const vscode = acquireVsCodeApi();

window.addEventListener('message', (event) => {
  if (event.data.command === 'refresh') {
    reload();
  }
});

const currentUsername: Ref<string | undefined> = ref(undefined);
const currentProject: Ref<string | undefined> = ref(undefined);

const users = ref([] as any[]);
const usernames = ref([] as string[]);
const projectLinks = ref([] as any[]);
const projects = ref([] as ProjectModel[]);

async function reload() {
  await loadUsers();
  await loadProjectsByCurrentUser();
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
  projectLinks.value = [];
  projects.value = [];

  addOneTimeCodeListenerPromise('projects', (event) => {
    projectLinks.value = JSON.parse(event.data.data).links;
    projects.value = JSON.parse(event.data.data).projects;

    if (currentProject.value === undefined) {
      currentUsername.value = usernames.value[0] || '';
    }
  });

  vscode.postMessage({
    type: 'get-projects',
    username: currentUsername.value,
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

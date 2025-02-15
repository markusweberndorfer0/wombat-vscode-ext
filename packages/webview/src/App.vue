<script setup lang="ts"></script>

<template>
  <div class="refresh-header">
    <span class="heading">Users</span>
    <i class="codicon codicon-refresh pointer" id="refresh"></i>
  </div>

  <div class="select">
    <select id="user-select"></select>
    <i class="codicon codicon-add" id="create-user"></i>
    <i class="codicon codicon-remove" id="delete-user"></i>
  </div>

  <div class="heading mt-15">Projects</div>

  <div class="select">
    <select id="project-select"></select>
    <i class="codicon codicon-add" id="create-project"></i>
    <i class="codicon codicon-remove" id="delete-project"></i>
  </div>

  <div class="heading mt-15">Project files</div>
  <div class="file-header">
    <span class="heading-project-files">Include files</span>
    <div>
      <i class="codicon codicon-add" id="create-include-file"></i>
    </div>
  </div>
  <div id="include-project-files"></div>

  <div class="file-header">
    <span class="heading-project-files">Source files</span>
    <div>
      <i class="codicon codicon-add" id="create-src-file"></i>
    </div>
  </div>
  <div id="src-project-files"></div>
</template>

<style scoped></style>

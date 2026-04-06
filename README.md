# Wombat VSCode extension

## Contributors

- Markus Weberndorfer

## Features

- Connect to a Wombat by address, view connection status, and browse users, projects, source/include/data/binary files, and the backup folder from the tree
- Download full projects on expansion, open files in VS Code, and auto-save edits back to Wombat
- Detect client/server checksum mismatches before upload or redownload, create conflict backups with tagged folders and `_server` snapshots, and ask for explicit confirmation before overwriting
- Compile, run, and stop Wombat projects from VS Code
- Display Wombat project output, refresh the tree, and change the Wombat address from the sidebar

## Requirements

- Established connection to the Wombat

## How 2 develop

Install dependencies

```bash
npm i
```

Start watcher

```bash
npm run watch
```

## How 2 package

Compile the extension

```bash
npm run compile
```

Package the extension

```bash
npm install -g @vscode/vsce # if vsce not installed
vsce package --out ./extension.vsix
```

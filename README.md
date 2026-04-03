# Wombat VSCode extension

## Contributors

- Markus Weberndorfer

## Features

- Create and delete Wombat users and projects
- Browse projects in the VS Code tree view
- Open, save, and auto-upload source files
- Compile, run, and stop Wombat projects
- Manage source and include files from the tree
- Display Wombat project output

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

## Release Notes

[CHANGELOG.md](./CHANGELOG.md)

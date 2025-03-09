# Wombat VSCode extension

## Contributors

- Markus Weberndorfer

## Setting up symlink support

> ONLY required for Windows users

Do these things BEFORE cloning the repo:

1. Activate Developer Mode in Settings
2. Enable git symlinks: `git config --global core.symlinks true`

If symlinks still don't work with the given settings, see this StackOverflow answer: https://stackoverflow.com/a/59761201

## How 2 develop

Install dependencies

```bash
npm i
```

Start watcher

```bash
npm run watch
```

Start developing.

## How 2 package

Change to webview dir and build

```bash
cd ./packages/webview && npm run build
```

Change to extension and package

```bash
npm install -g @vscode/vsce # if vsce not installed
cd ../extension && vsce package --out ../../
```

Now the package is located in the root directory

## Release Notes

[CHANGELOG.md](./packages/extension/CHANGELOG.md)

# Wombat VSCode extension

## Contributors

- Markus Weberndorfer

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

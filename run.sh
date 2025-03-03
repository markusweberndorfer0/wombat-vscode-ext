
set -e -o pipefail

cd ./packages/webview
npm run build
cd ../extension
vsce package --out ../../

cd ../../
#TODO: Allow this to work with normal vscode as well
vscodium --extensionDevelopmentPath=/home/daniel/Desktop/shared/coding/wombat-vscode-ext/packages/extension

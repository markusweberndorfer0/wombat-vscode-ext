import { exec as _exec, execSync } from "child_process";
import { promisify } from "util";

const childOptions = {
  shell: "bash",
  stdio: "inherit",
};

const exec = promisify(_exec);

(async () => {
  await Promise.all([
    _exec("cd packages/webview/ && npm run build", childOptions),
    _exec("cd packages/extension/ && npm run compile", childOptions),
  ]);
  execSync("cd packages/extension/ && npm run dev", childOptions);
})();

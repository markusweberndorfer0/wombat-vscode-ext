import fs from 'node:fs';
import fse from 'fs-extra';

export function backupProject(projectDir: string) {
    try {
        if (!fs.existsSync(projectDir)) {
            return;
        }
    } catch (e) {
        return;
    }

    const backupPath = `${projectDir}.bak`;

    if (fs.existsSync(backupPath)) {
        fs.rmdirSync(backupPath);
    }

    fse.copySync(projectDir, backupPath);
}

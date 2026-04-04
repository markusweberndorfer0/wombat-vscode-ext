import fs from 'node:fs';
import { API } from './api';
import os from 'node:os';
import { ProjectModel } from './models/projectModel';
import fse from 'fs-extra';
import path from 'node:path';

/**
 * Backups a project and re-downloads files, so files
 * on the server wont be overridden
 *
 * If a project doesn't exist locally, it returns
 * @param username
 * @param projectname
 * @param projectDir project directory
 * @param project ProjectModel
 */
export function saveAndBackupProject(
    username: string,
    projectname: string,
    projectDir: string,
    project: ProjectModel
): void {
    try {
        if (!fs.existsSync(projectDir)) {
            return;
        }
    } catch (e) {
        return;
    }

    const backupPath = `${projectDir}.bak`;

    if (fs.existsSync(backupPath)) {
        fse.rmSync(backupPath, { recursive: true });
    }

    fse.mkdirSync(backupPath, { recursive: true });

    fse.copySync(projectDir, backupPath, {
        filter: (src) => !src.endsWith('.json')
    });

    if (!!project.source_files) {
        project.source_files.forEach((sourceFile) => {
            downloadFile(username, projectname, sourceFile.path);
        });
    }

    if (!!project.include_files) {
        project.include_files.forEach((includeFile) => {
            downloadFile(username, projectname, includeFile.path);
        });
    }
}

/**
 * Downloads a file from wombat
 * @param username
 * @param projectname
 * @param filepath
 * @returns path of downloaded file
 */
export async function downloadFile(
    username: string,
    projectname: string,
    filepath: string
): Promise<string> {
    let getFileData: any = await API.getFile(filepath);

    let fileDir: string = getProjectTempDir(username, projectname);

    if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
    }

    let codeFilePath: string = `${fileDir}/${getFileData.name}`;

    let configData: any = {
        filepathOnWombat: getFileData.path,
        username,
        projectname,
    };

    let configFilepath: string = `${fileDir}/${getFileData.name}.json`;

    const decodedFileContent = decodeFileContent(getFileData.content);
    fs.writeFileSync(codeFilePath, decodedFileContent);
    fs.writeFileSync(configFilepath, JSON.stringify(configData));

    return codeFilePath;
}

export function getProjectTempDir(username: string, projectname: string): string {
    return path.join(getExtensionTempDir(), username, projectname);
}

export function getExtensionTempDir(): string {
    return path.join(os.tmpdir(), "vscode-wombat-ext");
}
function decodeFileContent(content: unknown): string | Buffer {
    if (Buffer.isBuffer(content)) {
        return content;
    }

    if (typeof content === 'string') {
        return Buffer.from(content, 'base64');
    }

    return Buffer.from(JSON.stringify(content), 'utf8');
}

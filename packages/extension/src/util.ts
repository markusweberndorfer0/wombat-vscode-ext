import fs from 'node:fs';
import fse from 'fs-extra';
import { API } from './api';
import os from 'node:os';
import { ProjectModel } from '../../shared/models/projectModel';

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
        fs.rmSync(backupPath, { recursive: true });
    }

    fse.moveSync(projectDir, backupPath);

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

    let fileDir: string =
        os.tmpdir() + '/vscode_wombat_ext/' + username + '/' + projectname;

    if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
    }

    let codeFilePath: string = fileDir + '/' + getFileData.name;

    let configData: any = {
        filepathOnWombat: getFileData.path,
        username,
        projectname,
    };

    let configFilepath: string = fileDir + '/' + getFileData.name + '.json';

    let decodedFileContent: string = atob(getFileData.content);
    fs.writeFileSync(codeFilePath, decodedFileContent);
    fs.writeFileSync(configFilepath, JSON.stringify(configData));

    return codeFilePath;
}

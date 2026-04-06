import fs from 'node:fs';
import { API } from './api';
import os from 'node:os';
import fse from 'fs-extra';
import path from 'node:path';
import crypto from 'node:crypto';

const BACKUP_ROOT = path.join(os.homedir(), '.wombat', 'backups');
const BACKUP_RETENTION_MS = 31 * 24 * 60 * 60 * 1000; // 31 days in milliseconds

export interface DownloadFileOptions {
    onBeforeOverwrite?: (context: {
        fileDir: string;
        codeFilePath: string;
        projectDir: string;
    }) => Promise<void> | void;
}

export function createProjectBackupSnapshot(
    username: string,
    projectname: string,
    projectDir: string,
    backupTag?: string
): string | undefined {
    try {
        if (!fs.existsSync(projectDir)) {
            return undefined;
        }
    } catch (e) {
        return undefined;
    }

    const backupPath = createBackupPath(username, projectname, backupTag);

    fse.mkdirSync(path.dirname(backupPath), { recursive: true });
    fse.copySync(projectDir, backupPath, {
        filter: (src) => !src.endsWith('.json')
    });

    pruneOldBackups(username, projectname);

    return backupPath;
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
    filepath: string,
    filetype: "source"|"include"|"data"|"binary",
    options?: DownloadFileOptions
): Promise<string> {
    let getFileData: any = await API.getFile(filepath);

    let fileDir: string = getProjectTempDir(username, projectname, filetype);

    if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
    }

    let codeFilePath: string = `${fileDir}/${getFileData.name}`;

    if (fs.existsSync(codeFilePath) && options?.onBeforeOverwrite) {
        await options.onBeforeOverwrite({
            fileDir,
            codeFilePath,
            projectDir: path.join(getExtensionTempDir(), username, projectname),
        });
    }

    let configData: any = {
        filepathOnWombat: getFileData.path,
        username,
        projectname,
        contentChecksum: getContentChecksum(getFileData.content),
    };

    let configFilepath: string = `${fileDir}/${getFileData.name}.json`;

    const decodedFileContent = decodeRemoteContent(getFileData.content);
    fs.writeFileSync(codeFilePath, decodedFileContent);
    fs.writeFileSync(configFilepath, JSON.stringify(configData));

    return codeFilePath;
}

export function getContentChecksum(content: unknown): string {
    return crypto.createHash('sha256').update(decodeRemoteContent(content)).digest('hex');
}

export function getProjectTempDir(username: string, projectname: string, filetype: "source"|"include"|"data"|"binary"): string {
    return path.join(getExtensionTempDir(), username, projectname, filetype);
}

export function getExtensionTempDir(): string {
    return path.join(os.tmpdir(), "vscode-wombat-ext");
}

export function getProjectBackupDir(username: string, projectname: string): string {
    return path.join(BACKUP_ROOT, username, projectname);
}

function createBackupPath(
    username: string,
    projectname: string,
    backupTag?: string
): string {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupFolderName = backupTag
        ? `${timestamp}_${backupTag}`
        : timestamp;

    return path.join(BACKUP_ROOT, username, projectname, backupFolderName);
}

function pruneOldBackups(username: string, projectname: string): void {
    const projectBackupDir = getProjectBackupDir(username, projectname);

    if (!fs.existsSync(projectBackupDir)) {
        return;
    }

    const cutoffTime = Date.now() - BACKUP_RETENTION_MS;

    for (const entry of fs.readdirSync(projectBackupDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) {
            continue;
        }

        const entryPath = path.join(projectBackupDir, entry.name);
        const stats = fs.statSync(entryPath);

        if (stats.mtimeMs < cutoffTime) {
            fse.rmSync(entryPath, { recursive: true, force: true });
        }
    }
}

export function decodeRemoteContent(content: unknown): Buffer {
    if (Buffer.isBuffer(content)) {
        return content;
    }

    if (typeof content === 'string') {
        return Buffer.from(content, 'base64');
    }

    return Buffer.from(JSON.stringify(content), 'utf8');
}

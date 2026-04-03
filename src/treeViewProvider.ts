import * as vscode from 'vscode';
import { API } from './api';
import os from 'node:os';
import { downloadFile, saveAndBackupProject } from './util';
import { ProjectModel } from './models/projectModel';

type TreeNodeKind =
    | 'status'
    | 'user'
    | 'project'
    | 'section'
    | 'file';

type ProjectSectionKind = 'source' | 'include' | 'binary';

interface TreeNodeData {
    username?: string;
    projectname?: string;
    apiPath?: string;
    filepath?: string;
    filename?: string;
    sectionKind?: ProjectSectionKind;
    project?: ProjectModel;
}

class WombatTreeItem extends vscode.TreeItem {
    constructor(
        label: string,
        collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly kind: TreeNodeKind,
        public readonly data: TreeNodeData = {}
    ) {
        super(label, collapsibleState);
    }
}

export class TreeViewProvider
    implements vscode.TreeDataProvider<WombatTreeItem>, vscode.Disposable
{
    private static instance: TreeViewProvider | null = null;
    private readonly onDidChangeTreeDataEmitter =
        new vscode.EventEmitter<void>();
    public readonly onDidChangeTreeData =
        this.onDidChangeTreeDataEmitter.event;
    private wombatAddress = '192.168.125.1:8888';
    private wombatConnected = false;

    private constructor(private readonly context: vscode.ExtensionContext) {}

    public static getInstance(
        context: vscode.ExtensionContext
    ): TreeViewProvider {
        if (!TreeViewProvider.instance) {
            TreeViewProvider.instance = new TreeViewProvider(context);
        }

        return TreeViewProvider.instance;
    }

    dispose(): void {
        this.onDidChangeTreeDataEmitter.dispose();
    }

    refresh(): void {
        this.onDidChangeTreeDataEmitter.fire();
    }

    updateAddress(address: string): void {
        this.wombatAddress = address;
        this.wombatConnected = false;
        this.refresh();
    }

    setConnectionStatus(connected: boolean): void {
        this.wombatConnected = connected;
        this.refresh();
    }

    getTreeItem(element: WombatTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: WombatTreeItem): Promise<WombatTreeItem[]> {
        if (!element) {
            return this.getRootChildren();
        }

        switch (element.kind) {
            case 'status':
                return [];
            case 'user':
                return this.getProjectsForUser(element.data.username ?? '');
            case 'project':
                return this.getProjectSections(element.data);
            case 'section':
                return this.getSectionFiles(element.data);
            case 'file':
                return [];
        }
    }

    async createUser(): Promise<void> {
        const username = await vscode.window.showInputBox({
            prompt: 'Enter the name of the new user',
            placeHolder: 'Name of new user',
        });

        if (!username) {
            vscode.window.showErrorMessage(
                'No user name given, no user created'
            );
            return;
        }

        try {
            await API.createUser(username);
            vscode.window.showInformationMessage(`User ${username} was created`);
            this.refresh();
        } catch (error) {
            vscode.window.showErrorMessage(
                `Error while trying to create user ${error}`
            );
        }
    }

    async deleteUser(user: WombatTreeItem): Promise<void> {
        const username = user.data.username;
        if (!username) {
            return;
        }

        const answer = await vscode.window.showInformationMessage(
            `Do you really want to delete user ${username}?`,
            'Yes',
            'No'
        );

        if (answer !== 'Yes') {
            vscode.window.showInformationMessage("User wasn't deleted!");
            return;
        }

        try {
            await API.deleteUser(username);
            vscode.window.showInformationMessage(`User ${username} was deleted`);
            this.refresh();
        } catch (error) {
            vscode.window.showErrorMessage(
                `Error while trying to delete user ${error}`
            );
        }
    }

    async createProject(user: WombatTreeItem): Promise<void> {
        const username = user.data.username;
        if (!username) {
            return;
        }

        const projectName = await vscode.window.showInputBox({
            prompt: 'Enter the name of the new project',
            placeHolder: 'Name of new project',
        });

        if (!projectName) {
            vscode.window.showErrorMessage(
                'No project name given, no project created'
            );
            return;
        }

        const programmingLanguage = await vscode.window.showQuickPick([
            'C',
            'C++',
            'Python',
        ]);

        if (!programmingLanguage) {
            vscode.window.showErrorMessage(
                'No programming language was selected!'
            );
            return;
        }

        try {
            await API.createProject(
                programmingLanguage,
                username,
                projectName
            );
            vscode.window.showInformationMessage(
                `Project ${projectName} was created`
            );
            this.refresh();
        } catch (error) {
            vscode.window.showErrorMessage(
                `Error while trying to create project ${error}`
            );
        }
    }

    async deleteProject(project: WombatTreeItem): Promise<void> {
        const username = project.data.username;
        const projectname = project.data.projectname;

        if (!username || !projectname) {
            return;
        }

        const answer = await vscode.window.showInformationMessage(
            `Do you really want to delete project ${projectname}?`,
            'Yes',
            'No'
        );

        if (answer !== 'Yes') {
            vscode.window.showInformationMessage("Project wasn't deleted!");
            return;
        }

        try {
            await API.deleteProject(username, projectname);
            vscode.window.showInformationMessage('Project was deleted');
            this.refresh();
        } catch (error) {
            vscode.window.showErrorMessage(
                `Error while trying to delete project ${error}`
            );
        }
    }

    async createFile(section: WombatTreeItem): Promise<void> {
        const apiPath = section.data.apiPath;
        if (!apiPath) {
            return;
        }

        const filename = await vscode.window.showInputBox({
            prompt: 'Enter filename including extension',
            placeHolder: 'example.c',
        });

        if (!filename) {
            vscode.window.showErrorMessage(
                'No filename given, no file created'
            );
            return;
        }

        try {
            await API.createFile(apiPath, filename);
            vscode.window.showInformationMessage(`File ${filename} was created`);
            this.refresh();
        } catch (error) {
            vscode.window.showErrorMessage(`${error}`);
        }
    }

    async deleteFile(file: WombatTreeItem): Promise<void> {
        const apiPath = file.data.apiPath;
        const filename = file.data.filename ?? 'file';

        if (!apiPath) {
            return;
        }

        const answer = await vscode.window.showInformationMessage(
            `Do you really want to delete ${filename}?`,
            'Yes',
            'No'
        );

        if (answer !== 'Yes') {
            vscode.window.showInformationMessage("File wasn't deleted!");
            return;
        }

        try {
            await API.deleteFile(apiPath);
            vscode.window.showInformationMessage('File was deleted');
            this.refresh();
        } catch (error) {
            vscode.window.showErrorMessage(`${error}`);
        }
    }

    async openFile(file: WombatTreeItem): Promise<void> {
        const username = file.data.username;
        const projectname = file.data.projectname;
        const filepath = file.data.filepath;

        if (!username || !projectname || !filepath) {
            return;
        }

        const codeFilePath = await downloadFile(username, projectname, filepath);

        await vscode.window.showTextDocument(
            await vscode.workspace.openTextDocument(vscode.Uri.file(codeFilePath)),
            vscode.ViewColumn.One
        );
    }

    saveProjectBackup(project: WombatTreeItem): void {
        const username = project.data.username;
        const projectname = project.data.projectname;
        const projectModel = project.data.project;

        if (!username || !projectname || !projectModel) {
            return;
        }

        const projectPath =
            os.tmpdir() + '/vscode-wombat-ext/' + username + '/' + projectname;

        saveAndBackupProject(username, projectname, projectPath, projectModel);
    }

    private async getRootChildren(): Promise<WombatTreeItem[]> {
        const statusItem = this.createStatusItem();

        if (!this.wombatConnected) {
            return [statusItem];
        }

        try {
            const users = await API.getUsers();
            const userItems = this.normalizeUsers(users)
                .map((username) => this.createUserItem(username))
                .sort((left, right) =>
                    String(left.label ?? '').localeCompare(
                        String(right.label ?? '')
                    )
                );

            return [statusItem, ...userItems];
        } catch (error) {
            return [
                statusItem,
                this.createInfoItem(
                    `Unable to load users: ${error}`,
                    'Check the Wombat address and connection.'
                ),
            ];
        }
    }

    private async getProjectsForUser(username: string): Promise<WombatTreeItem[]> {
        if (!username) {
            return [];
        }

        try {
            const projects = await API.getProjects(username);
            return this.normalizeProjects(projects)
                .map((projectname) =>
                    this.createProjectItem(username, projectname)
                )
                .sort((left, right) =>
                    String(left.label ?? '').localeCompare(
                        String(right.label ?? '')
                    )
                );
        } catch (error) {
            return [
                this.createInfoItem(
                    `Unable to load projects for ${username}: ${error}`,
                    'Try refreshing the tree.'
                ),
            ];
        }
    }

    private async getProjectSections(
        data: TreeNodeData
    ): Promise<WombatTreeItem[]> {
        const username = data.username;
        const projectname = data.projectname;

        if (!username || !projectname) {
            return [];
        }

        try {
            const project = (await API.getProject(
                username,
                projectname
            )) as ProjectModel;

            return [
                this.createSectionItem(
                    'Source Files',
                    'source',
                    username,
                    projectname,
                    project.links.src_directory.href,
                    project,
                    project.source_files ?? []
                ),
                this.createSectionItem(
                    'Include Files',
                    'include',
                    username,
                    projectname,
                    project.links.include_directory.href,
                    project,
                    project.include_files ?? []
                ),
                this.createSectionItem(
                    'Binary Files',
                    'binary',
                    username,
                    projectname,
                    project.links.bin_directory.href,
                    project,
                    project.binary_files ?? []
                ),
            ];
        } catch (error) {
            return [
                this.createInfoItem(
                    `Unable to load project ${projectname}: ${error}`,
                    'Try refreshing the tree.'
                ),
            ];
        }
    }

    private async getSectionFiles(
        data: TreeNodeData
    ): Promise<WombatTreeItem[]> {
        const project = data.project;
        const username = data.username;
        const projectname = data.projectname;

        if (!project || !username || !projectname) {
            return [];
        }

        const files = this.getFilesForSection(data.sectionKind, project);

        return files
            .map((file) =>
                this.createFileItem(
                    username,
                    projectname,
                    file.name,
                    file.path,
                    file.path
                )
            )
            .sort((left, right) =>
                String(left.label ?? '').localeCompare(
                    String(right.label ?? '')
                )
            );
    }

    private getFilesForSection(
        sectionKind: ProjectSectionKind | undefined,
        project: ProjectModel
    ): Array<{ name: string; path: string; type: string }> {
        switch (sectionKind) {
            case 'source':
                return project.source_files ?? [];
            case 'include':
                return project.include_files ?? [];
            case 'binary':
                return project.binary_files ?? [];
            default:
                return [];
        }
    }

    private createStatusItem(): WombatTreeItem {
        const item = new WombatTreeItem(
            this.wombatConnected
                ? `Connected to ${this.wombatAddress}`
                : `Disconnected from ${this.wombatAddress}`,
            vscode.TreeItemCollapsibleState.None,
            'status'
        );

        item.description = this.wombatConnected
            ? 'Click to change address'
            : 'Set the address to connect';
        item.contextValue = 'wombat-status';
        item.iconPath = new vscode.ThemeIcon(
            this.wombatConnected ? 'plug' : 'error'
        );
        item.command = {
            command: 'kipr-wombat-vscode-extension.set-wombat-address',
            title: 'Set Wombat Address',
        };

        return item;
    }

    private createInfoItem(label: string, description: string): WombatTreeItem {
        const item = new WombatTreeItem(
            label,
            vscode.TreeItemCollapsibleState.None,
            'status'
        );

        item.description = description;
        item.contextValue = 'wombat-status';
        item.iconPath = new vscode.ThemeIcon('info');

        return item;
    }

    private createUserItem(username: string): WombatTreeItem {
        const item = new WombatTreeItem(
            username,
            vscode.TreeItemCollapsibleState.Collapsed,
            'user',
            { username }
        );

        item.contextValue = 'wombat-user';
        item.iconPath = new vscode.ThemeIcon('account');

        return item;
    }

    private createProjectItem(
        username: string,
        projectname: string
    ): WombatTreeItem {
        const item = new WombatTreeItem(
            projectname,
            vscode.TreeItemCollapsibleState.Collapsed,
            'project',
            { username, projectname }
        );

        item.contextValue = 'wombat-project';
        item.iconPath = new vscode.ThemeIcon('folder');

        return item;
    }

    private createSectionItem(
        label: string,
        sectionKind: ProjectSectionKind,
        username: string,
        projectname: string,
        apiPath: string,
        project: ProjectModel,
        files: Array<{ name: string }>
    ): WombatTreeItem {
        const item = new WombatTreeItem(
            label,
            vscode.TreeItemCollapsibleState.Collapsed,
            'section',
            {
                username,
                projectname,
                apiPath,
                sectionKind,
                project,
            }
        );

        item.contextValue =
            sectionKind === 'binary'
                ? 'wombat-section-readonly'
                : 'wombat-section';
        item.description = `${files.length} item${files.length === 1 ? '' : 's'}`;
        item.iconPath = new vscode.ThemeIcon('folder-opened');

        return item;
    }

    private createFileItem(
        username: string,
        projectname: string,
        filename: string,
        filepath: string,
        apiPath: string
    ): WombatTreeItem {
        const item = new WombatTreeItem(
            filename,
            vscode.TreeItemCollapsibleState.None,
            'file',
            { username, projectname, filepath, apiPath, filename }
        );

        item.contextValue = 'wombat-file';
        item.tooltip = filepath;
        item.iconPath = new vscode.ThemeIcon('file');
        item.command = {
            command: 'kipr-wombat-vscode-extension.open-remote-file',
            title: 'Open File',
            arguments: [item],
        };

        return item;
    }

    private normalizeUsers(users: unknown): string[] {
        if (Array.isArray(users)) {
            return users
                .map((entry) =>
                    this.extractName(entry, ['username', 'name', 'user'])
                )
                .filter((entry): entry is string => Boolean(entry));
        }

        if (this.isRecord(users)) {
            return Object.keys(users).filter(
                (entry) => entry.length > 0 && entry !== 'links'
            );
        }

        return [];
    }

    private normalizeProjects(projects: unknown): string[] {
        if (Array.isArray(projects)) {
            return projects
                .map((entry) =>
                    this.extractName(entry, ['projectname', 'name', 'project'])
                )
                .filter((entry): entry is string => Boolean(entry));
        }

        if (this.isRecord(projects)) {
            const projectList = projects['projects'];

            if (Array.isArray(projectList)) {
                return projectList
                    .map((entry) =>
                        this.extractName(entry, [
                            'projectname',
                            'name',
                            'project',
                        ])
                    )
                    .filter((entry): entry is string => Boolean(entry));
            }

            return Object.keys(projects).filter(
                (entry) => entry !== 'links' && entry !== 'projects'
            );
        }

        return [];
    }

    private extractName(
        entry: unknown,
        keys: string[]
    ): string | undefined {
        if (typeof entry === 'string') {
            return entry;
        }

        if (!this.isRecord(entry)) {
            return undefined;
        }

        for (const key of keys) {
            const value = entry[key];
            if (typeof value === 'string' && value.length > 0) {
                return value;
            }
        }

        return undefined;
    }

    private isRecord(value: unknown): value is Record<string, unknown> {
        return typeof value === 'object' && value !== null;
    }
}

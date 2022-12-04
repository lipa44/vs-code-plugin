import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class BuildFoldersProvider implements vscode.TreeDataProvider<CsprojFileItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<CsprojFileItem | undefined | void> = new vscode.EventEmitter<CsprojFileItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<CsprojFileItem | undefined | void> = this._onDidChangeTreeData.event;

    refresh = (): void => this._onDidChangeTreeData.fire();

    constructor(private workspaceRoot: string | undefined) {
    }

    getTreeItem = (element: CsprojFileItem): vscode.TreeItem => element;

    getChildren = (element?: CsprojFileItem): Thenable<CsprojFileItem[]> => {
        if (!this.workspaceRoot) {
            vscode.window.showInformationMessage('No dependency in empty workspace');
            return Promise.resolve([]);
        }

        if (element) {
            return Promise.resolve(
                this.getDepsInProject(element?.projectPath)
            );
        } else {
            const solutionPaths: string[] = this.getFilesRecursively(this.workspaceRoot, []);

            const projects: CsprojFileItem[] = [];

            solutionPaths.forEach(solutionPath => {
                if (!this.pathExists(solutionPath)) {
                    return;
                }

                projects.push(...this.getDepsInSolution(solutionPath));
            });

            if (projects.length > 0) {
                return Promise.resolve(projects);
            } else {
                vscode.window.showInformationMessage('Workspace has no solution file');
                return Promise.resolve([]);
            }
        }
    };


    private getDepsInSolution = (solutionFilePath: string): CsprojFileItem[] => {
        if (!this.pathExists(solutionFilePath)) {
            return [];
        }

        const solutionFile = fs.readFileSync(solutionFilePath, 'utf-8');
        const solutionLines = solutionFile.split(this.getLineDividerForOS());
        const projectLineRegex = new RegExp(/(?<proj>Project\("{(?<guid>[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-?){3}[0-9a-fA-F]{12}?)}"\) = "(?<projName>.*?)", "(?<projPath>.*?.csproj)")/);

        const projPaths = solutionLines
            .filter(line => projectLineRegex.test(line))
            .map(line => {
                const regexExec = projectLineRegex.exec(line);
                return this.toValidOsPath(regexExec!.groups!['projPath']);
            });

        const solutionPath = solutionFilePath.substring(0, solutionFilePath.lastIndexOf(this.getPathDividerForOS()));

        return projPaths.map(projPath => {
            const absoluteProjPath = path.join(solutionPath, projPath);

            const state = this.getDepsInProject(absoluteProjPath).length > 0
                ? vscode.TreeItemCollapsibleState.Expanded
                : vscode.TreeItemCollapsibleState.None;

            return new CsprojFileItem(projPath, absoluteProjPath, state);
        });
    };

    private getDepsInProject = (projectPath: string): CsprojFileItem[] => {
        projectPath = projectPath.substring(0, projectPath.lastIndexOf(this.getPathDividerForOS()));
        if (!this.pathExists(projectPath)) {
            return [];
        }

        const fs = require('fs');
        const files = fs.readdirSync(projectPath);

        return files
            .filter((file: string) => file === 'bin' || file === 'obj')
            .map((file: string) => new BuildFolderItem(file, vscode.TreeItemCollapsibleState.None, projectPath));
    };


    private pathExists = (p: string): boolean => {
        try {
            fs.accessSync(p);
        } catch (err) {
            return false;
        }
        return true;
    };

    private getLineDividerForOS = () => {
        const platform = process.platform;

        switch (platform) {
            case "darwin":
                return "\n";
            case "win32":
                return "\r\n";
            default:
                throw new Error("Sorry, we don't support your OS :(");
        }
    };

    private toValidOsPath = (path: string): string => {
        const platform = process.platform;

        switch (platform) {
            case "darwin":
                return path.replaceAll("\\", this.getPathDividerForOS());
            case "win32":
                return path.replaceAll("/", this.getPathDividerForOS());
            default:
                throw new Error("Sorry, we don't support your OS :(");
        }
    };

    private getPathDividerForOS = () => {
        const platform = process.platform;

        switch (platform) {
            case "darwin":
                return "/";
            case "win32":
                return "\\";
            default:
                throw new Error("Sorry, we don't support your OS :(");
        }
    };

    private getFilesRecursively = (directory: string, files: string[]) => {
        const filesInDirectory = fs.readdirSync(directory, {withFileTypes: true});

        for (const file of filesInDirectory) {
            const absolute = path.join(directory, file.name);
            if (fs.statSync(absolute).isDirectory()) {
                this.getFilesRecursively(absolute, files);
            } else {
                if (file.name.split('.').pop() !== "sln") {
                    continue;
                }

                files.push(absolute);
            }
        }

        return files;
    };
}

class BuildFolderItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly projectPath: string,
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label}`;
        this.description = `${this.label} folder`;
    }

    iconPath = {
        light: path.join(__filename, '..', '..', 'resources', 'light', 'folder.svg'),
        dark: path.join(__filename, '..', '..', 'resources', 'dark', 'folder.svg')
    };
}

class CsprojFileItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly projectPath: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label}`.replace(".csproj", "");
        this.description = `${this.label}`;
    }

    iconPath = {
        light: path.join(__filename, '..', '..', 'resources', 'light', 'folder.svg'),
        dark: path.join(__filename, '..', '..', 'resources', 'dark', 'folder.svg')
    };
}

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class BuildFoldersProvider implements vscode.TreeDataProvider<CsprojFileItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<CsprojFileItem | undefined | void> = new vscode.EventEmitter<CsprojFileItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<CsprojFileItem | undefined | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    constructor(private workspaceRoot: string | undefined) { }

    getTreeItem(element: CsprojFileItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: CsprojFileItem): Thenable<CsprojFileItem[]> {
        if (!this.workspaceRoot) {
            vscode.window.showInformationMessage('No dependency in empty workspace');
            return Promise.resolve([]);
        }

        if (element) {
            return Promise.resolve(
                this.getDepsInProject(path.join(this.workspaceRoot, element?.label))
            );
        } else {
            const solutionFilePath = path.join(this.workspaceRoot, 'PhotoCrash.sln');
            if (this.pathExists(solutionFilePath)) {
                return Promise.resolve(this.getDepsInSolution(solutionFilePath));
            } else {
                vscode.window.showInformationMessage('Workspace has no solution file');
                return Promise.resolve([]);
            }
        }
    }


    private getDepsInSolution(projectPath: string): CsprojFileItem[] {
        if (!this.pathExists(projectPath)) return [];

        const solutionFile = fs.readFileSync(projectPath, 'utf-8');
        const solutionLines = solutionFile.split(this.getDeviderForOS());
        const projectLineRegex = new RegExp(/(?<proj>Project\("{(?<guid>[0-9a-fA-F]{8}[-]{1}([0-9a-fA-F]{4}[-]?){3}[0-9a-fA-F]{12}?)}"\) = "(?<projName>.*?)")/);

        const projNames: string[] = [];

        solutionLines.forEach(line => {
            if (!projectLineRegex.test(line)) return;

            const regexExec = projectLineRegex.exec(line);

            const projName = regexExec!.groups!['projName'];

            projNames.push(projName);
        });

        const deps = projNames.map(dep => new CsprojFileItem(dep, vscode.TreeItemCollapsibleState.Collapsed));

        return deps;
    }

    private getDepsInProject(projectPath: string): CsprojFileItem[] {
        if (!this.pathExists(projectPath)) return [];

        var fs = require('fs');
        var files = fs.readdirSync(projectPath);

        var buildFolders = files
            .filter((file: string) => file === 'bin' || file === 'obj')
            .map((file: string) => new BuildFolderItem(file, vscode.TreeItemCollapsibleState.None, projectPath));

        return buildFolders;
    }


    private pathExists(p: string): boolean {
        try {
            fs.accessSync(p);
        } catch (err) {
            return false;
        }
        return true;
    }

    private getDeviderForOS() {
        const platform = process.platform;

        switch (platform) {
            case "darwin":
                return "\n";
            case "win32":
                return "\r\n";
            default:
                throw new Error("Sorry, we don't support your OS :(");
        }
    }
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
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label}`;
        this.description = `${this.label}.csproj`;
    }

    iconPath = {
        light: path.join(__filename, '..', '..', 'resources', 'light', 'folder.svg'),
        dark: path.join(__filename, '..', '..', 'resources', 'dark', 'folder.svg')
    };
}

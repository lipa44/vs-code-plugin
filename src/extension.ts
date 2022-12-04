// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { BuildFoldersProvider } from './buildFoldersProvider';
import { BuildFoldersShredder } from './buildFoldersShredder';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export const activate = (context: vscode.ExtensionContext) => {

	const rootPath =
	vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
		? vscode.workspace.workspaceFolders[0].uri.fsPath
		: undefined;

	const shredder = new BuildFoldersShredder();
	const buildfoldersProvider = new BuildFoldersProvider(rootPath);

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "superultracoolextension" is now active!');

	let deletedEntryDisposable = vscode.commands.registerCommand('buildFolders.deleteEntry', (e) => {
		const schredderResult = shredder.tryDeleteBuildFolder(e.projectPath, e.label);
		
		if (schredderResult.result) {
			buildfoldersProvider.refresh();
			vscode.window.showInformationMessage(`Deleted!`);
		}
		else {
			vscode.window.showErrorMessage(`${schredderResult.exception}`);
		}
	});

	let refreshEntryDisposable = vscode.commands.registerCommand('buildFolders.refreshEntry', () => {
		buildfoldersProvider.refresh();
		vscode.window.showInformationMessage('Refreshed!');
	});

	vscode.window.registerTreeDataProvider('buildFolders',buildfoldersProvider);

	context.subscriptions.push(deletedEntryDisposable);
	context.subscriptions.push(refreshEntryDisposable);
};

// This method is called when your extension is deactivated
export const deactivate = () => { };
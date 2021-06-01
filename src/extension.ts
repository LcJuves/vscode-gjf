/**
 * Created at 2021/6/2 00:00.
 * 
 * @author Liangcheng Juves
 */

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { execSync, ExecSyncOptionsWithStringEncoding } from 'child_process';

const gjfDocumentFilter: vscode.DocumentFilter = {
	language: 'java',
	scheme: 'file'
};

const gjfExecJarPath = vscode.workspace.getConfiguration('vscode-gjf').get('execJarPath') as string;

class GJFDocumentRangeFormattingEditProvider implements vscode.DocumentRangeFormattingEditProvider {
	provideDocumentRangeFormattingEdits(
		document: vscode.TextDocument,
		range: vscode.Range,
		_options: vscode.FormattingOptions,
		_token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.TextEdit[]> {
		if (range.isEmpty) {
			return Promise.resolve([]);
		}

		try {
			let _cmd: string = `java -jar ${gjfExecJarPath} -`;
			let filesEncoding = vscode.workspace.getConfiguration('files').get('encoding') as string;
			let _stdout: string = execSync(_cmd, {
				encoding: filesEncoding,
				input: document.getText(range),
				windowsHide: true
			} as ExecSyncOptionsWithStringEncoding);
			return Promise.resolve([vscode.TextEdit.replace(range, _stdout)]);
		} catch (e) {
			if (!gjfExecJarPath || gjfExecJarPath.trim() === '') {
				vscode.window.showErrorMessage(
					'vscode-gjf.execJarPath is not defined'
				);
			} else {
				vscode.window.showErrorMessage(
					`Run vscode-gjf with error: ${e}`
				);
			}
			return Promise.reject(e);
		}
	}
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.languages.registerDocumentRangeFormattingEditProvider(
			gjfDocumentFilter,
			new GJFDocumentRangeFormattingEditProvider()
		)
	);
}

// this method is called when your extension is deactivated
export function deactivate() { }

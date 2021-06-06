/**
 * Created at 2021/6/2 00:00.
 * 
 * @author Liangcheng Juves
 */

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { execSync, ExecSyncOptionsWithStringEncoding } from 'child_process';
import * as vscode from 'vscode';

const gjfDocumentFilter: vscode.DocumentFilter = {
	language: 'java',
	scheme: 'file'
};

interface GJFConfigOptions {
	execJarPath?: string, /* Path of google-java-format jar file */
	useAOSPStyle: boolean /* Use AOSP style instead of Google Style */
}

function getGJFConfigOptions(): GJFConfigOptions {
	let _gjfConfig = workspaceConfigurationOf('vscode-gjf');
	return {
		execJarPath: _gjfConfig.get('execJarPath') as string,
		useAOSPStyle: _gjfConfig.get('useAOSPStyle') as boolean
	};
}

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

		let gjfConfigOptions = getGJFConfigOptions();

		try {
			let _cmdOptions: string = '--skip-removing-unused-imports';
			if (gjfConfigOptions.useAOSPStyle) { _cmdOptions += ' --aosp'; }
			_cmdOptions += ' -';
			let _stdout: string = _execGJFJarSync(gjfConfigOptions, document.getText(), _cmdOptions);
			return Promise.resolve([vscode.TextEdit.replace(range, _stdout)]);
		} catch (e) {
			_resolveExecJarPathError(gjfConfigOptions, e);
			return Promise.reject(e);
		}
	}
}


function _execGJFJarSync(gjfConfigOptions: GJFConfigOptions, input: string, cmdOptions: string): string {
	return execSync(`java -jar ${gjfConfigOptions.execJarPath} ${cmdOptions}`, {
		encoding: workspaceConfigurationOf('files').get('encoding') as string,
		input: input,
		windowsHide: true
	} as ExecSyncOptionsWithStringEncoding);
}

function _resolveExecJarPathError(gjfConfigOptions: GJFConfigOptions, e: any) {
	if (!gjfConfigOptions.execJarPath || gjfConfigOptions.execJarPath.trim() === '') {
		vscode.window.showErrorMessage(
			'vscode-gjf.execJarPath is not defined'
		);
	} else {
		vscode.window.showErrorMessage(
			`Run vscode-gjf with error: ${e}`
		);
	}
}


function rangeOfDocument(document: vscode.TextDocument): vscode.Range {
	const end = new vscode.Position(document.lineCount + 1, 0);
	return new vscode.Range(new vscode.Position(0, 0), end);
}

function _vscodeGJFFixImportsOnly(textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit) {
	let gjfConfigOptions = getGJFConfigOptions();
	try {
		let _cmdOptions: string = `--fix-imports-only -`;
		let _input = textEditor.document.getText();
		let _stdout = _execGJFJarSync(gjfConfigOptions, _input, _cmdOptions);
		edit.replace(rangeOfDocument(textEditor.document), _stdout);
	} catch (e) {
		_resolveExecJarPathError(gjfConfigOptions, e);
	}
}

function _vscodeGJFFormatWithSelection(textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit) {
	let gjfConfigOptions = getGJFConfigOptions();
	try {
		let _cmdOptions: string = '--skip-removing-unused-imports';
		if (gjfConfigOptions.useAOSPStyle) { _cmdOptions += ' --aosp'; }
		let _startPosition = textEditor.selection.start;
		let _length = textEditor.document.getText(textEditor.selection).length;
		_cmdOptions += ` --line=${_startPosition.line} --offset=${_startPosition.character}`;
		_cmdOptions += ` --length=${_length}`;
		_cmdOptions += ' -';

		let _input = textEditor.document.getText();
		let _stdout: string = _execGJFJarSync(gjfConfigOptions, _input, _cmdOptions);

		let _endPosition = textEditor.selection.end;
		let _beforeOffset = textEditor.document.offsetAt(_endPosition);

		edit.replace(rangeOfDocument(textEditor.document), _stdout);

		let _affectedLength = _stdout.length - _input.length;
		textEditor.selection = new vscode.Selection(
			_startPosition,
			textEditor.document.positionAt(_beforeOffset + _affectedLength)
		);
	} catch (e) {
		_resolveExecJarPathError(gjfConfigOptions, e);
	}
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.languages.registerDocumentRangeFormattingEditProvider(
			gjfDocumentFilter,
			new GJFDocumentRangeFormattingEditProvider()
		),
		vscode.commands.registerTextEditorCommand('vscode-gjf.fix-imports-only', _vscodeGJFFixImportsOnly),
		vscode.commands.registerTextEditorCommand('vscode-gjf.format-with-selection', _vscodeGJFFormatWithSelection)
	);

}

// this method is called when your extension is deactivated
export function deactivate() { }

/**
 * Get a workspace configuration object.
 *
 * When a section-identifier is provided only that part of the configuration
 * is returned. Dots in the section-identifier are interpreted as child-access,
 * like `{ myExt: { setting: { doIt: true } } } ` and `getConfiguration('myExt.setting').get('doIt') === true`.
 *
 * When a scope is provided configuration confined to that scope is returned. Scope can be a resource or a language identifier or both.
 *
 * @param section A dot-separated identifier.
 * @param scope A scope for which the configuration is asked for.
 * @return The full configuration or a subset.
 */
export function workspaceConfigurationOf(section?: string | undefined, scope?: vscode.ConfigurationScope | null): vscode.WorkspaceConfiguration {
	return vscode.workspace.getConfiguration(section, scope);
}
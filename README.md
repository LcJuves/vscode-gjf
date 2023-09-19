# vscode-gjf

## Google Java Format for VS Code

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

- `vscode-gjf.execJarPath`: Path of [google-java-format-\<version>-all-deps.jar](https://github.com/google/google-java-format/releases) file for unix like system

```json
"vscode-gjf.execJarPath": "/path/to/google-java-format-1.7-all-deps.jar"
```

- `vscode-gjf.win32ExecJarPath`: Path of [google-java-format-\<version>-all-deps.jar](https://github.com/google/google-java-format/releases) file for Windows system

```json
"vscode-gjf.win32ExecJarPath": "C:\\path\\to\\google-java-format-1.7-all-deps.jar"
```

- `vscode-gjf.useAOSPStyle`: Use AOSP style instead of Google Style

```json
"vscode-gjf.useAOSPStyle": true
```

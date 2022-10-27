import * as vscode from 'vscode';
import { basename } from 'node:path';

export function activate(context: vscode.ExtensionContext) {
    let disposable = [
        vscode.commands.registerCommand('vscode-open-with-vim.openWithVi', (uri: vscode.Uri) => { openWith('vi', uri); }),
        vscode.commands.registerCommand('vscode-open-with-vim.openWithVim', (uri: vscode.Uri) => { openWith('vim', uri); }),
        vscode.commands.registerCommand('vscode-open-with-vim.openWithNano', (uri: vscode.Uri) => { openWith('nano', uri); }),
        vscode.window.onDidCloseTerminal(tryRemoveTerminalFromMap),
    ];

    context.subscriptions.push(...disposable);
}

export function deactivate() { }

type Editor = 'vi' | 'vim' | 'nano';
type EditorUri = `${Editor}/${string}`;

const map = new Map<vscode.Terminal, EditorUri>();
const pam = new Map<EditorUri, vscode.Terminal>();

function toEditorUri(editor: Editor, uri: vscode.Uri): EditorUri {
    return `${editor}/${uri.toString()}`;
}

/**
 * NOTE: This is temporarily set to `false`, until microsoft/vscode#152785 is
 * resolved. Due to that issue, closing editor-area terminals does not fire the
 * `onDidCloseTerminal` event, so we'd never know a terminal instance has been
 * closed, and would wrongly re-activate it with no result on the user side.
 * 
 * Unfortunately, there's no other way to check if the terminal really exists.
 * For example, `vscode.window.terminals` array still holds the reference to
 * such closed terminals (that's why it seems like a bug on the VS Code side).
 */
const PREVENT_DUPLICATE_EDITOR_URI_PAIRS = false;
const SAFETY_TIMEOUT_MS = 500;

function openWith(editor: Editor, uri: vscode.Uri) {
    const editorUri = toEditorUri(editor, uri);

    if (PREVENT_DUPLICATE_EDITOR_URI_PAIRS) {
        const existingTerminal = pam.get(editorUri);
        if (existingTerminal) {
            if (vscode.window.terminals.includes(existingTerminal)) {
                existingTerminal.show();
                return;
            }
            tryRemoveTerminalFromMap(existingTerminal);
        }
    }

    const shellType = vscode.env.shell;
    const terminal = vscode.window.createTerminal({
        name: basename(uri.fsPath),
        location: vscode.TerminalLocation.Editor,
    });

    map.set(terminal, editorUri);
    pam.set(editorUri, terminal);

    /**
     * To ensure other extensions subscribing to the `onDidOpenTerminal` event
     * has done their job.
     */
    setTimeout(() => {
        terminal.sendText(getOpenWithCommand(editor, uri.fsPath, shellType));
        terminal.show();
    }, SAFETY_TIMEOUT_MS);
}

function getOpenWithCommand(editor: Editor, path: string, shellType: string): string {
    const escapedPath = path;

    if (shellType.match(/(pwsh|powershell|cmd)(\.exe)?/i)) {
        switch (editor) {
            case 'vi': return `vi '${escapedPath}'; exit`;
            case 'vim': return `vim '${escapedPath}'; exit`;
            case 'nano': return `nano '${escapedPath}'; exit`;
        }
    }

    switch (editor) {
        case 'vi': return `exec vi '${escapedPath}'; exec exit`;
        case 'vim': return `exec vim '${escapedPath}'; exec exit`;
        case 'nano': return `exec nano '${escapedPath}'; exec exit`;
    }
}

function tryRemoveTerminalFromMap(terminal: vscode.Terminal) {
    const editorUri = map.get(terminal);
    if (!editorUri) {
        return;
    }
    map.delete(terminal);
    pam.delete(editorUri);
}

# Open with Vi/Vim/Nano

Thanks to the [*Terminals in the editor area*][terminal-in-editor-area] feature, now you can effectively use Vi/Vim/Nano (or any other editor) as a code editor inside VS Code editor area. This extension makes that easier by letting you to select "Open with Vi/Vim/Nano..." command on the file explorer context menu.

[terminal-in-editor-area]: https://code.visualstudio.com/updates/v1_58#_terminals-in-the-editor-area

![Open with Vi/Vim/Nano](/images/capture/navigation.gif)

## Defining keyboard shortcuts

You can assign a keyboard shortcut to open files in Vi/Vim/Nano. To do this add this line to VS Code's `keybindings.json` file:

```json
{
    {
        "key": "o",
        "command": "vscode-open-with-vim.openWithVim",
        "when": "explorerViewletFocus && foldersViewVisible && !inputFocus"
    }
}
```

ℹ️ *Please share your feedbacks/thoughts by opening an issue on the extension's Github [repository][repo].* 🍏

[repo]: https://github.com/babakks/vscode-open-with-vim

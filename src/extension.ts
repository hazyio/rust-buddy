// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as fs from "fs/promises";

import { registerCommands } from "./commands";
import path from "path";
import { setCargoWorkspaceRoots } from "./utils/context";

async function refreshWorkspaceRoots() {
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Window,
      title: "Getting workspace roots...",
      cancellable: false,
    },
    async (progress) => {
      const files = await vscode.workspace.findFiles(
        "**/Cargo.toml",
        "**/target/**",
      );
      const roots: string[] = [];

      for (const file of files) {
        try {
          const content = await fs.readFile(file.fsPath, "utf-8");
          if (content.includes("[workspace]")) {
            roots.push(path.dirname(file.fsPath));
          }
        } catch {
          // ignore unreadable file
        }
      }

      progress.report({
        message: "Updating workspace roots...",
        increment: 50,
      });
      await vscode.commands.executeCommand(
        "setContext",
        "rust-buddy.cargoWorkspaceRoots",
        roots,
      );
      setCargoWorkspaceRoots(roots);
      progress.report({
        message: "Done!",
        increment: 100,
      });
    },
  );
}
export async function activate(context: vscode.ExtensionContext) {
  const watcher = vscode.workspace.createFileSystemWatcher("**/Cargo.toml");
  watcher.onDidCreate(refreshWorkspaceRoots);
  watcher.onDidChange(refreshWorkspaceRoots);
  watcher.onDidDelete(refreshWorkspaceRoots);

  context.subscriptions.push(watcher);

  console.log("Rust-buddy is now starting!");
  await refreshWorkspaceRoots();
  registerCommands(context);
}

// This method is called when your extension is deactivated
export function deactivate() {
  console.log("Rust-buddy is now deactivating!");
}

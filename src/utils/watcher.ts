import * as vscode from "vscode";

import * as fs from "fs/promises";

import { setCargoWorkspaceRoots, setRustCrateRoots } from "./context";
import path from "path";
export function registerWatcher(context: vscode.ExtensionContext) {
  const watcher = vscode.workspace.createFileSystemWatcher("**/Cargo.toml");
  watcher.onDidCreate(refreshWorkspaceRoots);
  watcher.onDidChange(refreshWorkspaceRoots);
  watcher.onDidDelete(refreshWorkspaceRoots);

  context.subscriptions.push(watcher);
  refreshWorkspaceRoots();
}

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
      const crateRoots = new Set<string>();

      for (const file of files) {
        try {
          const content = await fs.readFile(file.fsPath, "utf-8");
          const dir = path.dirname(file.fsPath);
          if (content.includes("[workspace]")) {
            roots.push(dir);
          } else if (content.includes("[package]")) {
            crateRoots.add(dir);
            await collectSubdirs(dir, crateRoots);
          }
        } catch {
          // ignore unreadable file
        }
      }

      progress.report({
        message: "Updating workspace roots...",
        increment: 50,
      });

      setCargoWorkspaceRoots(roots);
      setRustCrateRoots([...crateRoots]);
      progress.report({
        message: "Done!",
        increment: 100,
      });
    },
  );
}
export async function collectSubdirs(
  dir: string,
  out: Set<string>,
  exclude = ["target", ".git", "node_modules"],
) {
  out.add(path.normalize(dir));
  let entries: import("fs").Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.isDirectory() && !exclude.includes(entry.name)) {
      await collectSubdirs(path.join(dir, entry.name), out, exclude);
    }
  }
}

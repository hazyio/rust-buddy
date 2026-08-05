import * as vscode from "vscode";

import * as fs from "fs/promises";

import {
  addRustCrateRoot,
  getRustCrateRoots,
  removeRustCrateRootsUnder,
  setCargoWorkspaceRoots,
  setRustCrateRoots,
} from "./context";
import path from "path";
export function registerWatcher(context: vscode.ExtensionContext) {
  const cargoWatcher =
    vscode.workspace.createFileSystemWatcher("**/Cargo.toml");
  cargoWatcher.onDidCreate(refreshWorkspaceRoots);
  cargoWatcher.onDidChange(refreshWorkspaceRoots);
  cargoWatcher.onDidDelete((uri) => {
    // a crate's Cargo.toml was deleted — that whole crate root (and subtree) is gone
    removeRustCrateRootsUnder(path.dirname(uri.fsPath));
    refreshWorkspaceRoots(); // still worth a full rescan here
  });

  context.subscriptions.push(cargoWatcher);
  // cheap incremental watcher: only reacts to new folders under known crate roots
  const dirWatcher = vscode.workspace.createFileSystemWatcher("**/");
  dirWatcher.onDidCreate(async (uri) => {
    try {
      const stat = await vscode.workspace.fs.stat(uri);
      if (stat.type === vscode.FileType.Directory) {
        handleFolderCreated(uri.fsPath);
      }
    } catch {
      // file may have already been removed by the time we stat it — ignore
    }
  });
  dirWatcher.onDidDelete((uri) => {
    removeRustCrateRootsUnder(uri.fsPath); // cheap, no rescan needed
  });
  context.subscriptions.push(dirWatcher);
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
function handleFolderCreated(newDir: string) {
  const normalized = path.normalize(newDir);
  const roots = getRustCrateRoots();

  // is this new folder inside (or itself) a known crate root's tree?
  const parentRoot = roots.find(
    (root) => normalized === root || normalized.startsWith(root + path.sep),
  );

  if (parentRoot) {
    addRustCrateRoot(normalized); // O(1) add, no rescan
  }
  // if it's not under any known root, ignore — it's either unrelated,
  // or the start of a brand new crate, which the Cargo.toml watcher will catch
}

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as fs from "fs/promises";

import { registerCommands } from "./commands";
import { registerWatcher } from "./utils/watcher";

export async function activate(context: vscode.ExtensionContext) {
  console.log("Rust-buddy is now starting!");
  registerWatcher(context);

  registerCommands(context);
}

// This method is called when your extension is deactivated
export function deactivate() {
  console.log("Rust-buddy is now deactivating!");
}

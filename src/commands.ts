import * as vscode from "vscode";
import {
  addCrateToWorkspace,
  createProject,
  createWorkspace,
} from "./utils/cargo";
import { showErrorMessage } from "./utils/logging";
import { cargoInstalled, rustInstalled } from "./utils/shcommands";
export function registerCommands(context: vscode.ExtensionContext) {
  pushCommand(context, "rust-buddy.createProject", () => {
    checkRustCargoBeforeCommand(createProject);
  });
  pushCommand(context, "rust-buddy.createWorkspace", () => {
    checkRustCargoBeforeCommand(createWorkspace);
  });
  pushCommand(context, "rust-buddy.addCrateToWorkspace", () => {
    checkRustCargoBeforeCommand(addCrateToWorkspace);
  });
}
async function checkRustCargoBeforeCommand(
  functionToExecute: () => Promise<void>,
) {
  if (!(await cargoInstalled())) {
    showErrorMessage(
      "Cargo is not installed. Please install Cargo to create a new project.",
    );
    return;
  }
  if (!(await rustInstalled())) {
    showErrorMessage(
      "Rust is not installed. Please install Rust to create a new project.",
    );
    return;
  }
  await functionToExecute();
}
function pushCommand(
  context: vscode.ExtensionContext,
  commandId: string,
  callback: (...args: any[]) => any,
) {
  context.subscriptions.push(
    vscode.commands.registerCommand(commandId, callback),
  );
}

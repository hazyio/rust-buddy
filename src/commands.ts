import * as vscode from "vscode";
import { createProject, createWorkspace } from "./cargo/cargo";
import { addCrateToWorkspace } from "./cargo/addCrateToWorkspace";
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
export async function runExtCommands(command: "createWorkspace") {
  switch (command) {
    case "createWorkspace":
      vscode.commands.executeCommand("rust-buddy.createWorkspace");
      break;
  }
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

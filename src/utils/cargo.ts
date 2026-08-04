import {
  actionableInformationMessage,
  showErrorMessage,
  showInformationMessage,
} from "./logging";
import * as vscode from "vscode";
import { collectPath, createDirectory, fileExists, writeFile } from ".";
export function showProjectCancelledMessage(
  collecting: "project" | "workspace" = "project",
) {
  showInformationMessage(
    `${collecting.charAt(0).toUpperCase() + collecting.slice(1)} creation cancelled.`,
  );
}
async function collectProjectName(
  collecting: "project" | "workspace",
  checkPath: vscode.Uri | null = null,
): Promise<string | null> {
  let result = await vscode.window.showInputBox({
    prompt: `Enter ${collecting} name`,
    placeHolder: `my-${collecting}-project`,
    validateInput: async (text) => {
      if (!text || text.trim() === "") {
        return `${collecting.charAt(0).toUpperCase() + collecting.slice(1)} name cannot be empty`;
      }
      if (text.length > 50) {
        return `${collecting.charAt(0).toUpperCase() + collecting.slice(1)} name cannot exceed 50 characters`;
      }
      if (!/^[a-z0-9-_]+$/.test(text)) {
        return `${collecting.charAt(0).toUpperCase() + collecting.slice(1)} name can only contain lowercase letters, numbers, hyphens, and underscores`;
      }

      return null;
    },
  });
  if (!result) {
    showProjectCancelledMessage(collecting);
    return null;
  }
  if (checkPath !== null) {
    const fullPath = vscode.Uri.joinPath(checkPath, result);
    if (await fileExists(fullPath)) {
      showErrorMessage(
        `Selected path ${fullPath.fsPath} already exists. Please choose a different ${collecting} name.`,
      );
      return collectProjectName(collecting, checkPath);
    }
  }
  return result;
}
export async function addCrateToWorkspace() {}
export async function createWorkspace() {
  const workspacePath = await collectPath("Select workspace location");
  if (workspacePath === null) {
    return;
  }
  const workspaceName = await collectProjectName("workspace", workspacePath[0]);
  if (!workspaceName) {
    return;
  }
  const workspaceUri = vscode.Uri.joinPath(workspacePath[0], workspaceName);
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Creating crate...",
      cancellable: false,
    },
    async (progress) => {
      progress.report({
        message: `Creating workspace ${workspaceName}...`,
        increment: 0,
      });
      if (!(await createDirectory(workspaceUri))) {
        showErrorMessage(
          `Failed to create workspace directory ${workspaceUri.fsPath}`,
        );
        return;
      }
      progress.report({
        message: `Creating Cargo.toml for workspace ${workspaceName}...`,
        increment: 50,
      });
      if (
        !(await writeFile(
          vscode.Uri.joinPath(workspaceUri, "Cargo.toml"),
          `[workspace]\nmembers = []`,
        ))
      ) {
        showErrorMessage(
          `Failed to create Cargo.toml for workspace ${workspaceName} at ${workspaceUri.fsPath}`,
        );
        return;
      }
      progress.report({
        message: `Workspace ${workspaceName} created successfully at ${workspaceUri.fsPath}`,
        increment: 100,
      });
      actionableInformationMessage(
        `Workspace ${workspaceName} created successfully at ${workspaceUri.fsPath}`,
        [
          {
            label: "Open",
            runWhenSelected: async () => {
              await vscode.commands.executeCommand(
                "vscode.openFolder",
                vscode.Uri.file(workspaceUri.fsPath),
              );
            },
          },
        ],
      );
    },
  );
}
export async function createProject() {
  const projectPath = await collectPath("Select project location");
  if (!projectPath || projectPath.length === 0) {
    showProjectCancelledMessage();
    return;
  }
  let projectName = await collectProjectName("project", projectPath[0]);
  if (!projectName) {
    showProjectCancelledMessage();
    return;
  }
  const projectType = await vscode.window.showQuickPick(["Binary", "Library"], {
    placeHolder: "Select project type",
  });
  if (!projectName || !projectType) {
    showProjectCancelledMessage();
    return;
  }
}

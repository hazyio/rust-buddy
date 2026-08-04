import {
  actionableInformationMessage,
  showErrorMessage,
} from "../utils/logging";
import * as vscode from "vscode";
import { collectPath, createDirectory, fileExists, writeFile } from "../utils";
import { collectCrateCreationOptions, createCrate } from "./crate";

export async function collectProjectName(
  collecting: "project" | "workspace" | "crate" = "project",
  checkPath: vscode.Uri | null = null,
  lastValue: string | undefined = undefined,
): Promise<string | null> {
  let result = await vscode.window.showInputBox({
    prompt: `Enter ${collecting} name`,
    placeHolder: `my-${collecting}-project`,
    value: lastValue,
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
    return null;
  }
  if (checkPath !== null) {
    const fullPath = vscode.Uri.joinPath(checkPath, result);
    if (await fileExists(fullPath)) {
      showErrorMessage(
        `Selected path ${fullPath.fsPath} already exists. Please choose a different ${collecting} name.`,
      );
      return collectProjectName(collecting, checkPath, result);
    }
  }
  return result;
}
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
  const crateCreationOptions = await collectCrateCreationOptions(
    null,
    "project",
  );
  if (crateCreationOptions === null) {
    return;
  }
  await createCrate("project", crateCreationOptions);
  // const { crateName, crateType, edition, projectPath, vcsOption } =
  //   crateCreationOptions;
  // const projectPath = await collectPath("Select project location");
  // if (projectPath === null) {
  //   showProjectCancelledMessage("project");
  //   return;
  // }
  // let projectName = await collectProjectName("project", projectPath[0]);
  // if (projectName === null) {
  //   showProjectCancelledMessage("project");
  //   return;
  // }
  // const projectType = await vscode.window.showQuickPick(["Binary", "Library"], {
  //   placeHolder: "Select project type",
  // });

  // if (projectName === null || projectType === null) {
  //   showProjectCancelledMessage();
  //   return;
  // }
  // const vcsOption = await vscode.window.showQuickPick(
  //   ["None", "Git", "Hg", "Pijul", "Fossil"],
  //   {
  //     placeHolder: "Select version control system",
  //   },
  // );
  // if (vcsOption === undefined) {
  //   showProjectCancelledMessage();
  //   return;
  // }
  // const targetFolder = projectPath[0].fsPath;

  // const projectUri = vscode.Uri.joinPath(projectPath[0], crateName);
  // // const edition = await vscode.window.showQuickPick(
  // //   ["2024", "2021", "2018", "2015"],
  // //   {
  // //     placeHolder: "Select Rust edition",
  // //   },
  // // );
  // // if (edition === undefined) {
  // //   showProjectCancelledMessage();
  // //   return;
  // // }
  // await vscode.window.withProgress(
  //   {
  //     location: vscode.ProgressLocation.Notification,
  //     title: "Creating project...",
  //     cancellable: false,
  //   },
  //   async () => {
  //     try {
  //       await runCommandAsync(
  //         "cargo",
  //         [
  //           "new",
  //           crateName,
  //           `--${crateType}`,
  //           "--vcs",
  //           vcsOption,
  //           "--edition",
  //           edition,
  //         ],
  //         {
  //           cwd: projectPath[0].fsPath,
  //         },
  //       );

  //       actionableInformationMessage(
  //         `Project ${crateName} created successfully at ${projectUri.fsPath}`,
  //         [
  //           {
  //             label: "Open",
  //             runWhenSelected: async () => {
  //               await vscode.commands.executeCommand(
  //                 "vscode.openFolder",
  //                 vscode.Uri.file(projectUri.fsPath),
  //               );
  //             },
  //           },
  //         ],
  //       );
  //     } catch (error: any) {
  //       showErrorMessage(
  //         `Failed to create project ${crateName} at ${projectPath[0].fsPath}: ${error.message}`,
  //       );
  //     }
  //   },
  // );
}

import {
  actionableInformationMessage,
  showErrorMessage,
} from "../utils/logging";
import * as vscode from "vscode";
import { collectPath, createDirectory, pathExists, writeFile } from "../utils";
import { collectCrateCreationOptions, createCrate } from "./crate";
/**
 * Prompts the user to enter a name for a project, workspace, crate, or module.
 *
 * The input is validated before being accepted. By default, the name:
 * - must not be empty,
 * - must not exceed 150 characters,
 * - may only contain lowercase letters, numbers, hyphens (`-`), and
 *   underscores (`_`).
 *
 * If `checkPath` is provided, the function also verifies that a file or
 * directory with the entered name does not already exist under that path. If
 * it does, the user is shown an error message and prompted again.
 *
 * If `options.validator` is provided, it completely replaces the default name
 * validation. In this case, the default character validation is skipped, and
 * the duplicate-path check performed using `checkPath` is also skipped. The
 * custom validator is responsible for performing any additional validation,
 * including checking for existing paths if required.
 *
 * @param collecting The type of item being named. Used to customize the input
 * prompt and validation messages. Defaults to `"project"`.
 * @param checkPath The parent directory used to check whether the entered name
 * already exists. Ignored when a custom validator is provided.
 * @param lastValue The initial value displayed in the input box, typically used
 * when re-prompting after a validation failure.
 * @param options Additional options.
 * @param options.validator An optional asynchronous validator that returns an
 * error message if the input is invalid, or `null` if it is valid. When
 * provided, it replaces the built-in validation and disables the automatic
 * duplicate-path check.
 *
 * @returns The validated name, or `null` if the user cancels the input.
 */
export async function collectNameInput(
  collecting: "project" | "workspace" | "crate" | "module" = "project",
  checkPath: vscode.Uri | null = null,
  lastValue: string | undefined = undefined,
  options: {
    validator?: (text: string) => Promise<string | null>;
  } = {},
): Promise<string | null> {
  let result = await vscode.window.showInputBox({
    prompt: `Enter ${collecting} name`,
    placeHolder: `my-${collecting}-project`,
    value: lastValue,
    validateInput: async (text) => {
      if (!text || text.trim() === "") {
        return `${collecting.charAt(0).toUpperCase() + collecting.slice(1)} name cannot be empty`;
      }
      if (text.length > 150) {
        return `${collecting.charAt(0).toUpperCase() + collecting.slice(1)} name cannot exceed 150 characters`;
      }

      if (options.validator !== undefined) {
        const error = options.validator(text);
        if (error !== null) {
          return error;
        }
      } else {
        // check only if no validator is provided
        if (!/^[a-z0-9-_]+$/.test(text)) {
          return `${collecting.charAt(0).toUpperCase() + collecting.slice(1)} name can only contain lowercase letters, numbers, hyphens, and underscores`;
        }
        if (checkPath !== null) {
          const fullPath = vscode.Uri.joinPath(checkPath, text);
          if (await pathExists(fullPath)) {
            return `Selected path ${fullPath.fsPath} already exists. Please choose a different ${collecting} name.`;
          }
        }
      }

      return null;
    },
  });
  if (!result) {
    return null;
  }

  return result;
}
export async function createWorkspace(_workspacePath?: vscode.Uri) {
  let workspacePath: vscode.Uri;
  if (_workspacePath !== undefined) {
    workspacePath = _workspacePath;
  } else {
    const r = await collectPath("Select workspace location");
    if (r === null) {
      return;
    }
    workspacePath = r[0];
  }

  const workspaceName = await collectNameInput("workspace", workspacePath);
  if (!workspaceName) {
    return;
  }
  const workspaceUri = vscode.Uri.joinPath(workspacePath, workspaceName);
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
export async function createProject(_workspacePath?: vscode.Uri) {
  const crateCreationOptions = await collectCrateCreationOptions(
    _workspacePath === undefined ? null : [_workspacePath],
    "project",
  );
  if (crateCreationOptions === null) {
    return;
  }
  await createCrate("project", crateCreationOptions);
}

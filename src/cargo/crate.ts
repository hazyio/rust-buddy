import * as vscode from "vscode";
import { collectPath } from "../utils";
import { collectProjectName } from "./cargo";
import { runCommandAsync } from "../utils/shcommands";
import {
  actionableInformationMessage,
  showErrorMessage,
} from "../utils/logging";
interface CrateCreationOptions {
  projectPath: vscode.Uri[];
  crateName: string;
  edition: string | "none";
  vcsOption: string;
  crateType: "bin" | "lib";
}
export async function collectCrateCreationOptions(
  projectPath: vscode.Uri[] | null,
  middleEarth: "crate" | "project",
  skip: Array<"edition" | "vcsOption"> = [],
): Promise<CrateCreationOptions | null> {
  let _projectPath = projectPath;
  if (_projectPath === null) {
    _projectPath = await collectPath(`Select ${middleEarth} location`);
    if (_projectPath === null) {
      return null;
    }
  }
  let projectName = await collectProjectName(middleEarth, _projectPath[0]);
  if (projectName === null) {
    return null;
  }
  const projectType = await vscode.window.showQuickPick(["Binary", "Library"], {
    placeHolder: "Select project type",
  });

  if (projectName === null || projectType === null) {
    return null;
  }
  const vcsOption = skip.includes("vcsOption")
    ? "None"
    : await vscode.window.showQuickPick(
        ["None", "Git", "Hg", "Pijul", "Fossil"],
        {
          placeHolder: "Select version control system",
        },
      );
  if (vcsOption === undefined) {
    return null;
  }
  const edition = skip.includes("vcsOption")
    ? "none"
    : await vscode.window.showQuickPick(["2024", "2021", "2018", "2015"], {
        placeHolder: "Select Rust edition",
      });
  if (edition === undefined) {
    return null;
  }
  return {
    crateName: projectName,
    edition: edition,
    projectPath: _projectPath,
    vcsOption: vcsOption === "None" ? "none" : vcsOption.toLowerCase(),
    crateType: projectType === "Library" ? "lib" : "bin",
  };
}

export async function createCrate(
  label: string,
  options: CrateCreationOptions,
  showOpen: boolean = true,
) {
  const { crateName, crateType, edition, projectPath, vcsOption } = options;
  const projectUri = vscode.Uri.joinPath(projectPath[0], crateName);
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Creating ${label}...`,
      cancellable: false,
    },
    async () => {
      const ed = edition === "none" ? [""] : ["--edition", edition];
      try {
        await runCommandAsync(
          "cargo",
          ["new", crateName, `--${crateType}`, "--vcs", vcsOption, ...ed],
          {
            cwd: projectPath[0].fsPath,
          },
        );

        actionableInformationMessage(
          `${label} ${crateName} created successfully at ${projectUri.fsPath}`,
          showOpen
            ? [
                {
                  label: "Open",
                  runWhenSelected: async () => {
                    await vscode.commands.executeCommand(
                      "vscode.openFolder",
                      vscode.Uri.file(projectUri.fsPath),
                    );
                  },
                },
              ]
            : [],
        );
      } catch (error: any) {
        showErrorMessage(
          `Failed to create ${label} ${crateName} at ${projectPath[0].fsPath}: ${error.message}`,
        );
      }
    },
  );
}

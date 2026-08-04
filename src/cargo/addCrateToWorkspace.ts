import path from "path";
import * as vscode from "vscode";
import {
  actionableErrorMessage,
  actionableInformationMessage,
} from "../utils/logging";
import * as fs from "fs/promises";
import { showProjectCancelledMessage } from "./cargo";
import { collectPath } from "../utils";
import { runExtCommands } from "../commands";
import { collectCrateCreationOptions, createCrate } from "./crate";
async function addMemberToWorkspace(root: vscode.Uri, crateName: string) {
  const tomlPath = vscode.Uri.joinPath(root, "Cargo.toml");
  let content = await fs.readFile(tomlPath.path, "utf-8"); // using fs/promises import

  const membersMatch = content.match(/members\s*=\s*\[([\s\S]*?)\]/);
  if (membersMatch) {
    const existing = membersMatch[1]
      .split(",")
      .map((s) => s.trim().replace(/^"|"$/g, ""))
      .filter(Boolean);
    existing.push(crateName);
    const newArray = `members = [${existing.map((m) => `"${m}"`).join(", ")}]`;
    content = content.replace(/members\s*=\s*\[([\s\S]*?)\]/, newArray);
  } else {
    // no members array found at all — unlikely if validated as a workspace root, but just in case
    content += `\nmembers = ["${crateName}"]\n`;
  }

  await fs.writeFile(tomlPath.path, content);
}
async function ensureMemberAdded(root: vscode.Uri, crateName: string) {
  const tomlPath = vscode.Uri.joinPath(root, "Cargo.toml");
  const content = await fs.readFile(tomlPath.path, "utf-8");

  // crude check: literal name present, or a glob members entry exists
  const hasLiteral = content.includes(`"${crateName}"`);
  const hasGlob = /members\s*=\s*\[[^\]]*\*/.test(content);

  if (!hasLiteral && !hasGlob) {
    await addMemberToWorkspace(root, crateName);
  }
}
async function useCustomWorkspace() {
  const workspacePath = await collectPath("Select workspace location");
  if (workspacePath === null) {
    return;
  }
  if (!(await dirIsWorkspace(workspacePath[0]))) {
    await actionableErrorMessage(
      `The selected folder ${workspacePath[0].fsPath} is not a valid Rust workspace.`,
      [
        {
          label: "Create workspace",
          runWhenSelected: async () => {
            await runExtCommands("createWorkspace");
          },
        },
        {
          label: "Choose workspace",
          runWhenSelected: useCustomWorkspace,
        },
      ],
    );
    return;
  }
  await addCrate(workspacePath);
}
async function addCrate(workspacePath: vscode.Uri[]) {
  const crateCreationOptions = await collectCrateCreationOptions(
    workspacePath,
    "crate",
    ["edition", "vcsOption"],
  );
  if (crateCreationOptions === null) {
    return;
  }
  await createCrate("crate", crateCreationOptions, false);
  await ensureMemberAdded(
    crateCreationOptions.projectPath[0],
    crateCreationOptions.crateName,
  );
}

export async function addCrateToWorkspace() {
  const folders = vscode.workspace.workspaceFolders;

  if (!folders?.length) {
    await actionableErrorMessage("No rust workspace open.", [
      {
        label: "Choose workspace",
        runWhenSelected: useCustomWorkspace,
      },
    ]);
    return;
  } else {
    const allRoots: string[] = [];
    for (const f of folders) {
      allRoots.push(...(await findWorkspaceRoots(f.uri.fsPath)));
    }
    if (allRoots.length === 0) {
      await actionableErrorMessage(
        "No rust workspace found in the current opened folder.",
        [
          {
            label: "Choose workspace",
            runWhenSelected: useCustomWorkspace,
          },
        ],
      );
      return;
    } else {
      const picked = await vscode.window.showQuickPick(
        [
          ...allRoots.map((r) => ({
            label: path.basename(r),
            description: r,
            root: r,
          })),
          { label: "Choose workspace", root: null },
        ],
        { placeHolder: "Select workspace" },
      );
      if (picked === undefined) {
        return;
      }
      if (picked.root === null) {
        await useCustomWorkspace();
        return;
      }
      await addCrate([vscode.Uri.file(picked.root)]);
    }
  }
}
async function dirIsWorkspace(dir: vscode.Uri): Promise<boolean> {
  const cargoTomlPath = vscode.Uri.joinPath(dir, "Cargo.toml");
  try {
    const content = await fs.readFile(cargoTomlPath.fsPath, "utf-8");
    return content.includes("[workspace]");
  } catch {
    return false;
  }
}
export async function findWorkspaceRoots(root: string): Promise<string[]> {
  const found: string[] = [];
  const pattern = new vscode.RelativePattern(root, "**/Cargo.toml");
  const files = await vscode.workspace.findFiles(pattern, "**/target/**"); // exclude build output

  for (const file of files) {
    if (await dirIsWorkspace(vscode.Uri.file(path.dirname(file.fsPath)))) {
      found.push(path.dirname(file.fsPath));
    }
  }
  return found;
}

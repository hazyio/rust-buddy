import * as vscode from "vscode";
import { collectNameInput } from "./cargo";
import { RUST_KEYWORDS } from "../utils/constants";
import { createDirectory, openFile, pathExists, writeFile } from "../utils";
import path from "path";
import { showErrorMessage } from "../utils/logging";
type Visibility =
  | "private"
  | "public"
  | "public-crate"
  | "pub-super"
  | "pub-self";
function visibilityToPrefix(visibility: Visibility): string {
  switch (visibility) {
    case "private":
      return "";
    case "public":
      return "pub ";
    case "public-crate":
      return "pub(crate) ";
    case "pub-super":
      return "pub(super) ";
    case "pub-self":
      return "pub(self) ";
  }
}
async function collectModuleVisibility(): Promise<Visibility | null> {
  const choice = await vscode.window.showQuickPick(
    ["private", "public", "pub(self)", "pub(crate)", "pub(super)"],
    { placeHolder: "Module visibility" },
  );
  if (choice === undefined) {
    return null;
  }
  switch (choice) {
    case "private":
      return "private";
    case "public":
      return "public";
    case "pub(self)":
      return "pub-self";
    case "pub(crate)":
      return "public-crate";
    case "pub(super)":
      return "pub-super";
    default:
      return null;
  }
}
export async function createFileModule(uri: vscode.Uri) {
  let moduleName = await collectNameInput("module", uri, "", {
    validator: async (text) => {
      if (!/^[a-z][a-z0-9_]*$/.test(text)) {
        return "module name can only contain lowercase letters, numbers, and underscores";
      }
      if (RUST_KEYWORDS.includes(text)) {
        return `${text} is a reserved keyword and cannot be used as a module name`;
      }
      if (await pathExists(vscode.Uri.joinPath(uri, `${text}.rs`))) {
        return `A module with this exists`;
      }
      return null;
    },
  });
  if (moduleName === null) {
    return;
  }
  let visibility = await collectModuleVisibility();
  if (visibility === null) {
    return;
  }
  const appendTo = await findModuleDeclarationFile(uri);
  const newModuleFilePath = vscode.Uri.joinPath(uri, `${moduleName}.rs`);
  await writeFile(newModuleFilePath, "");
  if (appendTo !== null) {
    await appendModuleDeclaration(appendTo, moduleName, visibility);
  }
  await openFile(newModuleFilePath);
}
export async function createDirModule(uri: vscode.Uri, useMod: boolean) {
  let moduleName = await collectNameInput("module", uri, "", {
    validator: async (text) => {
      if (!/^[a-z][a-z0-9_]*$/.test(text)) {
        return "module name can only contain lowercase letters, numbers, and underscores";
      }
      if (RUST_KEYWORDS.includes(text)) {
        return `${text} is a reserved keyword and cannot be used as a module name`;
      }
      if (await pathExists(vscode.Uri.joinPath(uri, `${text}`))) {
        return `A module with this exists`;
      }
      if (
        !useMod &&
        (await pathExists(vscode.Uri.joinPath(uri, `${text}.rs`)))
      ) {
        return `A module with this exists, i.e ${text}.rs`;
      }
      return null;
    },
  });
  if (moduleName === null) {
    return;
  }
  let visibility = await collectModuleVisibility();
  if (visibility === null) {
    return;
  }
  const appendTo = await findModuleDeclarationFile(uri);
  if (!(await createDirectory(vscode.Uri.joinPath(uri, moduleName)))) {
    showErrorMessage(
      `Failed to create directory ${moduleName} at ${uri.fsPath}`,
    );
    return;
  }
  const newModuleFilePath = useMod
    ? vscode.Uri.joinPath(uri, moduleName, `mod.rs`)
    : vscode.Uri.joinPath(uri, `${moduleName}.rs`);
  if (appendTo !== null) {
    await appendModuleDeclaration(appendTo, moduleName, visibility);
  }
  await writeFile(newModuleFilePath, "");
  await openFile(newModuleFilePath);
}
async function findModuleDeclarationFile(
  dirUri: vscode.Uri,
): Promise<vscode.Uri | null> {
  const fileStyle = vscode.Uri.file(`${dirUri.fsPath}.rs`);
  if (await pathExists(fileStyle)) {
    return fileStyle;
  }

  const modRsStyle = vscode.Uri.joinPath(dirUri, "mod.rs");
  if (await pathExists(modRsStyle)) {
    return modRsStyle;
  }

  return null;
}
async function appendModuleDeclaration(
  uri: vscode.Uri,
  moduleName: string,
  visibility: Visibility,
) {
  const prefix = visibilityToPrefix(visibility);
  const fullLine = `${prefix}mod ${moduleName};`;

  const doc = await vscode.workspace.openTextDocument(uri);
  const text = doc.getText();
  const declLine = `mod ${moduleName};`;

  if (text.includes(declLine)) {
    return; // already declared, skip
  }

  const modLineRegex = /^\s*(pub(\(\w+\))?\s+)?mod\s+\w+;\s*$/;
  let lastModLine = -1;

  for (let i = 0; i < doc.lineCount; i++) {
    if (modLineRegex.test(doc.lineAt(i).text)) {
      lastModLine = i;
    }
  }

  const edit = new vscode.WorkspaceEdit();

  if (lastModLine === -1) {
    // no existing mod declarations — insert at the very top of the file
    const insertPos = new vscode.Position(0, 0);
    edit.insert(uri, insertPos, `${fullLine}\n`);
  } else {
    // insert right after the last mod declaration, before any other code
    const insertPos = doc.lineAt(lastModLine).range.end;
    edit.insert(uri, insertPos, `\n${fullLine}`);
  }

  await vscode.workspace.applyEdit(edit);
  await doc.save();
}

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
    ["public", "private", "pub(self)", "pub(crate)", "pub(super)"],
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
/**
 * Creates a new directory-based Rust module at the specified URI.
 *
 * Prompts the user for a valid Rust module name and visibility modifier,
 * creates the folder and corresponding module file (`mod.rs` or `<name>.rs`),
 * automatically appends the `mod` declaration to the parent module, and opens
 * the newly created file in the editor.
 *
 * @param uri - The target parent directory `vscode.Uri` where the module folder will be created.
 * @param useMod - Controls the module layout strategy:
 *                 - `true`: Creates `<uri>/<moduleName>/mod.rs` (Classic Rust layout).
 *                 - `false`: Creates `<uri>/<moduleName>.rs` alongside `<uri>/<moduleName>/` (Rust 2018 layout).
 *
 * @returns A promise that resolves when module creation is completed or aborted by the user.
 */
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
/**
 * Resolves the parent Rust source file where a module declaration (`mod <name>;`)
 * should be registered for a given directory URI.
 *
 * Checks target parent files in the following precedence:
 * 1. Sibling file: `<dir>.rs` (Rust 2018 edition style, virtual-FS safe)
 * 2. Internal module root: `<dir>/mod.rs` (Classic Rust style)
 * 3. Library root: `<dir>/lib.rs` (Library crate root)
 * 4. Binary root: `<dir>/main.rs` (Binary crate root)
 *
 * @param dirUri - The `vscode.Uri` of the target module directory.
 * @returns The `vscode.Uri` of the parent file that should contain the `mod` statement, or `null` if none exist.
 */
async function findModuleDeclarationFile(
  dirUri: vscode.Uri,
): Promise<vscode.Uri | null> {
  const fileStyle = dirUri.with({ path: `${dirUri.path}.rs` });
  if (await pathExists(fileStyle)) {
    return fileStyle;
  }

  const modRsStyle = vscode.Uri.joinPath(dirUri, "mod.rs");
  if (await pathExists(modRsStyle)) {
    return modRsStyle;
  }

  const libRsStyle = vscode.Uri.joinPath(dirUri, "lib.rs");
  if (await pathExists(libRsStyle)) {
    return libRsStyle;
  }

  const mainRsStyle = vscode.Uri.joinPath(dirUri, "main.rs");
  if (await pathExists(mainRsStyle)) {
    return mainRsStyle;
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

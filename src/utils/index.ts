import * as vscode from "vscode";

import { showErrorMessage } from "./logging";

export async function pathExists(uri: vscode.Uri): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch {
    return false;
  }
}
export async function collectPath(label: string): Promise<vscode.Uri[] | null> {
  const path = await vscode.window.showOpenDialog({
    canSelectFolders: true,
    canSelectFiles: false,
    canSelectMany: false,
    openLabel: label,
  });
  if (!path || path.length === 0) {
    return null;
  }
  return path;
}
export async function createDirectory(uri: vscode.Uri): Promise<boolean> {
  try {
    await vscode.workspace.fs.createDirectory(uri);
    return true;
  } catch (error) {
    showErrorMessage(`Failed to create directory: ${error}`);
    return false;
  }
}

export async function writeFile(
  uri: vscode.Uri,
  content: string,
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    await vscode.workspace.fs.writeFile(uri, data);
    return true;
  } catch (error) {
    showErrorMessage(`Failed to write file: ${error}`);
    return false;
  }
}

export async function openFile(filePath: vscode.Uri) {
  const doc = await vscode.workspace.openTextDocument(filePath);
  const editor = await vscode.window.showTextDocument(doc);

  const lastLine = doc.lineCount - 1;
  const lastChar = doc.lineAt(lastLine).text.length;
  editor.selection = new vscode.Selection(
    lastLine,
    lastChar,
    lastLine,
    lastChar,
  );
}

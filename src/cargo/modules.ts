import * as vscode from "vscode";
import { collectProjectName } from "./cargo";

async function collectModuleVisibility(): Promise<
  "private" | "public" | "public-crate" | "pub-super" | "pub-self" | null
> {
  const choice = await vscode.window.showQuickPick(
    ["private", "pub", "pub(self)", "pub(crate)", "pub(super)"],
    { placeHolder: "Module visibility" },
  );
  if (choice === undefined) {
    return null;
  }
  switch (choice) {
    case "private":
      return "private";
    case "pub":
      return "public";
    case "pub(self)":
      return "public-crate";
    case "pub(crate)":
      return "pub-super";
    case "pub(super)":
      return "pub-self";
    default:
      return null;
  }
}

export async function createFileModule(uri: vscode.Uri) {
  let projectName = await collectProjectName("module", uri);
  if (projectName === null) {
    return;
  }
  let visibility = await collectModuleVisibility();
  if (visibility === null) {
    return;
  }
}

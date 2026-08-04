import * as vscode from "vscode";

export function showInformationMessage(message: string) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  console.log(message);
  vscode.window.showInformationMessage(message);
}

export function showErrorMessage(message: string) {
  console.error(message);
  vscode.window.showErrorMessage(message);
}

export function showWarningMessage(message: string) {
  console.warn(message);
  vscode.window.showWarningMessage(message);
}

export async function actionableInformationMessage(
  message: string,
  action: {
    label: string;
    runWhenSelected: () => void;
  }[],
): Promise<void> {
  const choice = await vscode.window.showInformationMessage(
    message,
    ...action.map((a) => a.label),
  );
  if (choice !== null) {
    const selectedAction = action.find((a) => a.label === choice);
    if (selectedAction) {
      selectedAction.runWhenSelected();
    }
  }
}
export async function actionableErrorMessage(
  message: string,
  action: {
    label: string;
    runWhenSelected: () => void;
  }[],
): Promise<void> {
  const choice = await vscode.window.showErrorMessage(
    message,
    ...action.map((a) => a.label),
  );
  if (choice !== null) {
    const selectedAction = action.find((a) => a.label === choice);
    if (selectedAction) {
      selectedAction.runWhenSelected();
    }
  }
}

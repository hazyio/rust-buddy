import * as vscode from "vscode";
let cargoWorkspaceRoots: string[] = [];
let rustCrateRoots: string[] = [];

export function getRustCrateRoots(): string[] {
  return rustCrateRoots;
}

export async function setRustCrateRoots(roots: string[]): Promise<void> {
  await vscode.commands.executeCommand(
    "setContext",
    "rust-buddy.rustCrateRoots",
    roots,
  );
  rustCrateRoots = roots;
}

export function getCargoWorkspaceRoots(): string[] {
  return cargoWorkspaceRoots;
}

export async function setCargoWorkspaceRoots(roots: string[]): Promise<void> {
  await vscode.commands.executeCommand(
    "setContext",
    "rust-buddy.cargoWorkspaceRoots",
    roots,
  );
  cargoWorkspaceRoots = roots;
}

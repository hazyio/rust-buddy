import path from "path";
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
export function addRustCrateRoot(dir: string): void {

  if (!rustCrateRoots.includes(dir)) {
    rustCrateRoots = [...rustCrateRoots, dir];
    vscode.commands.executeCommand(
      "setContext",
      "rust-buddy.rustCrateRoots",
      rustCrateRoots,
    );
  }
}
export function removeRustCrateRootsUnder(deletedPath: string): void {
  const normalized = path.normalize(deletedPath);
  const filtered = rustCrateRoots.filter(
    (root) => root !== normalized && !root.startsWith(normalized + path.sep),
  );
  if (filtered.length !== rustCrateRoots.length) {
    rustCrateRoots = filtered;
    vscode.commands.executeCommand(
      "setContext",
      "rust-buddy.rustCrateRoots",
      rustCrateRoots,
    );
  }
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

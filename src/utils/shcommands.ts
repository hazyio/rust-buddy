import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);
const CargoCommand = "cargo";
const RustCommand = "rustc";

export async function cargoInstalled(): Promise<boolean> {
  return await commandExists(CargoCommand);
}
export async function rustInstalled(): Promise<boolean> {
  return await commandExists(RustCommand);
}
export async function cargoVersion(): Promise<string | null> {
  return await getToolVersion(CargoCommand);
}
export async function rustVersion(): Promise<string | null> {
  return await getToolVersion(RustCommand);
}
async function commandExists(cmd: string): Promise<boolean> {
  const checker = process.platform === "win32" ? "where" : "which";
  try {
    await execAsync(`${checker} ${cmd}`);
    return true;
  } catch {
    return false;
  }
}

async function getToolVersion(cmd: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync(`${cmd} --version`);
    return stdout.trim();
  } catch {
    return null;
  }
}

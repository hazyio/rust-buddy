import { execFile, exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

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
export async function runCommandAsync(
  command: string,
  args: string[],
  options: { cwd: string; timeoutMs?: number },
): Promise<{ stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      cwd: options.cwd,
      timeout: options.timeoutMs ?? 30000, // 30s default — cargo new should never take this long
    });
    return { stdout, stderr };
  } catch (error: any) {
    throw new Error(
      `Command failed: ${command} ${args.join(" ")}\n${error.message}`,
    );
  }
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

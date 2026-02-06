import { approveBrick as approveBrickCli } from "../trust/cli";

export async function approveBrick(docPath: string): Promise<string> {
  return approveBrickCli(docPath);
}

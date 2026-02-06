import { listBricks as listBricksCli } from "../trust/cli";

export async function listBricks(): Promise<string[]> {
  return listBricksCli();
}

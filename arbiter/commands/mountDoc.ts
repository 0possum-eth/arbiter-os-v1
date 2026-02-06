import { mountDoc as mountDocCli } from "../trust/cli";

export async function mountDoc(docPath: string) {
  return mountDocCli(docPath);
}

import type { TaskCompletionPacket } from "../contracts/packets";
import type { StrategyCommand, TaskPacket } from "./taskPacket";
import { executeStrategyCommands } from "./strategyShell";

const citationToPath = (citation: string) => {
  const hashIndex = citation.indexOf("#");
  return hashIndex >= 0 ? citation.slice(0, hashIndex) : citation;
};

export async function executeTaskStrategy(packet: TaskPacket): Promise<TaskCompletionPacket> {
  const filesChanged = packet.citations.map(citationToPath).filter((value) => value.length > 0);
  const commands: StrategyCommand[] = packet.strategyCommands ?? [
    {
      command: process.execPath,
      args: ["--version"]
    }
  ];
  const tests = await executeStrategyCommands(commands);
  return {
    taskId: packet.taskId,
    tests,
    files_changed: filesChanged
  };
}

import type { TaskCompletionPacket } from "../contracts/packets";
import type { TaskPacket } from "./taskPacket";

const citationToPath = (citation: string) => {
  const hashIndex = citation.indexOf("#");
  return hashIndex >= 0 ? citation.slice(0, hashIndex) : citation;
};

export async function executeTaskStrategy(packet: TaskPacket): Promise<TaskCompletionPacket> {
  const filesChanged = packet.citations.map(citationToPath).filter((value) => value.length > 0);
  return {
    taskId: packet.taskId,
    tests: [`simulated:${packet.taskId}`],
    files_changed: filesChanged
  };
}

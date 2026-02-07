import { runEpic } from "./runEpic";
import { approveBrick } from "./approveBrick";
import { mountDoc } from "./mountDoc";
import { listBricks } from "./listBricks";
import { arbiterStatus } from "./status";
import { workflowMode } from "./workflowMode";

export const arbiterCommands = {
  "arbiter-status": arbiterStatus,
  "run-epic": runEpic,
  "approve-brick": approveBrick,
  "mount-doc": mountDoc,
  "list-bricks": listBricks,
  "workflow-mode": workflowMode
};

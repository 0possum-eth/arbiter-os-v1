import { runEpic } from "./runEpic";
import { approveBrick } from "./approveBrick";
import { mountDoc } from "./mountDoc";
import { listBricks } from "./listBricks";

export const arbiterCommands = {
  "run-epic": runEpic,
  "approve-brick": approveBrick,
  "mount-doc": mountDoc,
  "list-bricks": listBricks
};

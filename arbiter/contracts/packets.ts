export type TaskCompletionPacket = {
  taskId: string;
  tests?: string[];
  files_changed?: string[];
};

export type VerificationPacket = {
  taskId: string;
  passed: boolean;
};

export type IntegrationPacket = {
  taskId: string;
  passed: boolean;
};

export type UxPacket = {
  taskId: string;
  passed: boolean;
};

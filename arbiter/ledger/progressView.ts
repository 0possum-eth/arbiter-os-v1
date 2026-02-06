type Epic = { id: string; tasks: Array<{ id: string; done?: boolean }> };

export const progressView = (epics: Epic[]) => {
  const lines: string[] = [];
  for (const epic of epics) {
    lines.push(epic.id);
    for (const task of epic.tasks) {
      const status = task.done ? "x" : " ";
      lines.push(`- [${status}] ${task.id}`);
    }
  }
  if (lines.length === 0) return "";
  return `${lines.join("\n")}\n`;
};

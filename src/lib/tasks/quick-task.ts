import { PRIORITIES, type TaskPriority } from "@/constants/task-status";

export type QuickAssigneeOption = {
  id: string;
  name: string;
};

export type ParsedQuickTask = {
  title: string;
  priority?: TaskPriority;
  dueDate?: string;
  assigneeId?: string;
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function parseQuickTaskInput(input: string, assignees: QuickAssigneeOption[] = []): ParsedQuickTask {
  let title = input.trim();
  let priority: TaskPriority | undefined;
  let dueDate: string | undefined;
  let assigneeId: string | undefined;

  for (const item of PRIORITIES) {
    const pattern = new RegExp(`(^|\\s)#${item}(?=\\s|$)`, "i");
    if (pattern.test(title)) {
      priority = item;
      title = title.replace(pattern, " ");
      break;
    }
  }

  const dueMatch = title.match(/(^|\s)due:(\d{4}-\d{2}-\d{2})(?=\s|$)/i);
  if (dueMatch?.[2]) {
    dueDate = dueMatch[2];
    title = title.replace(dueMatch[0], " ");
  }

  const assigneeMatch = title.match(/(^|\s)@([^\s#]+(?:\s+[^\s#]+)?)/);
  if (assigneeMatch?.[2]) {
    const normalizedMention = normalizeText(assigneeMatch[2]);
    const matched = assignees.find((assignee) => {
      const normalizedName = normalizeText(assignee.name);
      return normalizedName === normalizedMention || normalizedName.startsWith(normalizedMention);
    });

    if (matched) {
      assigneeId = matched.id;
      title = title.replace(assigneeMatch[0], " ");
    }
  }

  return {
    title: title.replace(/\s+/g, " ").trim(),
    priority,
    dueDate,
    assigneeId,
  };
}

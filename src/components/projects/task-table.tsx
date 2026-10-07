import { UserAvatar } from "@/components/layout/user-avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatHours } from "@/lib/utils";
import type { ProjectTask } from "@/server/data/projects";
import { DueDate } from "./due-date";

export function TaskTable({ tasks }: { tasks: ProjectTask[] }) {
  const total = tasks.reduce((sum, task) => sum + task.estimatedHours, 0);

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[42%]">Task</TableHead>
          <TableHead>Assigned to</TableHead>
          <TableHead>Deadline</TableHead>
          <TableHead className="text-right">Estimate</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task.id}>
            <TableCell>
              <p className="font-medium">{task.title}</p>
              {task.description && <p className="mt-0.5 text-sm text-muted-foreground">{task.description}</p>}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <UserAvatar name={task.assignee.name} role="AGENT" className="size-7 text-[10px]" />
                <div className="leading-tight">
                  <p className="text-sm whitespace-nowrap">{task.assignee.name}</p>
                  <p className="text-xs whitespace-nowrap text-muted-foreground">{task.assignee.specialization}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <DueDate date={task.deadline} compact />
            </TableCell>
            <TableCell className="text-right font-mono tabular-nums">{formatHours(task.estimatedHours)}</TableCell>
          </TableRow>
        ))}
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={3} className="text-right text-sm text-muted-foreground">
            Total estimated effort
          </TableCell>
          <TableCell className="text-right font-mono font-semibold tabular-nums">{formatHours(total)}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

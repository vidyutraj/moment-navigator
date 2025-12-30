import { Task, LongTermGoal } from '@/types/clarity';
import { ListTodo, Clock, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TasksPanelProps {
  tasks: Task[];
  goals: LongTermGoal[];
}

export function TasksPanel({ tasks, goals }: TasksPanelProps) {
  const incompleteTasks = tasks.filter(t => !t.completed);

  const getGoalTitle = (goalId?: string) => {
    if (!goalId) return null;
    return goals.find(g => g.id === goalId)?.title;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <ListTodo className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-lg font-medium text-foreground">Tasks</h2>
        <span className="text-sm text-muted-foreground ml-auto">
          {incompleteTasks.length} to do
        </span>
      </div>
      
      <p className="text-sm text-muted-foreground mb-6">
        Flexible items. No overdue guilt.
      </p>
      
      <div className="space-y-3 flex-1 overflow-y-auto">
        {incompleteTasks.map((task) => {
          const goalTitle = getGoalTitle(task.goalId);
          
          return (
            <div
              key={task.id}
              className={cn(
                "p-4 rounded-lg bg-card border border-border/50",
                "hover:border-border transition-colors"
              )}
            >
              <h3 className="font-medium text-card-foreground mb-2">
                {task.title}
              </h3>
              
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  ~{task.estimatedMinutes} min
                </span>
                
                <span className="text-muted-foreground/70">
                  {task.deadline}
                </span>
              </div>
              
              {goalTitle && (
                <div className="mt-2 pt-2 border-t border-border/30">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Target className="w-3 h-3" />
                    {goalTitle}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

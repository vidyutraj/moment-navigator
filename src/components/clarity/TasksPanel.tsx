import { Task, LongTermGoal } from '@/types/clarity';
import { ListTodo, Clock, Target, Bookmark, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TasksPanelProps {
  tasks: Task[];
  goals: LongTermGoal[];
  highlightedGoalId?: string;
}

export function TasksPanel({ tasks, goals, highlightedGoalId }: TasksPanelProps) {
  const incompleteTasks = tasks.filter(t => !t.completed);

  const getGoalTitle = (goalId?: string) => {
    if (!goalId) return null;
    return goals.find(g => g.id === goalId)?.title;
  };

  const getTaskTypeLabel = (taskType: Task['taskType']) => {
    switch (taskType) {
      case 'non-negotiable':
        return { label: 'Core', icon: Bookmark };
      case 'growth':
        return { label: 'Growth', icon: Sparkles };
      default:
        return null;
    }
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
          const typeInfo = getTaskTypeLabel(task.taskType);
          const isHighlighted = task.goalId && task.goalId === highlightedGoalId;
          
          return (
            <div
              key={task.id}
              className={cn(
                "p-4 rounded-lg bg-card border transition-all",
                task.taskType === 'non-negotiable' 
                  ? "border-non-negotiable/40" 
                  : "border-border/50",
                isHighlighted && "ring-2 ring-highlight-border/50 border-highlight-border/30",
                "hover:border-border"
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className={cn(
                  "text-card-foreground leading-snug",
                  task.taskType === 'non-negotiable' 
                    ? "font-semibold" 
                    : "font-medium"
                )}>
                  {task.title}
                </h3>
                
                {typeInfo && (
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0",
                    task.taskType === 'non-negotiable' 
                      ? "bg-non-negotiable/10 text-non-negotiable" 
                      : "bg-growth/10 text-growth"
                  )}>
                    <typeInfo.icon className="w-3 h-3" />
                    {typeInfo.label}
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  ~{task.estimatedMinutes} min
                </span>
                
                <span className={cn(
                  task.taskType === 'non-negotiable' && 
                  (task.deadline.includes('today') || task.deadline.includes('tomorrow'))
                    ? "text-non-negotiable/80"
                    : "text-muted-foreground/70"
                )}>
                  {task.deadline}
                </span>
              </div>
              
              {goalTitle && (
                <div className={cn(
                  "mt-2 pt-2 border-t transition-colors",
                  isHighlighted ? "border-highlight-border/30" : "border-border/30"
                )}>
                  <span className={cn(
                    "inline-flex items-center gap-1.5 text-xs",
                    isHighlighted ? "text-highlight-border font-medium" : "text-muted-foreground"
                  )}>
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

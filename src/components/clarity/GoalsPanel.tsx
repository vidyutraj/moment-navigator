import { LongTermGoal } from '@/types/clarity';
import { Compass, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface GoalsPanelProps {
  goals: LongTermGoal[];
  highlightedGoalId?: string;
  onEdit?: (goal: LongTermGoal) => void;
  onDelete?: (id: string) => Promise<void>;
}

export function GoalsPanel({ goals, highlightedGoalId, onEdit, onDelete }: GoalsPanelProps) {
  const handleDelete = async (id: string) => {
    if (onDelete && confirm('Are you sure you want to delete this goal?')) {
      await onDelete(id);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <p className="text-sm text-muted-foreground mb-6">
        Your north stars. No deadlines, no pressure.
      </p>
      
      <div className="space-y-3 flex-1 overflow-y-auto">
        {goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Compass className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground">
              No goals yet. Add one to get started.
            </p>
          </div>
        ) : (
          goals.map((goal) => {
            const isHighlighted = goal.id === highlightedGoalId;
            
            return (
              <div
                key={goal.id}
                className={cn(
                  "group p-4 rounded-lg bg-card border transition-all duration-300 relative",
                  isHighlighted 
                    ? "border-highlight-border bg-highlight/30 ring-2 ring-highlight-border/40" 
                    : "border-border/50 hover:border-border"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className={cn(
                      "font-medium mb-1 transition-colors",
                      isHighlighted ? "text-highlight-border" : "text-card-foreground"
                    )}>
                      {goal.title}
                    </h3>
                    {goal.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {goal.description}
                      </p>
                    )}
                    {isHighlighted && (
                      <p className="text-xs text-highlight-border/80 mt-2 font-medium animate-fade-in">
                        This choice advances this direction
                      </p>
                    )}
                  </div>
                  {(onEdit || onDelete) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <span className="sr-only">Open menu</span>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(goal)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem 
                            onClick={() => handleDelete(goal.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

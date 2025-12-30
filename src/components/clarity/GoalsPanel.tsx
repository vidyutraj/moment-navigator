import { LongTermGoal } from '@/types/clarity';
import { Compass } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoalsPanelProps {
  goals: LongTermGoal[];
  highlightedGoalId?: string;
}

export function GoalsPanel({ goals, highlightedGoalId }: GoalsPanelProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <Compass className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-lg font-medium text-foreground">Long-Term Goals</h2>
      </div>
      
      <p className="text-sm text-muted-foreground mb-6">
        Your north stars. No deadlines, no pressure.
      </p>
      
      <div className="space-y-3 flex-1">
        {goals.map((goal) => {
          const isHighlighted = goal.id === highlightedGoalId;
          
          return (
            <div
              key={goal.id}
              className={cn(
                "p-4 rounded-lg bg-card border transition-all duration-300",
                isHighlighted 
                  ? "border-highlight-border bg-highlight/30 ring-2 ring-highlight-border/40" 
                  : "border-border/50 hover:border-border"
              )}
            >
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
          );
        })}
      </div>
    </div>
  );
}

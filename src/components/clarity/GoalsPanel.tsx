import { LongTermGoal } from '@/types/clarity';
import { Compass } from 'lucide-react';

interface GoalsPanelProps {
  goals: LongTermGoal[];
}

export function GoalsPanel({ goals }: GoalsPanelProps) {
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
        {goals.map((goal) => (
          <div
            key={goal.id}
            className="p-4 rounded-lg bg-card border border-border/50 hover:border-border transition-colors"
          >
            <h3 className="font-medium text-card-foreground mb-1">
              {goal.title}
            </h3>
            {goal.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {goal.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

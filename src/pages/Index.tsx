import { useState } from 'react';
import { useClarity } from '@/hooks/useClarity';
import { TasksPanel } from '@/components/clarity/TasksPanel';
import { GoalsPanel } from '@/components/clarity/GoalsPanel';
import { EnergySelector } from '@/components/clarity/EnergySelector';
import { CalendarConnection } from '@/components/clarity/CalendarConnection';
import { TaskForm } from '@/components/clarity/TaskForm';
import { GoalForm } from '@/components/clarity/GoalForm';
import { AskButton } from '@/components/clarity/AskButton';
import { RecommendationCard } from '@/components/clarity/RecommendationCard';
import { TimeConfirmationDialog } from '@/components/clarity/TimeConfirmationDialog';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { Task, LongTermGoal } from '@/types/clarity';

const Index = () => {
  const {
    goals,
    tasks,
    energy,
    setEnergy,
    isLoading,
    recommendation,
    isRecommending,
    timeWindow,
    showTimeConfirmation,
    calendarSuggestedEndTime,
    calendarEventName,
    handleTimeConfirmed,
    cancelTimeConfirmation,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    createGoal,
    updateGoal,
    deleteGoal,
    askForRecommendation,
    acceptRecommendation,
    suggestAnother,
    dismissRecommendation,
  } = useClarity();

  // Form states
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [goalFormOpen, setGoalFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [editingGoal, setEditingGoal] = useState<LongTermGoal | undefined>();

  const handleCreateTask = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setEditingTask(undefined);
    setTaskFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskFormOpen(true);
  };

  const handleTaskSubmit = async (taskData: Omit<Task, 'id'>) => {
    if (editingTask) {
      await updateTask(editingTask.id, taskData);
    } else {
      await createTask(taskData);
    }
    setTaskFormOpen(false);
    setEditingTask(undefined);
  };

  const handleCreateGoal = () => {
    setEditingGoal(undefined);
    setGoalFormOpen(true);
  };

  const handleEditGoal = (goal: LongTermGoal) => {
    setEditingGoal(goal);
    setGoalFormOpen(true);
  };

  const handleGoalSubmit = async (goalData: Omit<LongTermGoal, 'id'>) => {
    if (editingGoal) {
      await updateGoal(editingGoal.id, goalData);
    } else {
      await createGoal(goalData);
    }
    setGoalFormOpen(false);
    setEditingGoal(undefined);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                Clarity
              </h1>
              <p className="text-sm text-muted-foreground">
                Decision relief, not productivity pressure
              </p>
            </div>
            <CalendarConnection />
          </div>
        </div>
      </header>

      {/* Main action area */}
      <div className="bg-muted/30 border-b border-border/30">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Energy selector - prominently placed */}
            <div className="w-full max-w-md">
              <div className="flex flex-col items-center gap-3 mb-2">
                <p className="text-sm font-medium text-foreground">Your energy right now</p>
                <EnergySelector energy={energy} onChange={setEnergy} />
                <p className="text-xs text-muted-foreground max-w-xs">
                  {recommendation 
                    ? 'Changing energy will update the recommendation' 
                    : 'This helps match tasks to what you can take on'}
                </p>
              </div>
            </div>

            {/* Recommendation area */}
            {!recommendation ? (
              <div className="flex flex-col items-center gap-4">
                <AskButton 
                  onClick={askForRecommendation} 
                  isActive={isRecommending}
                />
                {tasks.filter(t => !t.completed && !t.inProgress).length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No tasks available. Add some tasks to get recommendations.
                  </p>
                )}
              </div>
            ) : (
              <RecommendationCard
                recommendation={recommendation}
                energy={energy}
                onAccept={acceptRecommendation}
                onSuggestAnother={suggestAnother}
                onDismiss={dismissRecommendation}
              />
            )}
          </div>
        </div>
      </div>

      {/* Main layout */}
      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Tasks Panel */}
          <div className="bg-background rounded-xl border border-border/50 p-4 sm:p-6 min-h-[500px] lg:h-[700px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-foreground">Tasks</h2>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.nativeEvent) {
                    e.nativeEvent.stopImmediatePropagation();
                  }
                  handleCreateTask(e);
                }}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </Button>
            </div>
            <TasksPanel 
              tasks={tasks} 
              goals={goals}
              onEdit={handleEditTask}
              onDelete={deleteTask}
              onComplete={completeTask}
            />
          </div>

          {/* Goals Panel */}
          <div className="bg-background rounded-xl border border-border/50 p-4 sm:p-6 min-h-[500px] lg:h-[700px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-foreground">Goals</h2>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCreateGoal}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Goal
              </Button>
            </div>
            <GoalsPanel 
              goals={goals}
              onEdit={handleEditGoal}
              onDelete={deleteGoal}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 mt-auto">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-6">
          <p className="text-center text-sm text-muted-foreground">
            Everything is manual. Nothing is enforced. You are always in control.
          </p>
        </div>
      </footer>

      {/* Forms */}
      <TaskForm
        key={editingTask?.id || 'new-task'}
        task={editingTask}
        goals={goals}
        open={taskFormOpen}
        onOpenChange={(open) => {
          setTaskFormOpen(open);
          if (!open) setEditingTask(undefined);
        }}
        onSubmit={handleTaskSubmit}
      />

      <GoalForm
        goal={editingGoal}
        open={goalFormOpen}
        onOpenChange={(open) => {
          setGoalFormOpen(open);
          if (!open) setEditingGoal(undefined);
        }}
        onSubmit={handleGoalSubmit}
      />

      {/* Time confirmation dialog */}
      <TimeConfirmationDialog
        open={showTimeConfirmation}
        suggestedEndTime={calendarSuggestedEndTime}
        suggestedSource={calendarSuggestedEndTime ? 'calendar-suggested' : 'system-default'}
        eventName={calendarEventName}
        onConfirm={handleTimeConfirmed}
        onCancel={cancelTimeConfirmation}
      />
    </div>
  );
};

export default Index;

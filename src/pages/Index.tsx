import { useState } from 'react';
import { useClarity } from '@/hooks/useClarity';
import { CalendarView } from '@/components/clarity/CalendarView';
import { TasksPanel } from '@/components/clarity/TasksPanel';
import { EnergySelector } from '@/components/clarity/EnergySelector';
import { AskButton } from '@/components/clarity/AskButton';
import { RecommendationCard } from '@/components/clarity/RecommendationCard';
import { EventForm } from '@/components/clarity/EventForm';
import { TaskForm } from '@/components/clarity/TaskForm';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { CalendarEvent, Task } from '@/types/clarity';
import { formatESTDate } from '@/lib/timezone';

const Index = () => {
  const {
    goals,
    events,
    tasks,
    energy,
    setEnergy,
    recommendation,
    isRecommending,
    openTimeWindow,
    currentHour,
    isLoading,
    askForRecommendation,
    acceptRecommendation,
    suggestAnother,
    dismissRecommendation,
    createEvent,
    updateEvent,
    deleteEvent,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
  } = useClarity();

  // Form states
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>();
  const [editingTask, setEditingTask] = useState<Task | undefined>();

  const handleCreateEvent = () => {
    setEditingEvent(undefined);
    setEventFormOpen(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setEventFormOpen(true);
  };

  const handleEventSubmit = async (eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingEvent && editingEvent.id) {
      await updateEvent(editingEvent.id, eventData);
    } else {
      await createEvent(eventData);
    }
    setEventFormOpen(false);
    setEditingEvent(undefined);
  };

  const handleCreateTask = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('handleCreateTask called, taskFormOpen will be:', true);
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
            <EnergySelector energy={energy} onChange={setEnergy} />
          </div>
        </div>
      </header>

      {/* Main action area */}
      <div className="bg-muted/30 border-b border-border/30">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col items-center text-center">
            {!recommendation ? (
              <>
                <AskButton 
                  onClick={askForRecommendation} 
                  isActive={isRecommending}
                  disabled={!openTimeWindow}
                />
                {!openTimeWindow && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Your calendar looks full right now. Check back when you have some open time.
                  </p>
                )}
              </>
            ) : (
              <RecommendationCard
                recommendation={recommendation}
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Calendar Panel - Takes most of the space */}
          <div className="lg:col-span-8 bg-background rounded-xl border border-border/50 p-4 sm:p-6 min-h-[600px] lg:h-[700px] flex flex-col">
            <CalendarView
              events={events}
              currentHour={currentHour}
              onEventClick={handleEditEvent}
              onTimeSlotClick={(date, startHour, endHour) => {
                const tempEvent: CalendarEvent = {
                  id: '',
                  title: '',
                  startHour,
                  endHour,
                  type: 'fixed',
                  date: formatESTDate(date),
                };
                setEditingEvent(tempEvent);
                setEventFormOpen(true);
              }}
            />
          </div>

          {/* Tasks Panel */}
          <div className="lg:col-span-4 bg-background rounded-xl border border-border/50 p-4 sm:p-6 min-h-[300px] lg:h-[700px] lg:overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-foreground">Tasks</h2>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCreateTask}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </div>
            <TasksPanel 
              tasks={tasks} 
              goals={goals} 
              highlightedGoalId={recommendation?.task.goalId}
              onEdit={handleEditTask}
              onDelete={deleteTask}
              onComplete={completeTask}
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
      <EventForm
        event={editingEvent}
        open={eventFormOpen}
        onOpenChange={(open) => {
          setEventFormOpen(open);
          if (!open) setEditingEvent(undefined);
        }}
        onSubmit={handleEventSubmit}
      />

      <TaskForm
        task={editingTask}
        goals={goals}
        open={taskFormOpen}
        onOpenChange={(open) => {
          setTaskFormOpen(open);
          if (!open) setEditingTask(undefined);
        }}
        onSubmit={handleTaskSubmit}
      />
    </div>
  );
};

export default Index;

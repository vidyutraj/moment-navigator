import { useClarity } from '@/hooks/useClarity';
import { GoalsPanel } from '@/components/clarity/GoalsPanel';
import { CalendarPanel } from '@/components/clarity/CalendarPanel';
import { TasksPanel } from '@/components/clarity/TasksPanel';
import { EnergySelector } from '@/components/clarity/EnergySelector';
import { AskButton } from '@/components/clarity/AskButton';
import { RecommendationCard } from '@/components/clarity/RecommendationCard';

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
    askForRecommendation,
    acceptRecommendation,
    suggestAnother,
    dismissRecommendation,
  } = useClarity();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
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

      {/* Three-panel layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Goals Panel */}
          <div className="lg:col-span-3 bg-background rounded-xl border border-border/50 p-6">
            <GoalsPanel goals={goals} />
          </div>

          {/* Calendar Panel */}
          <div className="lg:col-span-5 bg-background rounded-xl border border-border/50 p-6 min-h-[500px]">
            <CalendarPanel 
              events={events}
              currentHour={currentHour}
              openTimeWindow={openTimeWindow}
              isHighlightingOpen={isRecommending || !!recommendation}
            />
          </div>

          {/* Tasks Panel */}
          <div className="lg:col-span-4 bg-background rounded-xl border border-border/50 p-6">
            <TasksPanel tasks={tasks} goals={goals} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <p className="text-center text-sm text-muted-foreground">
            Everything is manual. Nothing is enforced. You are always in control.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

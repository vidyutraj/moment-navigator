import { useState, useCallback, useMemo } from 'react';
import { 
  EnergyLevel, 
  LongTermGoal, 
  CalendarEvent, 
  Task, 
  Recommendation 
} from '@/types/clarity';
import { 
  placeholderGoals, 
  placeholderEvents, 
  placeholderTasks 
} from '@/data/placeholderData';

export function useClarity() {
  const [goals] = useState<LongTermGoal[]>(placeholderGoals);
  const [events, setEvents] = useState<CalendarEvent[]>(placeholderEvents);
  const [tasks, setTasks] = useState<Task[]>(placeholderTasks);
  const [energy, setEnergy] = useState<EnergyLevel>('medium');
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [isRecommending, setIsRecommending] = useState(false);

  // Get current hour (for demo, we'll use a fixed time that shows open slots)
  const currentHour = useMemo(() => {
    const now = new Date();
    return now.getHours() + now.getMinutes() / 60;
  }, []);

  // Find the next open time window
  const findOpenTimeWindow = useCallback(() => {
    const sortedEvents = [...events].sort((a, b) => a.startHour - b.startHour);
    
    // Start from current hour or 8am, whichever is later
    let searchStart = Math.max(currentHour, 8);
    
    for (const event of sortedEvents) {
      if (event.startHour > searchStart) {
        // Found an open window before this event
        const duration = event.startHour - searchStart;
        if (duration >= 0.25) { // At least 15 minutes
          return { start: searchStart, end: event.startHour };
        }
      }
      searchStart = Math.max(searchStart, event.endHour);
    }
    
    // Check if there's time after the last event (until 6pm)
    if (searchStart < 18) {
      return { start: searchStart, end: 18 };
    }
    
    return null;
  }, [events, currentHour]);

  // Smart recommendation logic
  const generateRecommendation = useCallback(() => {
    const openWindow = findOpenTimeWindow();
    if (!openWindow) return null;

    const availableMinutes = (openWindow.end - openWindow.start) * 60;
    const incompleteTasks = tasks.filter(t => !t.completed);

    // Score tasks based on energy level and fit
    const scoredTasks = incompleteTasks.map(task => {
      let score = 0;
      
      // Fits within available time? Bonus points
      if (task.estimatedMinutes <= availableMinutes) {
        score += 50;
      }
      
      // Energy matching
      if (energy === 'low' && task.estimatedMinutes <= 25) {
        score += 30; // Short tasks for low energy
      } else if (energy === 'medium' && task.estimatedMinutes >= 20 && task.estimatedMinutes <= 45) {
        score += 25; // Medium tasks for medium energy
      } else if (energy === 'high' && task.estimatedMinutes >= 30) {
        score += 20; // Longer tasks for high energy
      }
      
    // Urgency bonus
      if (task.deadline.includes('today') || task.deadline.includes('tomorrow')) {
        score += 40;
      } else if (task.deadline.includes('Friday') || task.deadline.includes('this week')) {
        score += 20;
      }
      
      // Non-negotiable tasks get priority when deadline is near
      if (task.taskType === 'non-negotiable') {
        if (task.deadline.includes('today') || task.deadline.includes('tomorrow')) {
          score += 35; // Strong boost for imminent obligations
        } else {
          score += 15; // Moderate boost for other obligations
        }
      }
      
      // Goal-connected growth tasks get a bonus
      if (task.goalId && task.taskType === 'growth') {
        score += 20;
      } else if (task.goalId) {
        score += 10;
      }
      
      return { task, score };
    });

    // Sort by score and pick the best
    scoredTasks.sort((a, b) => b.score - a.score);
    const bestTask = scoredTasks[0]?.task;

    if (!bestTask) return null;

    // Calculate actual duration (fit within window)
    const taskDuration = Math.min(bestTask.estimatedMinutes, availableMinutes);
    const taskHours = taskDuration / 60;

    // Generate reason based on task type
    let reason = '';
    const relatedGoal = goals.find(g => g.id === bestTask.goalId);
    
    if (bestTask.taskType === 'non-negotiable') {
      // Non-negotiable: imply necessity without urgency
      if (bestTask.deadline.includes('today') || bestTask.deadline.includes('tomorrow')) {
        reason = `A core obligation ${bestTask.deadline}. This fits well in your open time.`;
      } else {
        reason = `This is a core commitment approaching its deadline. Good time to make progress.`;
      }
    } else if (bestTask.taskType === 'growth' && relatedGoal) {
      // Growth: imply opportunity
      reason = `You have space right now to advance "${relatedGoal.title}". A meaningful use of this time.`;
    } else if (relatedGoal) {
      reason = `Supports your goal "${relatedGoal.title}" and matches your ${energy} energy level.`;
    } else if (energy === 'low') {
      reason = `A lighter task that's easy to start when energy is low.`;
    } else {
      reason = `Good fit for your available ${Math.round(availableMinutes)} minutes and ${energy} energy.`;
    }

    return {
      task: bestTask,
      duration: taskDuration,
      reason,
      startHour: openWindow.start,
      endHour: openWindow.start + taskHours,
    };
  }, [tasks, energy, goals, findOpenTimeWindow]);

  const askForRecommendation = useCallback(() => {
    setIsRecommending(true);
    // Small delay for animation
    setTimeout(() => {
      const rec = generateRecommendation();
      setRecommendation(rec);
    }, 300);
  }, [generateRecommendation]);

  const acceptRecommendation = useCallback(() => {
    if (!recommendation) return;

    // Add task to calendar
    const newEvent: CalendarEvent = {
      id: `placed-${Date.now()}`,
      title: recommendation.task.title,
      startHour: recommendation.startHour,
      endHour: recommendation.endHour,
      type: 'placed',
      taskId: recommendation.task.id,
    };

    setEvents(prev => [...prev, newEvent]);
    setRecommendation(null);
    setIsRecommending(false);
  }, [recommendation]);

  const suggestAnother = useCallback(() => {
    // Mark current recommendation task as "skip for now" by temporarily excluding it
    const currentTaskId = recommendation?.task.id;
    setRecommendation(null);
    
    setTimeout(() => {
      const rec = generateRecommendation();
      // Simple: if we get the same task, try to find next best
      if (rec?.task.id === currentTaskId) {
        const otherTasks = tasks.filter(t => t.id !== currentTaskId && !t.completed);
        if (otherTasks.length > 0) {
          const fallback = otherTasks[0];
          const openWindow = findOpenTimeWindow();
          if (openWindow) {
            setRecommendation({
              task: fallback,
              duration: Math.min(fallback.estimatedMinutes, (openWindow.end - openWindow.start) * 60),
              reason: 'An alternative option for your open time.',
              startHour: openWindow.start,
              endHour: openWindow.start + Math.min(fallback.estimatedMinutes, (openWindow.end - openWindow.start) * 60) / 60,
            });
          }
        }
      } else {
        setRecommendation(rec);
      }
    }, 200);
  }, [recommendation, generateRecommendation, tasks, findOpenTimeWindow]);

  const dismissRecommendation = useCallback(() => {
    setRecommendation(null);
    setIsRecommending(false);
  }, []);

  const openTimeWindow = useMemo(() => findOpenTimeWindow(), [findOpenTimeWindow]);

  return {
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
  };
}

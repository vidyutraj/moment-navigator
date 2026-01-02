import { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  EnergyLevel, 
  LongTermGoal, 
  CalendarEvent, 
  Task, 
  Recommendation 
} from '@/types/clarity';
import { api } from '@/services/api';
import { placeholderGoals, placeholderEvents, placeholderTasks } from '@/data/placeholderData';
import { formatESTDate, getCurrentEST, getESTHour } from '@/lib/timezone';

export function useClarity() {
  const [goals, setGoals] = useState<LongTermGoal[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [energy, setEnergy] = useState<EnergyLevel>('medium');
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [isRecommending, setIsRecommending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [loadedGoals, loadedEvents, loadedTasks] = await Promise.all([
          api.getGoals(),
          api.getEvents(),
          api.getTasks(),
        ]);
        setGoals(loadedGoals);
        setEvents(loadedEvents);
        setTasks(loadedTasks);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Get current hour in Eastern Time
  const currentHour = useMemo(() => {
    return getESTHour();
  }, []);

  // Filter events for today (EST)
  const todayEvents = useMemo(() => {
    const today = formatESTDate(getCurrentEST());
    return events.filter(e => {
      const eventDate = e.date || formatESTDate(getCurrentEST());
      return eventDate === today;
    });
  }, [events]);

  // Find the next open time window
  const findOpenTimeWindow = useCallback(() => {
    const sortedEvents = [...todayEvents].sort((a, b) => a.startHour - b.startHour);
    
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
  }, [todayEvents, currentHour]);

  // Smart recommendation logic
  const generateRecommendation = useCallback((excludeTaskIds: string[] = []) => {
    const openWindow = findOpenTimeWindow();
    if (!openWindow) return null;

    const availableMinutes = (openWindow.end - openWindow.start) * 60;
    const incompleteTasks = tasks.filter(t => !t.completed && !excludeTaskIds.includes(t.id));

    if (incompleteTasks.length === 0) return null;

    // Filter tasks based on energy level
    const energyFilteredTasks = incompleteTasks.filter(task => {
      // Low energy: filter out tasks longer than 30 minutes
      if (energy === 'low' && task.estimatedMinutes > 30) {
        return false;
      }
      // High energy: can handle any task, but prefer longer ones
      // Medium energy: can handle any task
      return true;
    });

    // If no tasks match energy filter, use all incomplete tasks
    const tasksToScore = energyFilteredTasks.length > 0 ? energyFilteredTasks : incompleteTasks;

    // Score tasks based on energy level and fit
    const scoredTasks = tasksToScore.map(task => {
      let score = 0;
      
      // Fits within available time? Bonus points
      if (task.estimatedMinutes <= availableMinutes) {
        score += 50;
      }
      
      // Energy matching (more refined)
      if (energy === 'low') {
        if (task.estimatedMinutes <= 25) {
          score += 30; // Short tasks for low energy
        } else {
          score -= 10; // Penalty for longer tasks when energy is low
        }
      } else if (energy === 'medium') {
        if (task.estimatedMinutes >= 20 && task.estimatedMinutes <= 45) {
          score += 25; // Medium tasks for medium energy
        }
      } else if (energy === 'high') {
        if (task.estimatedMinutes >= 30) {
          score += 20; // Longer tasks for high energy
        }
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
      setIsRecommending(false);
    }, 300);
  }, [generateRecommendation]);

  const acceptRecommendation = useCallback(async () => {
    if (!recommendation) return;

    try {
      const today = formatESTDate(getCurrentEST());
      const newEvent = await api.createEvent({
        title: recommendation.task.title,
        startHour: recommendation.startHour,
        endHour: recommendation.endHour,
        type: 'placed',
        taskId: recommendation.task.id,
        date: today,
      });
      setEvents(prev => [...prev, newEvent]);
      setRecommendation(null);
      setIsRecommending(false);
    } catch (error) {
      console.error('Error accepting recommendation:', error);
      alert('Failed to add event to calendar');
    }
  }, [recommendation]);

  const suggestAnother = useCallback(() => {
    if (!recommendation) return;
    
    // Exclude the current task and generate a new recommendation
    const currentTaskId = recommendation.task.id;
    setRecommendation(null);
    
    setTimeout(() => {
      const nextRec = generateRecommendation([currentTaskId]);
      if (nextRec) {
        setRecommendation(nextRec);
      } else {
        // If no other tasks available, just close the recommendation
        setIsRecommending(false);
      }
    }, 200);
  }, [recommendation, generateRecommendation]);

  const dismissRecommendation = useCallback(() => {
    setRecommendation(null);
    setIsRecommending(false);
  }, []);

  // CRUD operations for Goals
  const createGoal = useCallback(async (goalData: Omit<LongTermGoal, 'id'>) => {
    try {
      const newGoal = await api.createGoal(goalData);
      setGoals(prev => [...prev, newGoal]);
      return newGoal;
    } catch (error) {
      console.error('Error creating goal:', error);
      throw error;
    }
  }, []);

  const updateGoal = useCallback(async (id: string, updates: Partial<Omit<LongTermGoal, 'id'>>) => {
    try {
      const updatedGoal = await api.updateGoal(id, updates);
      setGoals(prev => prev.map(g => g.id === id ? updatedGoal : g));
      return updatedGoal;
    } catch (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    try {
      await api.deleteGoal(id);
      setGoals(prev => prev.filter(g => g.id !== id));
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }
  }, []);

  // CRUD operations for Events
  const createEvent = useCallback(async (eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const newEvent = await api.createEvent({
        ...eventData,
        date: eventData.date || today,
      });
      setEvents(prev => [...prev, newEvent]);
      return newEvent;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }, []);

  const updateEvent = useCallback(async (id: string, updates: Partial<Omit<CalendarEvent, 'id'>>) => {
    try {
      const updatedEvent = await api.updateEvent(id, updates);
      setEvents(prev => prev.map(e => e.id === id ? updatedEvent : e));
      return updatedEvent;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    try {
      await api.deleteEvent(id);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }, []);

  const moveEvent = useCallback(async (id: string, newStartHour: number, newEndHour: number) => {
    try {
      const updatedEvent = await api.moveEvent(id, newStartHour, newEndHour);
      setEvents(prev => prev.map(e => e.id === id ? updatedEvent : e));
      return updatedEvent;
    } catch (error) {
      console.error('Error moving event:', error);
      throw error;
    }
  }, []);

  // CRUD operations for Tasks
  const createTask = useCallback(async (taskData: Omit<Task, 'id'>) => {
    try {
      const newTask = await api.createTask(taskData);
      setTasks(prev => [...prev, newTask]);
      return newTask;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }, []);

  const updateTask = useCallback(async (id: string, updates: Partial<Omit<Task, 'id'>>) => {
    try {
      const updatedTask = await api.updateTask(id, updates);
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
      return updatedTask;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    try {
      await api.deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }, []);

  const completeTask = useCallback(async (id: string) => {
    try {
      const updatedTask = await api.completeTask(id);
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  }, []);

  const openTimeWindow = useMemo(() => findOpenTimeWindow(), [findOpenTimeWindow]);

  return {
    goals,
    events: todayEvents, // Only show today's events in calendar
    allEvents: events, // All events for reference
    tasks,
    energy,
    setEnergy,
    recommendation,
    isRecommending,
    openTimeWindow,
    currentHour,
    isLoading,
    // Recommendation actions
    askForRecommendation,
    acceptRecommendation,
    suggestAnother,
    dismissRecommendation,
    // Goal CRUD
    createGoal,
    updateGoal,
    deleteGoal,
    // Event CRUD
    createEvent,
    updateEvent,
    deleteEvent,
    moveEvent,
    // Task CRUD
    createTask,
    updateTask,
    deleteTask,
    completeTask,
  };
}

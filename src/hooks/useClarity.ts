import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  EnergyLevel, 
  LongTermGoal, 
  Task, 
  Recommendation,
  TimeWindow
} from '@/types/clarity';
import { api } from '@/services/api';
import { recommendTask } from '@/lib/recommendation';
import { getNextCalendarEvent, isCalendarAvailable } from '@/services/calendar';

export function useClarity() {
  const [goals, setGoals] = useState<LongTermGoal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [energy, setEnergy] = useState<EnergyLevel>('medium');
  const [isLoading, setIsLoading] = useState(true);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [isRecommending, setIsRecommending] = useState(false);
  const [timeWindow, setTimeWindow] = useState<TimeWindow | null>(null);
  const [showTimeConfirmation, setShowTimeConfirmation] = useState(false);
  const [calendarSuggestedEndTime, setCalendarSuggestedEndTime] = useState<Date | undefined>();
  const [calendarEventName, setCalendarEventName] = useState<string | undefined>();
  const previousEnergyRef = useRef<EnergyLevel>(energy);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [loadedGoals, loadedTasks] = await Promise.all([
          api.getGoals(),
          api.getTasks(),
        ]);
        setGoals(loadedGoals);
        setTasks(loadedTasks);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Auto-update recommendation when energy changes (if recommendation is active)
  useEffect(() => {
    // Skip on initial mount
    if (previousEnergyRef.current === energy) return;
    
    // If we have an active recommendation and energy changed, regenerate it
    // Only if we have a time window (recommendation session is active)
    if (recommendation && timeWindow && previousEnergyRef.current !== energy) {
      const availableMinutes = Math.round(
        (timeWindow.endTime.getTime() - timeWindow.startTime.getTime()) / (60 * 1000)
      );
      const newRec = recommendTask(tasks, energy, goals, [], availableMinutes, timeWindow.source);
      
      if (newRec) {
        setRecommendation(newRec);
      }
    }
    
    previousEnergyRef.current = energy;
  }, [energy, recommendation, tasks, goals, timeWindow]);

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
      // Remove goal reference from tasks
      setTasks(prev => prev.map(t => t.goalId === id ? { ...t, goalId: undefined } : t));
    } catch (error) {
      console.error('Error deleting goal:', error);
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

  // Recommendation functionality
  // Step 1: Fetch next calendar event and show time confirmation dialog
  const askForRecommendation = useCallback(async () => {
    // Clear any existing recommendation and time window (start fresh)
    setRecommendation(null);
    setTimeWindow(null);
    
    // DESIGN INVARIANT: Calendar data is advisory, not authoritative
    // Fetch next calendar event to suggest end time, but user can always override
    // Only attempt if we have a token (getNextCalendarEvent will handle validation)
    const hasToken = isCalendarAvailable();
    
    if (hasToken) {
      try {
        const now = new Date();
        const nextEvent = await getNextCalendarEvent(now);
        
        if (nextEvent) {
          // Use calendar event time as suggested end time (could be start or end depending on if it's happening)
          setCalendarSuggestedEndTime(nextEvent.startTime);
          setCalendarEventName(nextEvent.summary);
        } else {
          // No calendar event or calendar unavailable - will use system default
          setCalendarSuggestedEndTime(undefined);
          setCalendarEventName(undefined);
        }
      } catch (error) {
        // Calendar fetch failed - gracefully degrade to system default
        console.warn('Calendar fetch failed, using default:', error);
        setCalendarSuggestedEndTime(undefined);
        setCalendarEventName(undefined);
      }
    } else {
      // No token available - use system default
      setCalendarSuggestedEndTime(undefined);
      setCalendarEventName(undefined);
    }
    
    setShowTimeConfirmation(true);
  }, []);

  // Step 2: After time is confirmed, generate recommendation
  const handleTimeConfirmed = useCallback((confirmedTimeWindow: TimeWindow) => {
    setTimeWindow(confirmedTimeWindow);
    setShowTimeConfirmation(false);
    setIsRecommending(true);
    
    // Calculate available minutes from time window
    const availableMinutes = Math.round(
      (confirmedTimeWindow.endTime.getTime() - confirmedTimeWindow.startTime.getTime()) / (60 * 1000)
    );
    
    // Store source for explanation generation
    const timeWindowSource = confirmedTimeWindow.source;
    
    // Clear calendar suggestion state after confirmation
    setCalendarSuggestedEndTime(undefined);
    setCalendarEventName(undefined);
    
    // Small delay for smooth UI transition
    setTimeout(() => {
      // We need to pass timeWindowSource to the recommendation
      // For now, we'll attach it to the recommendation object after generation
      const rec = recommendTask(tasks, energy, goals, [], availableMinutes, timeWindowSource);
      setRecommendation(rec);
      setIsRecommending(false);
    }, 200);
  }, [tasks, energy, goals]);

  const acceptRecommendation = useCallback(() => {
    if (!recommendation) return;
    
    // Don't mark task as in progress - user can change their mind
    // Tasks should only be marked complete when explicitly marked as complete
    // Just clear the recommendation UI
    setRecommendation(null);
    setTimeWindow(null);
    setIsRecommending(false);
  }, [recommendation]);

  const suggestAnother = useCallback(() => {
    if (!recommendation || !timeWindow) return;
    
    // Exclude current recommendation and try again
    // Keep using the same time window for this session
    const excludedTaskIds = [recommendation.task.id];
    const availableMinutes = Math.round(
      (timeWindow.endTime.getTime() - timeWindow.startTime.getTime()) / (60 * 1000)
    );
    const nextRec = recommendTask(tasks, energy, goals, excludedTaskIds, availableMinutes, timeWindow.source);
    
    if (nextRec) {
      setRecommendation(nextRec);
    } else {
      // No more recommendations available
      setRecommendation(null);
      setTimeWindow(null); // Clear time window when no more recommendations
      setIsRecommending(false);
    }
  }, [recommendation, tasks, energy, goals, timeWindow]);

  const dismissRecommendation = useCallback(() => {
    // Clear recommendation and time window (session ends)
    setRecommendation(null);
    setTimeWindow(null);
    setIsRecommending(false);
  }, []);

  return {
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
    cancelTimeConfirmation: () => setShowTimeConfirmation(false),
    // Goal CRUD
    createGoal,
    updateGoal,
    deleteGoal,
    // Task CRUD
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    // Recommendation
    askForRecommendation,
    acceptRecommendation,
    suggestAnother,
    dismissRecommendation,
  };
}

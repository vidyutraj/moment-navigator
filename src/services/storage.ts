/**
 * LocalStorage-based persistence layer
 * Handles all data persistence for Clarity app
 */

import { LongTermGoal, CalendarEvent, Task } from '@/types/clarity';

const STORAGE_KEYS = {
  GOALS: 'clarity_goals',
  EVENTS: 'clarity_events',
  TASKS: 'clarity_tasks',
} as const;

// Initialize with default data if storage is empty
const initializeIfEmpty = <T>(key: string, defaultValue: T[]): T[] => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
    // Initialize with default data
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  } catch (error) {
    console.error(`Error initializing ${key}:`, error);
    return defaultValue;
  }
};

export const storageService = {
  // Goals
  getGoals: (defaultGoals: LongTermGoal[]): LongTermGoal[] => {
    return initializeIfEmpty(STORAGE_KEYS.GOALS, defaultGoals);
  },

  saveGoals: (goals: LongTermGoal[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    } catch (error) {
      console.error('Error saving goals:', error);
      throw new Error('Failed to save goals');
    }
  },

  // Events
  getEvents: (defaultEvents: CalendarEvent[]): CalendarEvent[] => {
    return initializeIfEmpty(STORAGE_KEYS.EVENTS, defaultEvents);
  },

  saveEvents: (events: CalendarEvent[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    } catch (error) {
      console.error('Error saving events:', error);
      throw new Error('Failed to save events');
    }
  },

  // Tasks
  getTasks: (defaultTasks: Task[]): Task[] => {
    return initializeIfEmpty(STORAGE_KEYS.TASKS, defaultTasks);
  },

  saveTasks: (tasks: Task[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
      throw new Error('Failed to save tasks');
    }
  },

  // Clear all data (for reset)
  clearAll: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEYS.GOALS);
      localStorage.removeItem(STORAGE_KEYS.EVENTS);
      localStorage.removeItem(STORAGE_KEYS.TASKS);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};


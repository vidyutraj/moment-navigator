/**
 * Backend API service layer
 * Provides CRUD operations for Goals, Events, and Tasks
 */

import { LongTermGoal, CalendarEvent, Task } from '@/types/clarity';
import { storageService } from './storage';
import { placeholderGoals, placeholderEvents, placeholderTasks } from '@/data/placeholderData';

// Helper to generate unique IDs
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Validation helpers
const validateGoal = (goal: Partial<LongTermGoal>): goal is LongTermGoal => {
  return !!(goal.title && goal.title.trim().length > 0);
};

const validateEvent = (event: Partial<CalendarEvent>): event is CalendarEvent => {
  return !!(
    event.title &&
    event.title.trim().length > 0 &&
    typeof event.startHour === 'number' &&
    typeof event.endHour === 'number' &&
    event.startHour >= 0 &&
    event.endHour <= 24 &&
    event.endHour > event.startHour
  );
};

const validateTask = (task: Partial<Task>): task is Task => {
  return !!(
    task.title &&
    task.title.trim().length > 0 &&
    typeof task.estimatedMinutes === 'number' &&
    task.estimatedMinutes > 0 &&
    task.deadline &&
    task.deadline.trim().length > 0 &&
    task.taskType
  );
};

class ClarityAPI {
  private goals: LongTermGoal[] = [];
  private events: CalendarEvent[] = [];
  private tasks: Task[] = [];

  constructor() {
    this.loadData();
  }

  // Initialize data from storage
  private loadData(): void {
    this.goals = storageService.getGoals(placeholderGoals);
    this.events = storageService.getEvents(placeholderEvents);
    this.tasks = storageService.getTasks(placeholderTasks);
  }

  // ==================== GOALS ====================

  async getGoals(): Promise<LongTermGoal[]> {
    return [...this.goals];
  }

  async createGoal(goalData: Omit<LongTermGoal, 'id'>): Promise<LongTermGoal> {
    if (!validateGoal(goalData)) {
      throw new Error('Invalid goal data');
    }

    const newGoal: LongTermGoal = {
      ...goalData,
      id: generateId(),
    };

    this.goals.push(newGoal);
    storageService.saveGoals(this.goals);
    return newGoal;
  }

  async updateGoal(id: string, updates: Partial<Omit<LongTermGoal, 'id'>>): Promise<LongTermGoal> {
    const index = this.goals.findIndex(g => g.id === id);
    if (index === -1) {
      throw new Error('Goal not found');
    }

    const updatedGoal = { ...this.goals[index], ...updates };
    
    if (!validateGoal(updatedGoal)) {
      throw new Error('Invalid goal data');
    }

    this.goals[index] = updatedGoal;
    storageService.saveGoals(this.goals);
    return updatedGoal;
  }

  async deleteGoal(id: string): Promise<void> {
    const index = this.goals.findIndex(g => g.id === id);
    if (index === -1) {
      throw new Error('Goal not found');
    }

    // Remove goal from tasks that reference it
    this.tasks = this.tasks.map(task => 
      task.goalId === id ? { ...task, goalId: undefined } : task
    );
    storageService.saveTasks(this.tasks);

    this.goals.splice(index, 1);
    storageService.saveGoals(this.goals);
  }

  // ==================== EVENTS ====================

  async getEvents(): Promise<CalendarEvent[]> {
    return [...this.events];
  }

  async createEvent(eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<CalendarEvent> {
    if (!validateEvent(eventData)) {
      throw new Error('Invalid event data');
    }

    const today = new Date().toISOString().split('T')[0];
    const eventDate = eventData.date || today;

    // Check for overlapping events on the same date
    const overlaps = this.events.some(e => {
      const eDate = e.date || today;
      return eDate === eventDate && 
        !(eventData.endHour <= e.startHour || eventData.startHour >= e.endHour);
    });
    
    if (overlaps && eventData.type === 'fixed') {
      // Allow overlaps for 'placed' events but warn for fixed
      console.warn('Event overlaps with existing event');
    }

    const now = new Date().toISOString();
    const newEvent: CalendarEvent = {
      ...eventData,
      date: eventDate,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    this.events.push(newEvent);
    storageService.saveEvents(this.events);
    return newEvent;
  }

  async updateEvent(id: string, updates: Partial<Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>>): Promise<CalendarEvent> {
    const index = this.events.findIndex(e => e.id === id);
    if (index === -1) {
      throw new Error('Event not found');
    }

    const updatedEvent = { 
      ...this.events[index], 
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    if (!validateEvent(updatedEvent)) {
      throw new Error('Invalid event data');
    }

    this.events[index] = updatedEvent;
    storageService.saveEvents(this.events);
    return updatedEvent;
  }

  async deleteEvent(id: string): Promise<void> {
    const index = this.events.findIndex(e => e.id === id);
    if (index === -1) {
      throw new Error('Event not found');
    }

    this.events.splice(index, 1);
    storageService.saveEvents(this.events);
  }

  // Move event (for drag and drop)
  async moveEvent(id: string, newStartHour: number, newEndHour: number): Promise<CalendarEvent> {
    const index = this.events.findIndex(e => e.id === id);
    if (index === -1) {
      throw new Error('Event not found');
    }

    const updatedEvent = {
      ...this.events[index],
      startHour: newStartHour,
      endHour: newEndHour,
    };

    if (!validateEvent(updatedEvent)) {
      throw new Error('Invalid event times');
    }

    this.events[index] = updatedEvent;
    storageService.saveEvents(this.events);
    return updatedEvent;
  }

  // ==================== TASKS ====================

  async getTasks(): Promise<Task[]> {
    return [...this.tasks];
  }

  async createTask(taskData: Omit<Task, 'id'>): Promise<Task> {
    if (!validateTask(taskData)) {
      throw new Error('Invalid task data');
    }

    const newTask: Task = {
      ...taskData,
      id: generateId(),
      completed: false,
    };

    this.tasks.push(newTask);
    storageService.saveTasks(this.tasks);
    return newTask;
  }

  async updateTask(id: string, updates: Partial<Omit<Task, 'id'>>): Promise<Task> {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Task not found');
    }

    const updatedTask = { ...this.tasks[index], ...updates };
    
    if (!validateTask(updatedTask)) {
      throw new Error('Invalid task data');
    }

    this.tasks[index] = updatedTask;
    storageService.saveTasks(this.tasks);
    return updatedTask;
  }

  async deleteTask(id: string): Promise<void> {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Task not found');
    }

    // Remove associated events
    this.events = this.events.filter(e => e.taskId !== id);
    storageService.saveEvents(this.events);

    this.tasks.splice(index, 1);
    storageService.saveTasks(this.tasks);
  }

  async completeTask(id: string): Promise<Task> {
    return this.updateTask(id, { completed: true });
  }

  async uncompleteTask(id: string): Promise<Task> {
    return this.updateTask(id, { completed: false });
  }
}

// Export singleton instance
export const api = new ClarityAPI();


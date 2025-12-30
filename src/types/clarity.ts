export type EnergyLevel = 'low' | 'medium' | 'high';

export interface LongTermGoal {
  id: string;
  title: string;
  description?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startHour: number;
  endHour: number;
  type: 'fixed' | 'placed';
  taskId?: string;
}

export type TaskType = 'non-negotiable' | 'growth' | 'general';

export interface Task {
  id: string;
  title: string;
  estimatedMinutes: number;
  deadline: string;
  goalId?: string;
  completed?: boolean;
  taskType: TaskType;
}

export interface Recommendation {
  task: Task;
  duration: number;
  reason: string;
  startHour: number;
  endHour: number;
}

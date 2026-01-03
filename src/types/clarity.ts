export type EnergyLevel = 'low' | 'medium' | 'high';

export interface LongTermGoal {
  id: string;
  title: string;
  description?: string;
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
  inProgress?: boolean; // Local state only, not persisted
}

export interface Recommendation {
  task: Task;
  reasonType: 'core-pressure' | 'growth-opportunity';
  explanation: string;
  duration: number; // minutes
}

/**
 * TimeWindow represents uninterrupted time available for the current session.
 * 
 * DESIGN INVARIANT: Calendar time is a suggestion, not a fact.
 * User-provided time always wins over calendar-suggested time.
 * 
 * This object exists only in local/session state and is never persisted.
 */
export interface TimeWindow {
  startTime: Date;      // Always now (when window was created)
  endTime: Date;        // User-confirmed end time
  source: 'user' | 'calendar-suggested' | 'system-default'; // How the end time was determined
  eventName?: string;   // If calendar-suggested, the name of the event at that time
  // DESIGN INVARIANT: User-provided time always wins over calendar-suggested or system-default
}

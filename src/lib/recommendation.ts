/**
 * Recommendation algorithm for Clarity
 * 
 * Core principle: Recommend exactly one task based on pressure, energy fit, and duration fit.
 * No urgency language, no hard priorities, just intelligent guidance.
 * 
 * DEBUG MODE:
 * To enable score breakdown logging in the browser console, run:
 *   window.__CLARITY_DEBUG__ = true;
 * 
 * This will log detailed scoring information for each task and the final selection.
 */

import { Task, EnergyLevel, LongTermGoal } from '@/types/clarity';

export interface Recommendation {
  task: Task;
  reasonType: 'core-pressure' | 'growth-opportunity';
  explanation: string;
  duration: number; // minutes
}

const AVAILABLE_MINUTES = 60; // Hardcoded for now

/**
 * Parses deadline string to estimate how soon the task is due
 * Returns days until due date (can be fractional for hours)
 * Returns null if no deadline can be determined
 */
function parseDeadline(deadline: string): number | null {
  const lower = deadline.toLowerCase();
  const now = new Date();
  
  // Custom date format: "due MM/DD/YYYY" or "due M/D/YYYY"
  const customDateMatch = deadline.match(/due\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/i);
  if (customDateMatch) {
    const [, month, day, year] = customDateMatch;
    const dueDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // Set to end of day (23:59:59) for comparison
    dueDate.setHours(23, 59, 59, 999);
    
    const diffMs = dueDate.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    
    // Return days until due (can be negative if overdue)
    return diffDays;
  }
  
  // Today - treat as 0.5 days (12 hours) for smooth pressure curve
  if (lower.includes('today')) {
    return 0.5;
  }
  
  // Tomorrow - treat as 1 day exactly
  if (lower.includes('tomorrow')) {
    return 1;
  }
  
  // Friday (this week's Friday)
  if (lower.includes('friday')) {
    const daysUntilFriday = (5 - now.getDay() + 7) % 7;
    return daysUntilFriday === 0 ? 7 : daysUntilFriday;
  }
  
  // This week
  if (lower.includes('this week')) {
    const daysUntilWeekend = 7 - now.getDay();
    return Math.max(1, daysUntilWeekend);
  }
  
  // No clear deadline
  if (lower.includes('when you have time') || lower.includes('someday')) {
    return null;
  }
  
  // Default: assume it's reasonably soon but not urgent
  // Use a moderate value that allows pressure to be calculated
  return 7;
}

/**
 * Computes pressure score for a task using a continuous curve
 * Higher score = more pressure to do it now
 * 
 * Uses a smooth mathematical function to avoid brittle boundary jumps.
 * The curve increases gradually as deadlines approach, then sharply in the final ~24 hours.
 */
function computePressure(task: Task, now: Date): number {
  // Growth tasks have low, consistent pressure
  // This provides a baseline that can win when core tasks are far off
  if (task.taskType === 'growth') {
    return 10;
  }
  
  // General tasks have minimal pressure
  if (task.taskType === 'general') {
    return 5;
  }
  
  // Core (non-negotiable) tasks: use continuous pressure curve
  if (task.taskType === 'non-negotiable') {
    const daysUntilDue = parseDeadline(task.deadline);
    
    // No deadline = moderate baseline pressure
    // This allows these tasks to be recommended but not dominate
    if (daysUntilDue === null) {
      return 20;
    }
    
    // Continuous pressure curve using inverse function
    // Properties:
    // - Starts at low pressure for far deadlines
    // - Increases gradually as deadline approaches
    // - Ramps sharply in the final ~24 hours
    // - Approaches but never exceeds 100
    //
    // The curve: pressure = minPressure + (100 - minPressure) / (1 + k * days^2)
    // Where k controls the steepness of the curve
    // As days decreases, the denominator decreases, so pressure increases
    
    const MIN_PRESSURE = 20; // Baseline pressure for very far deadlines
    const STEEPNESS = 2.0;   // Higher = steeper curve (more pressure sooner)
    
    // Convert days to a continuous value
    // Add 0.1 to avoid division by zero for very close deadlines
    const adjustedDays = Math.max(daysUntilDue, 0.1);
    
    // Inverse square curve: pressure increases as days decrease
    // When days is large (far deadline), denominator is large, so pressure is low
    // When days is small (close deadline), denominator is small, so pressure is high
    // This creates smooth, natural-feeling pressure that accelerates as deadline nears
    const pressure = MIN_PRESSURE + (100 - MIN_PRESSURE) / (1 + STEEPNESS * adjustedDays * adjustedDays);
    
    // Ensure we stay within bounds
    return Math.max(MIN_PRESSURE, Math.min(100, pressure));
  }
  
  return 10; // Default fallback
}

/**
 * Computes energy fit score
 * Higher score = better fit for current energy level
 */
function computeEnergyFit(task: Task, energy: EnergyLevel): number {
  const minutes = task.estimatedMinutes;
  
  if (energy === 'low') {
    // Prefer shorter, lighter tasks
    if (minutes <= 20) return 100;
    if (minutes <= 30) return 70;
    if (minutes <= 45) return 40;
    return 10; // Penalize long tasks when energy is low
  }
  
  if (energy === 'medium') {
    // Comfortable with medium-length tasks
    if (minutes >= 20 && minutes <= 45) return 100;
    if (minutes >= 15 && minutes <= 60) return 80;
    return 50; // Acceptable but not ideal
  }
  
  // High energy: can handle longer, complex tasks
  if (energy === 'high') {
    if (minutes >= 30) return 100;
    if (minutes >= 20) return 80;
    return 60; // Shorter tasks still fine, just not maximizing
  }
  
  return 50;
}

/**
 * Computes duration fit score
 * Higher score = better fit for available time
 */
function computeDurationFit(task: Task, availableMinutes: number): number {
  const taskMinutes = task.estimatedMinutes;
  
  // Perfect fit: task fits comfortably within available time
  if (taskMinutes <= availableMinutes * 0.9) {
    return 100;
  }
  
  // Tight fit: might need to rush or cut short
  if (taskMinutes <= availableMinutes) {
    return 70;
  }
  
  // Over budget: can't complete in available time
  // Penalize but don't eliminate (user might want to start anyway)
  const overage = taskMinutes - availableMinutes;
  return Math.max(10, 60 - overage * 2);
}

/**
 * Generates explanation for why this task was recommended
 * Focuses on time progression and opportunity, not urgency
 * References the confirmed time window naturally
 * 
 * DESIGN INVARIANT: When calendar-suggested window is used, reference it naturally
 * but never use urgency language or name specific events
 */
function generateExplanation(
  task: Task,
  reasonType: 'core-pressure' | 'growth-opportunity',
  goals: LongTermGoal[],
  daysUntilDue: number | null,
  pressure: number,
  endTime: Date,
  timeWindowSource?: 'user' | 'calendar-suggested' | 'system-default'
): string {
  const goal = task.goalId ? goals.find(g => g.id === task.goalId) : null;
  
  // Format end time naturally (e.g., "9:30 PM" or "tomorrow at 2 PM")
  const formatEndTime = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes > 0 ? `:${minutes.toString().padStart(2, '0')}` : '';
    
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return `${displayHours}${displayMinutes} ${ampm}`;
    }
    return `tomorrow at ${displayHours}${displayMinutes} ${ampm}`;
  };
  
  const timeBoundary = formatEndTime(endTime);
  
  // Helper to generate time-aware phrasing
  const getTimePhrase = (): string => {
    if (timeWindowSource === 'calendar-suggested') {
      // Reference calendar naturally without urgency
      return `This fits comfortably before your next commitment.`;
    }
    // For user-provided or system-default, use specific time boundary
    return `This fits comfortably before ${timeBoundary}.`;
  };

  if (reasonType === 'core-pressure') {
    // Reference time progression and narrowing choices, including time boundary
    if (daysUntilDue !== null) {
      if (daysUntilDue < 0.5) {
        // Today - within 12 hours
        const timePhrase = timeWindowSource === 'calendar-suggested'
          ? 'This fits comfortably before your next commitment'
          : `This fits comfortably before ${timeBoundary}`;
        return `${timePhrase}, and addressing it now preserves your options for later.`;
      } else if (daysUntilDue <= 1) {
        // Tomorrow - within 24 hours
        const timePhrase = timeWindowSource === 'calendar-suggested'
          ? 'the time you have before your next commitment'
          : `the time you have until ${timeBoundary}`;
        return `You have space now, before this becomes more constrained. This fits well in ${timePhrase}.`;
      } else if (daysUntilDue <= 3) {
        // Within next few days
        const timePhrase = timeWindowSource === 'calendar-suggested'
          ? 'the time before your next commitment'
          : `time until ${timeBoundary}`;
        return `This is approaching its deadline. Addressing it now while you have ${timePhrase} prevents future constraints.`;
      } else if (daysUntilDue <= 7) {
        // This week
        const timePhrase = timeWindowSource === 'calendar-suggested'
          ? 'your time before your next commitment'
          : `your time until ${timeBoundary}`;
        return `This core commitment is coming up. Starting now aligns well with ${timePhrase} and current energy.`;
      } else {
        // Further out but still recommended
        const timePhrase = timeWindowSource === 'calendar-suggested'
          ? 'the time before your next commitment'
          : `time until ${timeBoundary}`;
        return `This core obligation fits well with your available ${timePhrase} and current energy.`;
      }
    }
    // No specific deadline
    const timePhrase = timeWindowSource === 'calendar-suggested'
      ? 'the time before your next commitment'
      : `time until ${timeBoundary}`;
    return `This core obligation aligns with your available ${timePhrase} and energy right now.`;
  }
  
  // Growth opportunity
  // Emphasize the opportunity aspect, not pressure, including time boundary
  if (goal) {
    const timePhrase = timeWindowSource === 'calendar-suggested'
      ? 'the time before your next commitment'
      : `space right now until ${timeBoundary}`;
    return `You have ${timePhrase} to make progress toward "${goal.title}". This time aligns well with your energy.`;
  }
  const timePhrase = timeWindowSource === 'calendar-suggested'
    ? 'the time before your next commitment'
    : `space right now until ${timeBoundary}`;
  return `You have ${timePhrase} for this growth task, and it fits well with your current energy.`;
}

/**
 * Main recommendation function
 * Returns exactly one task recommendation, or null if no suitable tasks
 */
export function recommendTask(
  tasks: Task[],
  energy: EnergyLevel,
  goals: LongTermGoal[],
  excludeTaskIds: string[] = [],
  availableMinutes: number = AVAILABLE_MINUTES,
  timeWindowSource?: 'user' | 'calendar-suggested' | 'system-default'
): Recommendation | null {
  // Helper to check if a task is a reminder/general todo (not deadline-based)
  const isReminderTask = (task: Task) => {
    const deadline = task.deadline.toLowerCase();
    return deadline === 'reminder' || deadline === 'when you have time';
  };

  // Filter out completed tasks, in-progress tasks, excluded tasks, and reminder tasks
  const candidateTasks = tasks.filter(
    task => !task.completed && !task.inProgress && !excludeTaskIds.includes(task.id) && !isReminderTask(task)
  );
  
  if (candidateTasks.length === 0) {
    return null;
  }
  
  // Calculate end time for explanation (start time is always now)
  const now = new Date();
  
  // Score each task
  const scoredTasks = candidateTasks.map(task => {
    const pressure = computePressure(task, now);
    const energyFit = computeEnergyFit(task, energy);
    const durationFit = computeDurationFit(task, availableMinutes);
    
    // Combine scores with fixed weights (do not change)
    // Pressure: 50%, Energy Fit: 30%, Duration Fit: 20%
    const score = pressure * 0.5 + energyFit * 0.3 + durationFit * 0.2;
    
    // Determine reason type based on why it scored high
    const reasonType: 'core-pressure' | 'growth-opportunity' = 
      task.taskType === 'non-negotiable' && pressure > 50 
        ? 'core-pressure' 
        : 'growth-opportunity';
    
    // Dev-only: Log score breakdown for debugging
    // Only log in development mode and when explicitly enabled
    if (typeof window !== 'undefined' && (window as any).__CLARITY_DEBUG__) {
      const daysUntilDue = parseDeadline(task.deadline);
      console.log(`[Clarity Debug] Task: "${task.title}"`, {
        taskType: task.taskType,
        daysUntilDue: daysUntilDue !== null ? daysUntilDue.toFixed(2) : 'none',
        pressure: pressure.toFixed(2),
        energyFit: energyFit.toFixed(2),
        durationFit: durationFit.toFixed(2),
        finalScore: score.toFixed(2),
        reasonType,
      });
    }
    
    return {
      task,
      score,
      reasonType,
      pressure,
      energyFit,
      durationFit,
      daysUntilDue: parseDeadline(task.deadline),
    };
  });
  
  // Sort by score (highest first)
  scoredTasks.sort((a, b) => b.score - a.score);
  
  const best = scoredTasks[0];
  if (!best) {
    return null;
  }
  
  // Cap duration at available time
  const duration = Math.min(best.task.estimatedMinutes, availableMinutes);
  
  // Calculate end time for explanation (using the now we calculated earlier)
  const endTime = new Date(now.getTime() + availableMinutes * 60 * 1000);
  
  // Dev-only: Log final recommendation with score breakdown
  if (typeof window !== 'undefined' && (window as any).__CLARITY_DEBUG__) {
    console.log(`[Clarity Debug] Selected: "${best.task.title}"`, {
      finalScore: best.score.toFixed(2),
      availableMinutes,
      breakdown: {
        pressure: `${best.pressure.toFixed(2)} × 0.5 = ${(best.pressure * 0.5).toFixed(2)}`,
        energyFit: `${best.energyFit.toFixed(2)} × 0.3 = ${(best.energyFit * 0.3).toFixed(2)}`,
        durationFit: `${best.durationFit.toFixed(2)} × 0.2 = ${(best.durationFit * 0.2).toFixed(2)}`,
      },
      reasonType: best.reasonType,
    });
  }
  
  // Get time window source if available (will be passed from hook)
  // For now, we don't have this in the function signature, so we'll default
  // This will be enhanced when we pass timeWindow through the recommendation call chain
  return {
    task: best.task,
    reasonType: best.reasonType,
    explanation: generateExplanation(
      best.task, 
      best.reasonType, 
      goals, 
      best.daysUntilDue,
      best.pressure,
      endTime,
      timeWindowSource
    ),
    duration,
  };
}


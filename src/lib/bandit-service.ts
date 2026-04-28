import { BANDIT_SCHEDULES, ServerRegion, BanditWindow } from '@/data/bandit-schedule';

export interface NextWindowInfo {
  window: BanditWindow;
  targetDate: Date;
}

/**
 * Calculates the next available Bandit Assault window for a given region.
 * Handles day wrap-around logic.
 */
export function getNextWindow(region: ServerRegion, currentTime: Date = new Date()): NextWindowInfo {
  const schedule = BANDIT_SCHEDULES[region];
  const currentUTCHour = currentTime.getUTCHours();
  
  // Find the next hour in the schedule today that is strictly greater than the current hour
  let nextWindow = schedule.find(w => w.utcHour > currentUTCHour);
  let targetDate = new Date(currentTime);
  
  if (!nextWindow) {
    // Wrap to the first window of tomorrow
    nextWindow = schedule[0];
    targetDate.setUTCDate(targetDate.getUTCDate() + 1);
  }
  
  // Set the target date to the specific UTC hour
  targetDate.setUTCHours(nextWindow.utcHour, 0, 0, 0);
  
  return {
    window: nextWindow,
    targetDate
  };
}

/**
 * Returns remaining milliseconds until the target date.
 */
export function getRemainingTime(targetDate: Date, currentTime: Date = new Date()): number {
  return Math.max(0, targetDate.getTime() - currentTime.getTime());
}

export type BanditStatus = 'WAITING' | 'IMMINENT' | 'ROLLING';

/**
 * Determines the status of the bandit event based on time remaining.
 * ROLLING: First 10 minutes of the target window.
 * IMMINENT: 15 minutes leading up to the target window.
 * WAITING: Normal state.
 */
export function getBanditStatus(remainingMs: number, currentTime: Date = new Date()): BanditStatus {
  if (remainingMs <= 0) {
    // If we are at or past the target time, check if we are still in the 10-minute roll window
    const currentUTCMin = currentTime.getUTCMinutes();
    // Since getNextWindow always returns a future window (or wrap around), 
    // we only reach remainingMs <= 0 when the window has just started or we are inside it.
    if (currentUTCMin < 10) return 'ROLLING';
  }
  
  // 15 minutes = 900,000 ms
  if (remainingMs <= 15 * 60 * 1000) return 'IMMINENT';
  
  return 'WAITING';
}

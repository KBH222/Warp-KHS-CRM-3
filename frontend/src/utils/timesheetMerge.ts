/**
 * Timesheet merge utilities for handling concurrent updates
 */

export interface TimesheetDay {
  startTime: string;
  endTime: string;
  lunchMinutes: number;
  job: string;
  workType: string;
  totalHours: number;
}

export interface Timesheet {
  [key: string]: TimesheetDay;
}

export interface TimesheetWithMeta {
  [key: string]: TimesheetDay | { [key: string]: string } | undefined;
  _lastModified?: { [key: string]: string }; // ISO timestamps for each day
}

/**
 * Merges two timesheet objects, preserving non-conflicting data
 * and using timestamps to resolve conflicts
 */
export function mergeTimesheets(
  current: Timesheet | undefined,
  incoming: Timesheet | undefined,
  currentMeta?: { [key: string]: string },
  incomingMeta?: { [key: string]: string }
): Timesheet {
  console.log('Merging timesheets:', { current, incoming });
  
  // If no current timesheet, return incoming
  if (!current) return incoming || {};
  
  // If no incoming timesheet, return current
  if (!incoming) return current;
  
  const merged: Timesheet = {};
  const allDays = new Set([...Object.keys(current), ...Object.keys(incoming)]);
  
  allDays.forEach(day => {
    // Skip metadata fields
    if (day.startsWith('_')) return;
    
    const currentDay = current[day];
    const incomingDay = incoming[day];
    
    // If only one side has data for this day, use it
    if (!currentDay && incomingDay) {
      console.log(`Day ${day}: Using incoming (no current)`);
      merged[day] = incomingDay;
    } else if (currentDay && !incomingDay) {
      console.log(`Day ${day}: Using current (no incoming)`);
      merged[day] = currentDay;
    } else if (currentDay && incomingDay) {
      // Both have data - check if they're different
      if (isDayModified(currentDay, incomingDay)) {
        // Use timestamp metadata if available
        if (currentMeta && incomingMeta) {
          const currentTime = currentMeta[day] || '0';
          const incomingTime = incomingMeta[day] || '0';
          merged[day] = incomingTime > currentTime ? incomingDay : currentDay;
        } else {
          // Default to incoming (last write wins)
          console.log(`Day ${day}: Using incoming (modified)`);
          merged[day] = incomingDay;
        }
      } else {
        // Same data, use either
        console.log(`Day ${day}: Using current (unchanged)`);
        merged[day] = currentDay;
      }
    }
  });
  
  console.log('Merged result:', merged);
  return merged;
}

/**
 * Checks if a timesheet day has been modified
 */
function isDayModified(day1: TimesheetDay, day2: TimesheetDay): boolean {
  return (
    day1.startTime !== day2.startTime ||
    day1.endTime !== day2.endTime ||
    day1.lunchMinutes !== day2.lunchMinutes ||
    day1.job !== day2.job ||
    day1.workType !== day2.workType ||
    day1.totalHours !== day2.totalHours
  );
}

/**
 * Extracts only the days that have actual time entries
 */
export function getModifiedDays(timesheet: Timesheet): Timesheet {
  const modified: Timesheet = {};
  
  Object.entries(timesheet).forEach(([day, data]) => {
    // Only include days with actual time entries
    if (data.startTime || data.endTime || data.job || data.workType) {
      modified[day] = data;
    }
  });
  
  return modified;
}

/**
 * Adds timestamp metadata to track when each day was last modified
 */
export function addTimesheetMetadata(timesheet: Timesheet): TimesheetWithMeta {
  const withMeta: TimesheetWithMeta = { ...timesheet };
  const now = new Date().toISOString();
  const metadata: { [key: string]: string } = {};
  
  Object.keys(timesheet).forEach(day => {
    if (!day.startsWith('_') && timesheet[day]) {
      metadata[day] = now;
    }
  });
  
  withMeta._lastModified = metadata;
  return withMeta;
}

/**
 * Removes metadata fields from timesheet
 */
export function stripTimesheetMetadata(timesheet: TimesheetWithMeta): Timesheet {
  const clean: Timesheet = {};
  
  Object.entries(timesheet).forEach(([key, value]) => {
    if (!key.startsWith('_')) {
      clean[key] = value;
    }
  });
  
  return clean;
}
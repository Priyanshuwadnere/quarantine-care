import { TemperatureReading } from '../types/temperature';

export interface DailyStatus {
  date: string;
  isCompletedDay: boolean; // true if date < currentFacilityDate
  readings: TemperatureReading[];
  hasReading: boolean;
  hasFever: boolean;
  status: 'fever_free' | 'fever' | 'temp_missing' | 'in_progress';
  statusLabel: string;
  maxTemperature?: number;
}

export interface CureProgressResult {
  consecutiveFeverFreeDays: number; // 0, 1, 2, or 3
  qualifyingDates: string[]; // Dates that contributed to the current streak
  isEligible: boolean; // true if >= 3
  dailyStatuses: DailyStatus[];
  displayProgress: 'Day 0 of 3' | 'Day 1 of 3' | 'Day 2 of 3' | 'Day 3 of 3';
  summaryMessage: string;
}

/**
 * Generates an array of date strings between startDate and endDate (inclusive) in YYYY-MM-DD.
 */
export function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (isNaN(current.getTime()) || isNaN(end.getTime()) || current > end) {
    return [startDate];
  }

  while (current <= end) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Calculates cure progress for a patient according to the exact business rules:
 * - A day is fever-free only when: at least one valid reading exists AND all readings are < feverThreshold.
 * - Missing reading day = 'Temp Missing' and breaks/resets streak.
 * - Any fever reading resets the counter to 0.
 * - Three consecutive complete fever-free days = Eligible.
 * - Crucial timing rule: Current facility day does NOT count as a complete day until the boundary passes.
 *   However, if today has a fever reading, it resets the streak to 0 immediately.
 */
export function calculateCureProgress(
  admissionDate: string,
  readings: TemperatureReading[],
  currentFacilityDate: string,
  feverThreshold: number = 38.0
): CureProgressResult {
  // If admitted today or after
  const effectiveStartDate = admissionDate <= currentFacilityDate ? admissionDate : currentFacilityDate;
  const allDates = getDateRange(effectiveStartDate, currentFacilityDate);

  const dailyStatuses: DailyStatus[] = [];
  let streak = 0;
  let currentStreakDates: string[] = [];

  for (const date of allDates) {
    const isToday = date === currentFacilityDate;
    const dayReadings = readings.filter(r => r.facilityDate === date);
    const hasReading = dayReadings.length > 0;
    const hasFever = hasReading && dayReadings.some(r => r.temperature >= feverThreshold);
    const maxTemp = hasReading ? Math.max(...dayReadings.map(r => r.temperature)) : undefined;

    if (isToday) {
      // Current facility day
      if (hasFever) {
        // Fever today resets streak immediately
        streak = 0;
        currentStreakDates = [];
        dailyStatuses.push({
          date,
          isCompletedDay: false,
          readings: dayReadings,
          hasReading: true,
          hasFever: true,
          status: 'fever',
          statusLabel: 'Fever Detected Today',
          maxTemperature: maxTemp,
        });
      } else if (hasReading) {
        // Normal reading today, but day is still in progress
        dailyStatuses.push({
          date,
          isCompletedDay: false,
          readings: dayReadings,
          hasReading: true,
          hasFever: false,
          status: 'in_progress',
          statusLabel: 'Normal So Far (In Progress)',
          maxTemperature: maxTemp,
        });
      } else {
        // No reading today
        dailyStatuses.push({
          date,
          isCompletedDay: false,
          readings: [],
          hasReading: false,
          hasFever: false,
          status: 'in_progress',
          statusLabel: 'Awaiting Today\'s Reading',
        });
      }
    } else {
      // Completed past facility day
      if (!hasReading) {
        // Missing reading
        streak = 0;
        currentStreakDates = [];
        dailyStatuses.push({
          date,
          isCompletedDay: true,
          readings: [],
          hasReading: false,
          hasFever: false,
          status: 'temp_missing',
          statusLabel: 'Temp Missing',
        });
      } else if (hasFever) {
        // Fever recorded
        streak = 0;
        currentStreakDates = [];
        dailyStatuses.push({
          date,
          isCompletedDay: true,
          readings: dayReadings,
          hasReading: true,
          hasFever: true,
          status: 'fever',
          statusLabel: 'Fever',
          maxTemperature: maxTemp,
        });
      } else {
        // Fever-free completed day!
        streak += 1;
        currentStreakDates.push(date);
        dailyStatuses.push({
          date,
          isCompletedDay: true,
          readings: dayReadings,
          hasReading: true,
          hasFever: false,
          status: 'fever_free',
          statusLabel: 'Fever-Free',
          maxTemperature: maxTemp,
        });
      }
    }
  }

  // Cap display count between 0 and 3
  const finalCount = Math.min(streak, 3);
  const isEligible = finalCount >= 3;
  // If streak >= 3, keep the last 3 qualifying dates
  const qualifyingDates = currentStreakDates.slice(-3);

  let displayProgress: 'Day 0 of 3' | 'Day 1 of 3' | 'Day 2 of 3' | 'Day 3 of 3';
  switch (finalCount) {
    case 1:
      displayProgress = 'Day 1 of 3';
      break;
    case 2:
      displayProgress = 'Day 2 of 3';
      break;
    case 3:
      displayProgress = 'Day 3 of 3';
      break;
    default:
      displayProgress = 'Day 0 of 3';
      break;
  }

  let summaryMessage = '';
  if (isEligible) {
    summaryMessage = 'Patient has completed 3 consecutive fever-free days and is eligible for discharge.';
  } else if (finalCount === 2) {
    summaryMessage = '2 complete fever-free days logged. Needs 1 more full fever-free day.';
  } else if (finalCount === 1) {
    summaryMessage = '1 complete fever-free day logged. Needs 2 more consecutive fever-free days.';
  } else {
    summaryMessage = 'Fever-free streak not yet established or was reset.';
  }

  return {
    consecutiveFeverFreeDays: finalCount,
    qualifyingDates,
    isEligible,
    dailyStatuses,
    displayProgress,
    summaryMessage,
  };
}

import { TemperatureReading } from '../types/temperature';

export const MIN_TEMP = 34.0;
export const MAX_TEMP = 43.0;
export const CRITICAL_HIGH_TEMP = 41.0;
export const CRITICAL_LOW_TEMP = 35.0;

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
  isCritical?: boolean;
  criticalMessage?: string;
}

/**
 * Validates entered temperature value.
 * Must be between 34.0°C and 43.0°C with at most one decimal place.
 */
export function validateTemperature(value: number | string): ValidationResult {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return {
      isValid: false,
      errorMessage: 'Please enter a valid numeric temperature.',
    };
  }

  // Check decimal places
  const strVal = num.toString();
  if (strVal.includes('.')) {
    const decimals = strVal.split('.')[1];
    if (decimals.length > 1) {
      return {
        isValid: false,
        errorMessage: 'Temperature can only have up to 1 decimal place.',
      };
    }
  }

  // Range validation: 34.0 to 43.0
  if (num < MIN_TEMP || num > MAX_TEMP) {
    return {
      isValid: false,
      errorMessage: 'Value looks incorrect. Enter a reading between 34.0 and 43.0 °C.',
    };
  }

  // Critical value check
  const isCritical = num >= CRITICAL_HIGH_TEMP || num < CRITICAL_LOW_TEMP;
  const criticalMessage = isCritical ? 'Critical value. Confirm this is correct?' : undefined;

  return {
    isValid: true,
    isCritical,
    criticalMessage,
  };
}

/**
 * Checks if a reading already exists for today's facility date.
 */
export function getTodayReadings(
  readings: TemperatureReading[],
  facilityDate: string
): TemperatureReading[] {
  return readings.filter(r => r.facilityDate === facilityDate);
}

/**
 * Returns whether today has any readings recorded.
 */
export function hasReadingToday(
  readings: TemperatureReading[],
  facilityDate: string
): boolean {
  return getTodayReadings(readings, facilityDate).length > 0;
}

/**
 * Gets the latest reading recorded today.
 */
export function getLatestReadingToday(
  readings: TemperatureReading[],
  facilityDate: string
): TemperatureReading | undefined {
  const todayReadings = getTodayReadings(readings, facilityDate);
  if (todayReadings.length === 0) return undefined;
  return todayReadings[todayReadings.length - 1];
}

/**
 * Determines whether patient has fever today based on all readings recorded today.
 * If ANY reading today is >= threshold, patient is considered to have fever today.
 */
export function hasFeverToday(
  readings: TemperatureReading[],
  facilityDate: string,
  feverThreshold: number = 38.0
): boolean {
  const todayReadings = getTodayReadings(readings, facilityDate);
  if (todayReadings.length === 0) return false;
  return todayReadings.some(r => r.temperature >= feverThreshold);
}

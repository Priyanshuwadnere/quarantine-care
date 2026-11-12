import { describe, it, expect } from 'vitest';
import { calculateCureProgress } from '../utils/cureCounter';
import { TemperatureReading } from '../types/temperature';

function createMockReading(facilityDate: string, temp: number): TemperatureReading {
  return {
    id: `TR-${facilityDate}-${temp}`,
    patientId: 'PT-TEST',
    temperature: temp,
    recordedAt: `${facilityDate}T09:00:00Z`,
    facilityDate,
    recordedBy: 'nurse',
    recorderRole: 'nurse',
    isFever: temp >= 38.0,
  };
}

describe('Three-Day Cure Counter Logic', () => {
  const currentFacilityDate = '2026-11-12';
  const admissionDate = '2026-11-09';

  it('marks eligible after three complete fever-free days prior to today', () => {
    // Nov 9, 10, 11 are past days with normal temps
    const readings: TemperatureReading[] = [
      createMockReading('2026-11-09', 36.6),
      createMockReading('2026-11-10', 36.8),
      createMockReading('2026-11-11', 37.0),
    ];

    const result = calculateCureProgress(admissionDate, readings, currentFacilityDate, 38.0);
    expect(result.consecutiveFeverFreeDays).toBe(3);
    expect(result.isEligible).toBe(true);
    expect(result.displayProgress).toBe('Day 3 of 3');
    expect(result.qualifyingDates).toEqual(['2026-11-09', '2026-11-10', '2026-11-11']);
  });

  it('resets counter to zero when any fever reading is recorded', () => {
    // Nov 9 normal, Nov 10 fever, Nov 11 normal
    const readings: TemperatureReading[] = [
      createMockReading('2026-11-09', 36.6),
      createMockReading('2026-11-10', 38.5), // fever!
      createMockReading('2026-11-11', 36.9),
    ];

    const result = calculateCureProgress(admissionDate, readings, currentFacilityDate, 38.0);
    // Nov 10 resets to 0, then Nov 11 gives 1 day
    expect(result.consecutiveFeverFreeDays).toBe(1);
    expect(result.isEligible).toBe(false);
    expect(result.displayProgress).toBe('Day 1 of 3');
    expect(result.qualifyingDates).toEqual(['2026-11-11']);
  });

  it('does not count a missing temperature day and resets consecutive streak', () => {
    // Nov 9 normal, Nov 10 missing, Nov 11 normal
    const readings: TemperatureReading[] = [
      createMockReading('2026-11-09', 36.6),
      // No reading on Nov 10 (Temp Missing)
      createMockReading('2026-11-11', 36.9),
    ];

    const result = calculateCureProgress(admissionDate, readings, currentFacilityDate, 38.0);
    expect(result.consecutiveFeverFreeDays).toBe(1);
    expect(result.isEligible).toBe(false);
    expect(result.displayProgress).toBe('Day 1 of 3');

    const nov10Status = result.dailyStatuses.find(d => d.date === '2026-11-10');
    expect(nov10Status?.status).toBe('temp_missing');
    expect(nov10Status?.statusLabel).toBe('Temp Missing');
  });

  it('handles duplicate readings on same day: if one is fever, the day is considered fever', () => {
    // Nov 9 normal, Nov 10 has morning normal (37.0) and afternoon fever (38.4)
    const readings: TemperatureReading[] = [
      createMockReading('2026-11-09', 36.6),
      createMockReading('2026-11-10', 37.0),
      createMockReading('2026-11-10', 38.4), // afternoon spike!
      createMockReading('2026-11-11', 36.7),
    ];

    const result = calculateCureProgress(admissionDate, readings, currentFacilityDate, 38.0);
    expect(result.consecutiveFeverFreeDays).toBe(1);
    expect(result.isEligible).toBe(false);
  });

  it('current incomplete day must NOT count towards the three completed days', () => {
    // Nov 10 and Nov 11 normal (2 completed days), Nov 12 (today) has normal reading
    const readings: TemperatureReading[] = [
      createMockReading('2026-11-10', 36.6),
      createMockReading('2026-11-11', 36.8),
      createMockReading('2026-11-12', 36.5), // today's reading
    ];

    const result = calculateCureProgress('2026-11-10', readings, currentFacilityDate, 38.0);
    // Still in progress: Day 2 of 3! Only after facility day passes does it become 3
    expect(result.consecutiveFeverFreeDays).toBe(2);
    expect(result.isEligible).toBe(false);
    expect(result.displayProgress).toBe('Day 2 of 3');
  });

  it('fever today immediately resets the streak even if incomplete day', () => {
    // Nov 10 and Nov 11 normal, Nov 12 (today) has a fever reading
    const readings: TemperatureReading[] = [
      createMockReading('2026-11-10', 36.6),
      createMockReading('2026-11-11', 36.8),
      createMockReading('2026-11-12', 38.9), // fever today!
    ];

    const result = calculateCureProgress('2026-11-10', readings, currentFacilityDate, 38.0);
    expect(result.consecutiveFeverFreeDays).toBe(0);
    expect(result.isEligible).toBe(false);
    expect(result.displayProgress).toBe('Day 0 of 3');
  });

  it('uses configurable fever threshold correctly', () => {
    const readings: TemperatureReading[] = [
      createMockReading('2026-11-09', 37.8),
      createMockReading('2026-11-10', 37.8),
      createMockReading('2026-11-11', 37.8),
    ];

    // With standard 38.0°C: 37.8 is fever-free -> eligible
    const resStandard = calculateCureProgress(admissionDate, readings, currentFacilityDate, 38.0);
    expect(resStandard.isEligible).toBe(true);

    // With stricter 37.5°C threshold: 37.8 is considered fever -> not eligible
    const resStrict = calculateCureProgress(admissionDate, readings, currentFacilityDate, 37.5);
    expect(resStrict.isEligible).toBe(false);
    expect(resStrict.consecutiveFeverFreeDays).toBe(0);
  });
});
